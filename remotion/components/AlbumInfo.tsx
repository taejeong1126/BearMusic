import { memo, useMemo } from 'react';
import { AbsoluteFill, Img, spring, staticFile } from 'remotion';

const AlbumInfo = ({ album, artist, title, fps, frame }: { album: string; artist: string; title: string; fps: number; frame: number }) => {
    const opacity = useMemo(
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
        <AbsoluteFill className="absolute top-30.75 left-33.25 z-20 text-white" style={{ opacity }}>
            <div>
                <p className="text-3xl mb-1.5">{album}</p>
                <h1 className="text-6xl font-bold mb-4">
                    {artist} - {title}
                </h1>
            </div>
            <div className="flex items-center gap-8">
                <Img
                    src={staticFile('image/album-cover.webp')}
                    className="w-247.5 h-247.5 rounded-xl object-cover shadow-xl"
                    loading="lazy"
                />
            </div>
        </AbsoluteFill>
    );
};

export default memo(AlbumInfo);
