export interface PixelColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

export class PixelUtil {
    /**
     * Samples a pixel from the current page's canvas.
     */
    static async getPixel(page: any, x: number, y: number): Promise<PixelColor> {
        return await page.evaluate((px: number, py: number) => {
            const canvas = document.querySelector('canvas') as HTMLCanvasElement;
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') as any;
            if (!gl) throw new Error("No WebGL context found");
            
            const pixels = new Uint8Array(4);
            // WebGL coordinates start from bottom-left
            const webglY = canvas.height - py;
            gl.readPixels(px, webglY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            
            return { r: pixels[0], g: pixels[1], b: pixels[2], a: pixels[3] };
        }, x, y);
    }

    /**
     * Checks if a pixel color matches an expected color within a tolerance.
     */
    static isColorMatch(actual: PixelColor, expected: Partial<PixelColor>, tolerance: number = 10): boolean {
        const check = (a: number | undefined, b: number | undefined) => {
            if (a === undefined || b === undefined) return true;
            return Math.abs(a - b) <= tolerance;
        };

        return check(actual.r, expected.r) &&
               check(actual.g, expected.g) &&
               check(actual.b, expected.b) &&
               check(actual.a, expected.a);
    }

    static colorToString(color: PixelColor): string {
        return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    }

    static getColorDistance(c1: PixelColor, c2: Partial<PixelColor>): number {
        const dr = c1.r - (c2.r ?? c1.r);
        const dg = c1.g - (c2.g ?? c1.g);
        const db = c1.b - (c2.b ?? c1.b);
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }
}
