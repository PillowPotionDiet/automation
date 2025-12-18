/**
 * DOWNLOAD MANAGER
 * Handles individual and ZIP downloads of images and videos
 */

const DownloadManager = {
    /**
     * Download a single file
     */
    async downloadFile(url, filename) {
        try {
            Utils.showLoading(`Downloading ${filename}...`);

            const response = await fetch(url);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            Utils.hideLoading();
            Utils.showSuccess(`Downloaded ${filename}`);
        } catch (error) {
            console.error('Download error:', error);
            Utils.hideLoading();
            Utils.showError(`Failed to download ${filename}`);
        }
    },

    /**
     * Download all images as ZIP
     */
    async downloadAllImagesAsZIP(generatedImages) {
        try {
            Utils.showLoading('Preparing ZIP file...');

            // Load JSZip library if not already loaded
            if (typeof JSZip === 'undefined') {
                await this.loadJSZip();
            }

            const zip = new JSZip();

            // Fetch all images
            const imagePromises = Object.entries(generatedImages).map(async ([key, imageData]) => {
                try {
                    const response = await fetch(imageData.url);
                    const blob = await response.blob();
                    const filename = `${key}.png`;
                    zip.file(filename, blob);
                } catch (error) {
                    console.error(`Failed to fetch ${key}:`, error);
                }
            });

            await Promise.all(imagePromises);

            // Generate ZIP
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            // Download ZIP
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = 'geminigen_images.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            Utils.hideLoading();
            Utils.showSuccess('Downloaded all images as ZIP');
        } catch (error) {
            console.error('ZIP download error:', error);
            Utils.hideLoading();
            Utils.showError('Failed to create ZIP file');
        }
    },

    /**
     * Download all videos as ZIP
     */
    async downloadAllVideosAsZIP(generatedVideos) {
        try {
            Utils.showLoading('Preparing ZIP file...');

            // Load JSZip library if not already loaded
            if (typeof JSZip === 'undefined') {
                await this.loadJSZip();
            }

            const zip = new JSZip();

            // Fetch all videos and thumbnails
            const videoPromises = Object.entries(generatedVideos).map(async ([sceneNumber, videoData]) => {
                try {
                    // Add video
                    const videoResponse = await fetch(videoData.url);
                    const videoBlob = await videoResponse.blob();
                    zip.file(`clip_${String(sceneNumber).padStart(2, '0')}.mp4`, videoBlob);

                    // Add thumbnail if exists
                    if (videoData.thumbnail) {
                        const thumbResponse = await fetch(videoData.thumbnail);
                        const thumbBlob = await thumbResponse.blob();
                        zip.file(`clip_${String(sceneNumber).padStart(2, '0')}_thumbnail.jpg`, thumbBlob);
                    }
                } catch (error) {
                    console.error(`Failed to fetch scene ${sceneNumber}:`, error);
                }
            });

            await Promise.all(videoPromises);

            // Generate ZIP
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            // Download ZIP
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = 'geminigen_videos.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            Utils.hideLoading();
            Utils.showSuccess('Downloaded all videos as ZIP');
        } catch (error) {
            console.error('ZIP download error:', error);
            Utils.hideLoading();
            Utils.showError('Failed to create ZIP file');
        }
    },

    /**
     * Load JSZip library dynamically
     */
    async loadJSZip() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DownloadManager;
}
