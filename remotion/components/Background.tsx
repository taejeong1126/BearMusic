import { memo } from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';

const Background = () => {
    return (
        <AbsoluteFill className="fixed inset-0">
            <Img className="absolute inset-0 w-full h-full object-cover" src={staticFile('image/album-cover-blur.webp')} />

            <AbsoluteFill
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.45) 100%), radial-gradient(circle at 25% 35%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 25%, transparent 45%)`
                }}
            />
        </AbsoluteFill>
    );
};

export default memo(Background);
