import { google } from 'googleapis';
import path from 'node:path';
import fs from 'node:fs';

import { TrackInfo } from './track.service';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const VIDEO_PATH = path.join(PUBLIC_DIR, 'video.mp4');

export default async function uploadVideo(track: TrackInfo): Promise<any | null> {
    try {
        const artist = track.artist
            .replace(/\([^)]*\)/g, '')
            .replace(/[()]/g, '')
            .trim();

        const title = track.title
            .replace(/\([^)]*\)/g, '')
            .replace(/[()]/g, '')
            .trim();

        const releaseDate = String(track.release).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1년 $2월 $3일');

        const tagArtist = artist.replace(/[^a-zA-Z0-9가-힣]/g, '');
        const tagTitle = title.replace(/[^a-zA-Z0-9가-힣]/g, '');

        const oauth2Client = new google.auth.OAuth2(process.env.CLIENT_ID!, process.env.CLIENT_SECRET!, 'http://localhost');

        oauth2Client.setCredentials({
            refresh_token: process.env.REFRESH_TOKEN!
        });

        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client
        });

        const res = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: {
                snippet: {
                    title: `${artist} - ${title} [${track.album}]ㅣ가사/Lyrics`,
                    description: [
                        `🎶 본 영상은 가사 자막 영상입니다, 수익 창출은 되지 않습니다.`,
                        ``,
                        `🎧 Title : ${title}`,
                        `🎤 Artist : ${artist}`,
                        `💿 Album : ${track.album}`,
                        `📅 Release : ${releaseDate}`,
                        ``,
                        `👨‍💻 Developed by Taejeong Kim`,
                        `GitHub: https://github.com/taejeong1126`,
                        `Email: taejeong654@gmail.com`,
                        ``,
                        `📝 영상 피드백을 받고 있습니다!`,
                        `Forms: https://forms.gle/66PL5PEjvJbtStQJ7`,
                        ``,
                        `#${tagArtist} #${tagTitle} #가사 #LYRICS #BEARMUSIC`
                    ].join('\n'),
                    tags: [tagArtist, tagTitle, '가사', 'LYRICS', 'BEARMUSIC'],
                    categoryId: '10'
                },
                status: {
                    selfDeclaredMadeForKids: false,
                    privacyStatus: 'public'
                }
            },
            media: {
                mimeType: 'video/mp4',
                body: fs.createReadStream(VIDEO_PATH)
            }
        });

        return res.data;
    } catch (error) {
        console.error('영상 업로드 실패', error);
        return null;
    }
}
