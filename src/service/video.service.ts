import { renderMedia, selectComposition } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import { enableTailwind } from '@remotion/tailwind-v4';
import path from 'node:path';
import cliProgress from 'cli-progress';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const VIDEO_PATH = path.join(PUBLIC_DIR, 'video.mp4');

export default async function renderVideo(): Promise<string | null> {
    try {
        console.log('[STEP] Remotion 번들링');

        const bundleBar = new cliProgress.SingleBar(
            {
                format: '[PROGRESS] 번들링 |{bar}| {percentage}%'
            },
            cliProgress.Presets.shades_classic
        );

        bundleBar.start(100, 0);

        const remotionBundleUrl = await bundle({
            entryPoint: path.resolve('remotion/index.ts'),
            webpackOverride: (currentConfiguration) => enableTailwind(currentConfiguration),
            onProgress(progress) {
                bundleBar.update(Math.round(progress * 100));
            }
        });

        bundleBar.stop();
        console.log('[OK] Remotion 번들링 완료');

        console.log('[STEP] Composition 선택');

        const composition = await selectComposition({
            serveUrl: remotionBundleUrl,
            id: 'Composition'
        });

        console.log('[OK] Composition 선택 완료');

        console.log('[STEP] 영상 렌더링');

        const renderBar = new cliProgress.SingleBar(
            {
                format: '[PROGRESS] 렌더링 |{bar}| {percentage}%'
            },
            cliProgress.Presets.shades_classic
        );

        renderBar.start(100, 0);

        await renderMedia({
            serveUrl: remotionBundleUrl,
            composition,
            codec: 'h264',
            hardwareAcceleration: 'if-possible',
            outputLocation: VIDEO_PATH,
            concurrency: 2,
            timeoutInMilliseconds: 120000,
            imageFormat: 'jpeg',
            jpegQuality: 85,
            onProgress(progress) {
                renderBar.update(Math.round(progress.progress * 100));
            }
        });

        renderBar.stop();
        console.log('[OK] 영상 렌더링 완료');

        return VIDEO_PATH;
    } catch (error) {
        console.error('[FAIL] 영상 생성 실패', error);
        return null;
    }
}
