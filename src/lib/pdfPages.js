/**
 * The number of pages in a PDF the owner just picked, read in the browser, or null.
 *
 * <p>The book form asked the owner to type it, which nobody knows offhand and which the reader's
 * progress («صفحة 40 من 312») and the goals' page pace are computed from. The file already says.
 * pdf.js is imported on first use only, so the dashboard does not carry it for every visit; null
 * on any failure (a damaged or encrypted file), and the form then asks as it used to.
 */
/**
 * Above this the file is not read for its count. pdf.js is handed the whole file, and a book may
 * be 500 MB — on a phone that is memory the upload itself needs. The form asks instead.
 */
export const COUNT_MAX_BYTES = 100 * 1024 * 1024;

export async function countPdfPages(file) {
    if (!file || file.size > COUNT_MAX_BYTES) return null;
    let task = null;
    try {
        const { pdfjs } = await import('react-pdf');
        // Always set, never "if unset": react-pdf ships a default (`pdf.worker.mjs`) that does not
        // resolve in this build, so a guard on emptiness skipped the fix and every count failed.
        // The same value PdfReader sets, so whichever runs first, the other agrees.
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url,
        ).toString();
        task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
        const pdf = await task.promise;
        return pdf.numPages || null;
    } catch {
        return null;
    } finally {
        task?.destroy();
    }
}
