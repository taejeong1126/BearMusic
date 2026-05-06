import { Composition } from 'remotion';
import { App } from './App';
import './index.css';

import song from '../public/song.json';

export const RemotionRoot: React.FC = () => {
    return (
        <Composition
            id="Composition"
            component={App}
            durationInFrames={20 * song.runningTime}
            fps={20}
            width={2560}
            height={1440}
            defaultProps={song}
        />
    );
};
