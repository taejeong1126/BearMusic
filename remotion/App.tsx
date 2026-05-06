import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate, Img } from 'remotion';
import { Audio } from '@remotion/media';
import { useMemo } from 'react';

import Background from './components/Background';
import AlbumInfo from './components/AlbumInfo';
import LyricsArea from './components/LyricsArea';

type LyricLine = {
    appearAt: number;
    text: string;
};

type SongInfo = {
    title: string;
    artist: string;
    album: string;
    runningTime: number;
    lyrics: LyricLine[];
};

const EMPTY_TEXT = 'ㅤ';

const getLyricText = (lyrics: LyricLine[], index: number) => {
    return index >= 0 && index < lyrics.length ? lyrics[index]!.text : EMPTY_TEXT;
};

export const App: React.FC<SongInfo> = ({ title, artist, album, lyrics = [] }) => {
    const { fps, durationInFrames } = useVideoConfig();
    const frame = useCurrentFrame();

    const delayFrame = Math.floor(fps * 1.2);
    const audioFrame = frame - delayFrame;
    const audioTime = audioFrame / fps;

    const currentIndex = useMemo(() => {
        if (audioTime < 0 || lyrics.length === 0) return -1;

        let left = 0;
        let right = lyrics.length - 1;
        let result = -1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);

            if (lyrics[mid]!.appearAt <= audioTime) {
                result = mid;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return result;
    }, [audioTime, lyrics]);

    const { currentLyric, prevLyrics, nextLyrics } = useMemo(() => {
        return {
            currentLyric: getLyricText(lyrics, currentIndex),
            prevLyrics: Array.from({ length: 4 }, (_, i) => getLyricText(lyrics, currentIndex - 4 + i)),
            nextLyrics: Array.from({ length: 4 }, (_, i) => getLyricText(lyrics, currentIndex + 1 + i))
        };
    }, [currentIndex, lyrics]);

    const currentOpacity = useMemo(() => {
        if (currentIndex < 0) return 0;

        const lyricStartFrame = delayFrame + lyrics[currentIndex]!.appearAt * fps;

        return interpolate(frame - lyricStartFrame, [0, 5], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp'
        });
    }, [frame, currentIndex, lyrics, fps, delayFrame]);

    const introOpacity = spring({
        frame,
        fps,
        from: 1,
        to: 0,
        config: { damping: 100, stiffness: 50 },
        delay: fps
    });

    const outroStartFrame = durationInFrames - fps;
    const outroOpacity = spring({
        frame: frame - outroStartFrame,
        fps,
        from: 0,
        to: 1,
        config: { damping: 100, stiffness: 50 }
    });

    const LogoOpacity = useMemo(
        () =>
            spring({
                frame,
                fps,
                from: 0,
                to: 1,
                delay: fps
            }),
        [frame, fps]
    );

    return (
        <AbsoluteFill style={{ fontFamily: 'PyeojinGothic-Bold' }}>
            <Sequence from={delayFrame}>
                <Audio src={staticFile('audio/youtube.mp3')} />
            </Sequence>

            <Background />

            {/* 인트로 */}
            <AbsoluteFill className="absolute inset-0 z-30 flex items-center justify-center bg-black/70" style={{ opacity: introOpacity }}>
                <div className="absolute bottom-16 text-white">
                    <div className="text-5xl font-bold text-white/80 tracking-wider">BEARMUSIC</div>
                </div>

                <div className="text-center">
                    <Img
                        src={staticFile('image/album-cover.webp')}
                        className="w-120 h-120 mx-auto rounded-2xl shadow-2xl mb-10 object-cover"
                    />
                    <h1 className="text-8xl font-bold text-white mb-4">{title}</h1>
                    <p className="text-5xl text-white/80 mb-2">{artist}</p>
                    <p className="text-4xl text-white/60">{album}</p>
                </div>
            </AbsoluteFill>

            {/* 앨범 정보 */}
            <Sequence durationInFrames={durationInFrames - fps}>
                <AlbumInfo album={album} artist={artist} title={title} fps={fps} frame={frame} />

                <AbsoluteFill style={{ opacity: LogoOpacity }}>
                    <div className="absolute left-5 bottom-5 z-80 text-white/70 text-2xl">BEARMUSIC</div>
                </AbsoluteFill>
            </Sequence>

            {/* 가사 영역 */}
            <Sequence from={delayFrame} durationInFrames={durationInFrames - fps - delayFrame}>
                <LyricsArea fps={fps} frame={frame} />

                <AbsoluteFill
                    className="absolute left-307 w-288.75 flex items-center justify-center text-white z-40"
                    style={{ fontFamily: 'PyeojinGothic-SemiBold' }}
                >
                    <div className="text-center px-12">
                        {prevLyrics.map((lyric, i) =>
                            lyric.trim() ? (
                                <div key={`prev-${i}`} className="relative w-288.75 mx-auto">
                                    <p
                                        className={`overflow-hidden font-normal text-[68px] leading-tight ${
                                            ['mb-12 opacity-10', 'mb-12 opacity-20', 'mb-12 opacity-30', 'mb-7 opacity-40'][i]
                                        }`}
                                    >
                                        {lyric}
                                    </p>
                                </div>
                            ) : null
                        )}

                        {currentLyric.trim() && (
                            <div className="relative w-full">
                                <div className="absolute inset-0 bg-black/55 z-10" />
                                <p
                                    className="text-[68px] leading-tight overflow-hidden break-normal relative z-20 text-center py-7.5"
                                    style={{ opacity: currentOpacity }}
                                >
                                    {currentLyric}
                                </p>
                            </div>
                        )}

                        {nextLyrics.map((lyric, i) =>
                            lyric.trim() ? (
                                <div key={`next-${i}`} className="relative w-288.75 mx-auto">
                                    <p
                                        className={`overflow-hidden text-[68px] leading-tight break-normal ${
                                            ['opacity-40 mt-7', 'opacity-30 mt-12', 'opacity-20 mt-12', 'opacity-10 mt-12'][i]
                                        }`}
                                    >
                                        {lyric}
                                    </p>
                                </div>
                            ) : null
                        )}
                    </div>
                </AbsoluteFill>
            </Sequence>

            {/* 아웃트로 */}
            <Sequence from={outroStartFrame} durationInFrames={fps}>
                <AbsoluteFill
                    className="absolute inset-0 z-30 flex items-center justify-center bg-black/70"
                    style={{ opacity: outroOpacity }}
                >
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
                        <div className="text-7xl font-bold text-white/80 xtracking-wider">BEARMUSIC</div>
                        <div className="text-4xl text-white/60">Thanks for watching</div>
                    </div>
                </AbsoluteFill>
            </Sequence>
        </AbsoluteFill>
    );
};
