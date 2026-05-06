#!/usr/bin/env node
import 'dotenv/config';

import axios from 'axios';
import { load } from 'cheerio';
import mongoose from 'mongoose';

import Pending from './models/pending';
import History from './models/history';

const INTERVAL = 1000 * 60 * 60 * 12;

type Track = {
    title: string;
    artist: string;
    trackId: string;
    artistId?: string | undefined;
    imgSrc?: string | undefined;
    albumId?: string | undefined;
};

(async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI 없음');
        }

        await mongoose.connect(process.env.MONGO_URI);

        let queue: Track[] = [];

        console.log(`${INTERVAL / 1000}초마다 차트 데이터를 가져옵니다.`);

        const run = async () => {
            console.log('새 차트 확인 중...');

            const types = ['nb', 'nfa', 'nindie', 'nrs', 'nost'];

            const results = await Promise.all(
                types.map(async (type) => {
                    const { data } = await axios.get<string>(`https://music.bugs.co.kr/chart/track/day/${type}`);
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
                })
            );

            let newQueue = results.flat();

            console.log(`총 ${newQueue.length}개의 트랙을 가져왔습니다.`);

            newQueue = newQueue.filter((item, index, self) => index === self.findIndex((target) => target.trackId === item.trackId));

            console.log(`중복 제거 후 ${newQueue.length}개의 트랙이 남았습니다.`);

            const newItems = newQueue.filter((item) => !queue.some((oldItem) => oldItem.trackId === item.trackId));

            console.log(`새로 발견된 트랙은 ${newItems.length}개입니다.`);

            for (const item of newItems) {
                const trackId = item.trackId;

                const existsInHistory = await History.findOne({ trackId }).lean().exec();
                const existsInPending = await Pending.findOne({ trackId }).lean().exec();

                if (existsInHistory || existsInPending) {
                    console.log(`${trackId} 이미 ${existsInHistory ? 'History' : 'Pending'}에 있습니다.`);
                    continue;
                }

                const trackRes = await axios.get<{
                    track: {
                        track_title: string;
                        artist_disp_nm: string;
                        album_title: string;
                        release_ymd: string;
                    };
                }>(`https://music.bugs.co.kr/player/track/${trackId}`);

                const lyricsRes = await axios.get<{ lyrics?: string }>(`https://music.bugs.co.kr/player/lyrics/T/${trackId}`);

                if (!lyricsRes.data.lyrics) {
                    console.log(`${trackId} 가사를 찾을 수 없습니다.`);
                    continue;
                }

                const trackInfo = trackRes.data.track;

                await Pending.create({
                    identifier: `${trackInfo.artist_disp_nm} - ${trackInfo.track_title} [${trackInfo.album_title}]`,
                    trackId
                });

                console.log(`${trackId} ${trackInfo.track_title} 추가 완료.`);
            }

            queue = newQueue;

            console.log('차트 업데이트 완료.');
        };

        await run();
        setInterval(run, INTERVAL);
    } catch (error) {
        console.error('실패:', error);

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        process.exit(1);
    }
})();
