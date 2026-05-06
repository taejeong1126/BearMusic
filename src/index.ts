import 'dotenv/config';
import mongoose from 'mongoose';
import cron from 'node-cron';
import fs from 'node:fs';
import path from 'node:path';

import Pending from './models/pending';
import History from './models/history';

import loadTrack from './service/track.service';
import renderImage from './service/image.service';
import renderAudio from './service/audio.service';
import renderVideo from './service/video.service';
import uploadVideo from './service/upload.service';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SONG_PATH = path.join(PUBLIC_DIR, 'song.json');

(async () => {
    await mongoose.connect(process.env['MONGO_URI']!);

    await runJob();
    cron.schedule('*/30 * * * *', runJob);
})();

let isRunning = false;

async function runJob() {
    if (isRunning) {
        console.log('[SKIP] 이미 작업 실행 중');
        return;
    }

    isRunning = true;

    try {
        let attempts = 0;
        let success = 0;

        while (success < 1 && attempts < 10) {
            attempts++;

            console.log(`\n[LOOP] attempts=${attempts}, success=${success}`);

            try {
                console.log('[STEP] Pending 조회');
                const queue = await Pending.findOne().lean().exec();
                if (!queue) {
                    console.log('[EXIT] queue 없음');
                    break;
                }

                console.log(`[QUEUE] trackId=${queue.trackId}, identifier=${queue.identifier}`);

                console.log('[STEP] Pending 삭제 + History 저장');
                await Pending.deleteMany({ trackId: queue.trackId }).exec();
                await new History({ identifier: queue.identifier, trackId: queue.trackId }).save();

                console.log('[STEP] 트랙 로드');
                const track = await loadTrack(queue.trackId);
                if (!track) {
                    console.log('[FAIL] track 없음');
                    continue;
                }

                console.log('[STEP] 이미지 생성');
                const image = await renderImage(track.albumImage);
                if (!image) {
                    console.log('[FAIL] 이미지 생성 실패');
                    continue;
                }

                console.log('[STEP] 오디오 생성');
                const audio = await renderAudio(track.id, track.title, track.artist);
                if (!audio) {
                    console.log('[FAIL] 오디오 생성 실패');
                    continue;
                }

                console.log('[STEP] song.json 생성');
                const song = {
                    title: track.title.replace(/\([^)]*\)|[()]/g, '').trim(),
                    artist: track.artist.replace(/\([^)]*\)/g, '').trim(),
                    album: track.album.trim(),
                    runningTime: audio,
                    lyrics: track.lyrics
                };

                fs.writeFileSync(SONG_PATH, JSON.stringify(song, null, 2), 'utf-8');
                console.log('[OK] song.json 저장 완료');

                console.log('[STEP] 영상 생성');
                const video = await renderVideo();
                if (!video) {
                    console.log('[FAIL] 영상 생성 실패');
                    continue;
                }

                console.log('[STEP] 유튜브 업로드');
                const upload = await uploadVideo(track);
                if (upload) {
                    console.log('[OK] 영상 업로드 완료');
                } else {
                    console.log('[FAIL] 업로드 실패');
                }

                success++;
                console.log(`[DONE] 성공 ${success}/1`);
            } catch (error) {
                console.error('[ERROR]', error);
            }
        }

        console.log(`[END] attempts=${attempts}, success=${success}`);

        if (attempts >= 10) {
            console.log('[EXIT] 최대 시도 횟수 초과');
            process.exit(1);
        }
    } finally {
        isRunning = false;
    }
}
