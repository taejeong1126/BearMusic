import sharp from 'sharp';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const IMAGE_DIR = path.join(PUBLIC_DIR, 'image');

const ALBUM_COVER_PATH = path.join(IMAGE_DIR, 'album-cover.webp');
const ALBUM_BLUR_PATH = path.join(IMAGE_DIR, 'album-cover-blur.webp');

export interface ImageResult {
    coverPath: string;
    blurPath: string;
}

export default async function renderImage(albumImage: Buffer): Promise<ImageResult | null> {
    try {
        const image = sharp(albumImage);
        const metadata = await image.metadata();

        if (!metadata.width || !metadata.height) {
            return null;
        }

        const scaleFactor = 1.2;
        const blurAmount = 66;

        const width = Math.round(metadata.width * scaleFactor);
        const height = Math.round(metadata.height * scaleFactor);

        await Promise.all([
            image.clone().webp({ quality: 80 }).toFile(ALBUM_COVER_PATH),
            image.clone().resize(width, height).blur(blurAmount).webp({ quality: 80 }).toFile(ALBUM_BLUR_PATH)
        ]);

        return {
            coverPath: ALBUM_COVER_PATH,
            blurPath: ALBUM_BLUR_PATH
        };
    } catch (error) {
        console.error('이미지 생성 실패', error);
        return null;
    }
}
