import YouTube from 'youtube-sr';
import youtubeDL from 'youtube-dl-exec';
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import child from 'child_process';
import util from 'util';

const execPromise = util.promisify(child.exec);

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const AUDIO_DIR = path.join(PUBLIC_DIR, 'audio');

const YOUTUBE_AUDIO_PATH = path.join(AUDIO_DIR, 'youtube.mp3');
const BUGS_AUDIO_PATH = path.join(AUDIO_DIR, 'bugs.wav');

const SLICE_YOUTUBE_PATH = path.join(AUDIO_DIR, 'slice-youtube.wav');
const MONO_BUGS_PATH = path.join(AUDIO_DIR, 'mono-bugs.wav');

interface Candidate {
    id: string;
    channel: string;
}

export default async function renderAudio(trackId: string, title: string, artist: string): Promise<number | null> {
    let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

    try {
        fs.mkdirSync(AUDIO_DIR, { recursive: true });

        const videos = await YouTube.search(`"Auto-generated" ${artist.replace(/\([^)]*\)/g, '').trim()} - ${title}`, {
            limit: 10,
            type: 'video'
        });

        const candidates: Candidate[] = [];

        for (const video of videos) {
            if (!video.id) continue;

            try {
                const detail = await YouTube.getVideo(`https://www.youtube.com/watch?v=${video.id}`);

                const id = detail.id;
                const channel = detail.channel?.name ?? '';
                const description = detail.description ?? '';

                if (!id) continue;
                if (!description.includes('Auto-generated')) continue;

                candidates.push({ id, channel });
            } catch {
                continue;
            }
        }

        if (candidates.length === 0) return null;

        const normalizedArtist = artist.replace(/\(.*?\)/g, '').trim();

        const matchIndex = candidates.findIndex((v) => v.channel.includes(normalizedArtist));

        if (matchIndex > 0) {
            const matched = candidates.splice(matchIndex, 1)[0];
            if (matched) candidates.unshift(matched);
        }

        const candidate = candidates[0];
        if (!candidate) return null;

        if (fs.existsSync(YOUTUBE_AUDIO_PATH)) {
            fs.unlinkSync(YOUTUBE_AUDIO_PATH);
        }

        await youtubeDL.exec(`https://www.youtube.com/watch?v=${candidate.id}`, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: YOUTUBE_AUDIO_PATH
        });

        if (!fs.existsSync(YOUTUBE_AUDIO_PATH)) {
            throw new Error(`YouTube 오디오 생성 실패: ${YOUTUBE_AUDIO_PATH}`);
        }

        browser = await chromium.launch({
            headless: true,
            executablePath: process.env['CHROME_PATH']!
        });

        const context = await browser.newContext();
        const playerPage = await context.newPage();

        await playerPage.goto('https://music.bugs.co.kr/newPlayer');

        const audioPromise = new Promise<Buffer>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);

            playerPage.on('response', async (response) => {
                if (!response.url().startsWith('https://w-aod.bugs.co.kr/raout')) return;

                const buffer = await response.body();

                clearTimeout(timeout);
                resolve(buffer);
            });
        });

        const trackPage = await context.newPage();

        await trackPage.goto(`https://music.bugs.co.kr/track/${trackId}`);

        await trackPage.evaluate(() => {
            window.open = () => null;
        });

        const selector = '#container > section.sectionPadding.summaryInfo.summaryTrack > div > div.basicInfo > p > a:nth-child(1)';

        await trackPage.waitForSelector(selector);
        await trackPage.click(selector);

        const bugsAudioBuffer = await audioPromise;

        fs.writeFileSync(BUGS_AUDIO_PATH, bugsAudioBuffer);

        if (!fs.existsSync(BUGS_AUDIO_PATH)) {
            throw new Error(`Bugs 오디오 생성 실패: ${BUGS_AUDIO_PATH}`);
        }

        await execPromise(`ffmpeg -y -i "${BUGS_AUDIO_PATH}" -ac 1 -ar 16000 -acodec pcm_s16le "${MONO_BUGS_PATH}"`);

        if (!fs.existsSync(MONO_BUGS_PATH)) {
            throw new Error(`mono-bugs.wav 생성 실패: ${MONO_BUGS_PATH}`);
        }

        await execPromise(`ffmpeg -y -ss 0 -t 55 -i "${YOUTUBE_AUDIO_PATH}" -ac 1 -ar 16000 -acodec pcm_s16le "${SLICE_YOUTUBE_PATH}"`);

        if (!fs.existsSync(SLICE_YOUTUBE_PATH)) {
            throw new Error(`slice-youtube.wav 생성 실패: ${SLICE_YOUTUBE_PATH}`);
        }

        const getFingerprint = async (filePath: string): Promise<number[]> => {
            let stdout = '';

            try {
                const result = await execPromise(`fpcalc -raw -length 55 "${filePath}"`);
                stdout = result.stdout;
            } catch (error: any) {
                stdout = error.stdout ?? '';

                if (!stdout.includes('FINGERPRINT=')) {
                    throw error;
                }
            }

            const line = stdout
                .trim()
                .split('\n')
                .find((l) => l.startsWith('FINGERPRINT='));

            if (!line) throw new Error(`Fingerprint 없음: ${filePath}`);

            return line.replace('FINGERPRINT=', '').split(',').map(Number).filter(Number.isFinite);
        };

        const [fpA, fpB] = await Promise.all([getFingerprint(SLICE_YOUTUBE_PATH), getFingerprint(MONO_BUGS_PATH)]);

        if (fpA.length === 0 || fpB.length === 0) return null;

        const len = Math.min(fpA.length, fpB.length);

        let dot = 0;
        let magA = 0;
        let magB = 0;

        for (let i = 0; i < len; i++) {
            const a = fpA[i]!;
            const b = fpB[i]!;

            dot += a * b;
            magA += a * a;
            magB += b * b;
        }

        const denom = Math.sqrt(magA) * Math.sqrt(magB);
        if (denom === 0) return null;

        const similarity = (dot / denom) * 100;

        console.log(`[STEP] 유사도 : ${similarity}`);

        if (similarity > 90) {
            const { parseFile } = await import('music-metadata');
            const audioMeta: any = await parseFile(YOUTUBE_AUDIO_PATH);
            const audioTime: number = Math.floor(audioMeta.format.duration);

            return audioTime;
        } else {
            return null;
        }
    } catch (error) {
        console.error('오디오 처리 실패', error);
        return null;
    } finally {
        await browser?.close();
    }
}
