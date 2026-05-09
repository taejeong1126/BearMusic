#!/usr/bin/env node

import 'dotenv/config';

import axios from 'axios';
import { load } from 'cheerio';
import mongoose from 'mongoose';
import pLimit from 'p-limit';

import Pending from './models/pending';
import History from './models/history';

const INTERVAL = 1000 * 60 * 60 * 3;
const CONCURRENCY = 8;

type Track = {
    title: string;
    artist: string;
    trackId: string;
    artistId?: string | undefined;
    imgSrc?: string | undefined;
    albumId?: string | undefined;
};

type PendingItem = {
    identifier: string;
    trackId: string;
};

const api = axios.create({
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0'
    }
});

const getChart = async (type: string): Promise<Track[]> => {
    const { data } = await api.get<string>(`https://music.bugs.co.kr/chart/track/day/${type}`);
    const $ = load(data);

    const tracks: Track[] = [];

    $('#CHARTday > table > tbody > tr').each((_, el) => {
        const $el = $(el);

        const title = $el.find('.title a').text().trim();
        const artist = $el.find('.artist a').text().trim();

        if (!title || !artist) return;

        const trackHref = $el.find('.trackInfo').attr('href') ?? '';
        const artistHref = $el.find('.artist a').attr('href') ?? '';
        const albumHref = $el.find('td:nth-child(9) > a').attr('href') ?? '';
        const imgSrcRaw = $el.find('.thumbnail img').attr('src') ?? '';

        const trackId = trackHref.split('/track/')[1]?.split('?')[0];
        const artistId = artistHref.split('/artist/')[1]?.split('?')[0];
        const albumId = albumHref.split('/album/')[1]?.split('?')[0];
        const imgSrc = imgSrcRaw.replace('50', 'original').split('?')[0];

        if (!trackId) return;

        tracks.push({
            title,
            artist,
            trackId,
            artistId,
            imgSrc,
            albumId
        });
    });

    return tracks.slice(0, 100);
};

const getPendingItem = async (trackId: string): Promise<PendingItem | null> => {
    try {
        const [trackRes, lyricsRes] = await Promise.all([
            api.get<{
                track: {
                    track_title: string;
                    artist_disp_nm: string;
                    album_title: string;
                    release_ymd: string;
                };
            }>(`https://music.bugs.co.kr/player/track/${trackId}`),

            api.get<{ lyrics?: string }>(`https://music.bugs.co.kr/player/lyrics/T/${trackId}`)
        ]);

        if (!lyricsRes.data.lyrics) {
            console.log(`[SKIP] ${trackId} 가사 없음`);
            return null;
        }

        const trackInfo = trackRes.data.track;

        return {
            identifier: `${trackInfo.artist_disp_nm} - ${trackInfo.track_title} [${trackInfo.album_title}]`,
            trackId
        };
    } catch (error) {
        console.error(`[FAIL] ${trackId} 상세 조회 실패`, error);
        return null;
    }
};

(async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI 없음');
        }

        await mongoose.connect(process.env.MONGO_URI);

        let queue: Track[] = [];

        console.log(`[START] ${INTERVAL / 1000}초마다 차트 데이터를 가져옵니다.`);

        const run = async () => {
            console.log('\n[STEP] 새 차트 확인 중...');

            const types = ['nb', 'nfa', 'nindie', 'nrs', 'nost', 'nkrock', 'nid', 'kpop', 'total'];

            const results = await Promise.all(types.map((type) => getChart(type)));

            const chartItems = results
                .flat()
                .filter((item, index, self) => index === self.findIndex((target) => target.trackId === item.trackId));

            console.log(`[INFO] 차트 수집 ${results.flat().length}개`);
            console.log(`[INFO] 중복 제거 후 ${chartItems.length}개`);

            const newItems = chartItems.filter((item) => !queue.some((oldItem) => oldItem.trackId === item.trackId));

            console.log(`[INFO] 새로 발견된 트랙 ${newItems.length}개`);

            if (newItems.length === 0) {
                queue = chartItems;
                console.log('[EXIT] 새 트랙 없음');
                return;
            }

            const trackIds = newItems.map((item) => item.trackId);

            const [historyItems, pendingItems] = await Promise.all([
                History.find({ trackId: { $in: trackIds } })
                    .select('trackId')
                    .lean()
                    .exec(),
                Pending.find({ trackId: { $in: trackIds } })
                    .select('trackId')
                    .lean()
                    .exec()
            ]);

            const existsSet = new Set<string>([
                ...historyItems.map((item) => String(item.trackId)),
                ...pendingItems.map((item) => String(item.trackId))
            ]);

            const targets = newItems.filter((item) => !existsSet.has(item.trackId));

            console.log(`[INFO] DB 중복 제거 후 ${targets.length}개`);

            if (targets.length === 0) {
                queue = chartItems;
                console.log('[EXIT] 추가할 트랙 없음');
                return;
            }

            const limit = pLimit(CONCURRENCY);

            const pendingItemsToCreate = (await Promise.all(targets.map((item) => limit(() => getPendingItem(item.trackId))))).filter(
                (item): item is PendingItem => item !== null
            );

            if (pendingItemsToCreate.length > 0) {
                await Pending.insertMany(pendingItemsToCreate, { ordered: false });
            }

            queue = chartItems;

            console.log(`[OK] ${pendingItemsToCreate.length}개 추가 완료`);
            console.log('[DONE] 차트 업데이트 완료');
        };

        await run();

        setInterval(() => {
            run().catch((error) => {
                console.error('[FAIL] 주기 실행 실패:', error);
            });
        }, INTERVAL);
    } catch (error) {
        console.error('[FAIL] 실행 실패:', error);

        process.exit(1);
    }
})();
