import { memo, useMemo } from 'react';
import { AbsoluteFill, spring } from 'remotion';

const DarkOverlay = ({ fps, frame }: { fps: number; frame: number }) => {
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
        <>
            <AbsoluteFill className="relative w-288.75 h-full left-307" style={{ opacity }}>
                <div
                    className="absolute inset-0"
                    style={{
                        background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.12) 100%), linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.12) 100%)`
                    }}
                />
            </AbsoluteFill>

            <AbsoluteFill className="z-50 relative w-288.75 h-full left-307" style={{ opacity }}>
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.15) 8%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.15) 92%, rgba(0,0,0,0.30) 100%)`
                    }}
                />
            </AbsoluteFill>
        </>
    );
};

export default memo(DarkOverlay);
