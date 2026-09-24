import { describe, expect, it } from 'vitest';
import { IMAGE_LIMITS, targetSize, shrinkImage } from '@/lib/imageResize';

/**
 * How big a picture is stored. The limits are the point: a logo is drawn at 24–64px and a phone
 * photo is thousands of pixels wide, while a cover spans the channel page and must stay sharp.
 */
describe('targetSize', () => {
    it('shrinks a phone photo chosen as a logo to 512 on its long side', () => {
        expect(targetSize(4032, 3024, IMAGE_LIMITS.logo)).toEqual({ width: 512, height: 384 });
    });

    it('keeps a cover at YouTube\'s recommended 2560 wide', () => {
        expect(targetSize(6000, 1875, IMAGE_LIMITS.banner)).toEqual({ width: 2560, height: 800 });
        // A tall cover is bounded by height instead, without distorting it.
        expect(targetSize(4000, 3000, IMAGE_LIMITS.banner)).toEqual({ width: 1920, height: 1440 });
    });

    it('never enlarges, and reports nothing to do for a picture that already fits', () => {
        expect(targetSize(400, 400, IMAGE_LIMITS.logo)).toBeNull();
        expect(targetSize(2560, 1440, IMAGE_LIMITS.banner)).toBeNull();
    });

    it('treats a picture with no size as nothing to do', () => {
        expect(targetSize(0, 0, IMAGE_LIMITS.logo)).toBeNull();
        expect(targetSize(NaN, 10, IMAGE_LIMITS.logo)).toBeNull();
    });
});

describe('shrinkImage', () => {
    // No canvas in this environment (no jsdom), which is the "some browser cannot do this" case.
    it('uploads the original when the browser cannot shrink it', async () => {
        const file = new File([new Uint8Array([1, 2, 3])], 'logo.png', { type: 'image/png' });
        await expect(shrinkImage(file, IMAGE_LIMITS.logo)).resolves.toBe(file);
    });
});
