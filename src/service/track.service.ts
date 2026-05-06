import axios from 'axios';

export interface LyricLine {
    appearAt: number;
    text: string;
}

export interface TrackInfo {
    id: string;
    title: string;
    artist: string;
    album: string;
    release: string;
    lyrics: LyricLine[];
    albumImage: Buffer;
}

export default async function loadTrack(trackId: string): Promise<TrackInfo | null> {
    try {
        const [trackRes, lyricsRes] = await Promise.all([
            axios.get(`https://music.bugs.co.kr/player/track/${trackId}`),
            axios.get(`https://music.bugs.co.kr/player/lyrics/T/${trackId}`)
        ]);

        const track = trackRes.data?.track;
        const rawLyrics: string = lyricsRes.data?.lyrics;

        if (!track || !rawLyrics) return null;

        const albumId = String(track.album_id);

        const lyrics: LyricLine[] = rawLyrics
            .split('＃')
            .map((item: string) => {
                const [appearAt, text] = item.split('|');
                return {
                    appearAt: Number(appearAt),
                    text: text ?? ''
                };
            })
            .filter((v) => Number.isFinite(v.appearAt) && v.text.length > 0);

        const albumImgRes = await axios.get(`https://image.bugsm.co.kr/album/images/original/${albumId.slice(0, -2)}/${albumId}.jpg`, {
            responseType: 'arraybuffer'
        });

        return {
            id: trackId,
            title: track.track_title,
            artist: track.artist_disp_nm,
            album: track.album_title,
            release: track.release_ymd,
            lyrics,
            albumImage: Buffer.from(albumImgRes.data)
        };
    } catch (error) {
        console.error('track 조회 실패', error);
        return null;
    }
}
