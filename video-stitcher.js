/**
 * VIDEO STITCHER
 * Handles video stitching/concatenation
 *
 * Note: This uses a simplified approach without FFmpeg.js dependency
 * For production use, consider using FFmpeg.js or a server-side solution
 */

class VideoStitcher {
    constructor() {
        this.ffmpegLoaded = false;
        this.ffmpegInstance = null;
    }

    /**
     * Load FFmpeg.js (optional enhancement)
     * For now, we'll use a simpler approach
     */
    async loadFFmpeg() {
        // This would load FFmpeg.js from CDN
        // For simplicity, we'll skip this and use a basic approach
        console.log('FFmpeg.js loading skipped - using simplified stitching');
        return false;
    }

    /**
     * Stitch videos together (simplified version)
     * Note: This creates a playlist-style player rather than true stitching
     * For true stitching, you would need FFmpeg.js or server-side processing
     *
     * @param {string[]} videoUrls - Array of video URLs to stitch
     * @returns {Promise<Object>} Object with playlist and metadata
     */
    async stitchVideos(videoUrls) {
        if (!videoUrls || videoUrls.length === 0) {
            throw new Error('No videos to stitch');
        }

        // For a single video, just return it
        if (videoUrls.length === 1) {
            return {
                type: 'single',
                url: videoUrls[0],
                playlist: [videoUrls[0]],
                duration: 8, // Estimated
                videoCount: 1
            };
        }

        // For multiple videos, create a playlist object
        // This will be handled by the video player to auto-play sequentially
        return {
            type: 'playlist',
            playlist: videoUrls,
            duration: videoUrls.length * 8, // Estimated (8 seconds per video)
            videoCount: videoUrls.length,
            currentIndex: 0
        };
    }

    /**
     * Download all videos and create a simple concatenated blob
     * This is a basic implementation - for production, use FFmpeg.js
     *
     * @param {string[]} videoUrls - Array of video URLs
     * @returns {Promise<string>} Blob URL of combined video
     */
    async downloadAndConcatenate(videoUrls) {
        try {
            showInfo('Downloading videos... This may take a moment.');

            const blobs = [];
            for (let i = 0; i < videoUrls.length; i++) {
                const response = await fetch(videoUrls[i]);
                const blob = await response.blob();
                blobs.push(blob);

                showInfo(`Downloaded ${i + 1}/${videoUrls.length} videos`);
            }

            // Note: Simple blob concatenation won't work for MP4 files
            // This is a limitation of browser-based video processing
            // For proper concatenation, you need FFmpeg

            showWarning('Browser-based video stitching is limited. Videos will be available as a playlist.');

            // Return a playlist object instead
            return {
                type: 'playlist',
                playlist: videoUrls,
                blobs: blobs
            };

        } catch (error) {
            console.error('Error downloading videos:', error);
            throw error;
        }
    }

    /**
     * Create a video playlist player
     * @param {Object} stitchedData - Stitched video data
     * @param {HTMLElement} container - Container element
     * @returns {HTMLElement} Video player element
     */
    createPlaylistPlayer(stitchedData, container) {
        const playlist = stitchedData.playlist;
        let currentIndex = 0;

        // Create video element
        const video = document.createElement('video');
        video.controls = true;
        video.className = 'video-player';
        video.style.width = '100%';
        video.style.height = '100%';

        // Set first video
        video.src = playlist[0];

        // Auto-advance to next video
        video.addEventListener('ended', () => {
            currentIndex++;
            if (currentIndex < playlist.length) {
                video.src = playlist[currentIndex];
                video.play();
            } else {
                // Playlist complete
                currentIndex = 0; // Reset for replay
            }
        });

        // Add playlist controls
        const controls = this.createPlaylistControls(playlist, video);

        // Clear container and add elements
        container.innerHTML = '';
        container.appendChild(video);
        container.appendChild(controls);

        return video;
    }

    /**
     * Create playlist controls
     * @param {string[]} playlist - Video URLs
     * @param {HTMLVideoElement} video - Video element
     * @returns {HTMLElement} Controls element
     */
    createPlaylistControls(playlist, video) {
        const controls = document.createElement('div');
        controls.className = 'playlist-controls';
        controls.style.marginTop = '10px';
        controls.style.display = 'flex';
        controls.style.gap = '10px';
        controls.style.flexWrap = 'wrap';

        playlist.forEach((url, index) => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-small';
            btn.textContent = `Video ${index + 1}`;
            btn.onclick = () => {
                video.src = url;
                video.play();
            };
            controls.appendChild(btn);
        });

        return controls;
    }

    /**
     * Download playlist as ZIP file
     * @param {string[]} videoUrls - Video URLs
     * @param {string} zipName - ZIP filename
     */
    async downloadPlaylistAsZip(videoUrls, zipName = 'videos.zip') {
        showInfo('Preparing videos for download...');

        try {
            // For browser-based ZIP creation, you would need a library like JSZip
            // For now, we'll download videos individually

            for (let i = 0; i < videoUrls.length; i++) {
                await downloadFromURL(videoUrls[i], `video_${i + 1}.mp4`);
                await sleep(500); // Small delay between downloads
            }

            showSuccess(`Downloaded ${videoUrls.length} videos`);

        } catch (error) {
            console.error('Error downloading playlist:', error);
            showError('Failed to download videos');
        }
    }

    /**
     * Get video metadata
     * @param {string} videoUrl - Video URL
     * @returns {Promise<Object>} Video metadata
     */
    async getVideoMetadata(videoUrl) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                resolve({
                    duration: video.duration,
                    width: video.videoWidth,
                    height: video.videoHeight,
                    aspectRatio: video.videoWidth / video.videoHeight
                });
                video.remove();
            };

            video.onerror = () => {
                reject(new Error('Failed to load video metadata'));
                video.remove();
            };

            video.src = videoUrl;
        });
    }

    /**
     * Calculate total duration of playlist
     * @param {string[]} videoUrls - Video URLs
     * @returns {Promise<number>} Total duration in seconds
     */
    async calculateTotalDuration(videoUrls) {
        let totalDuration = 0;

        for (const url of videoUrls) {
            try {
                const metadata = await this.getVideoMetadata(url);
                totalDuration += metadata.duration;
            } catch (error) {
                console.error('Error getting metadata for:', url);
                // Estimate 8 seconds if metadata fails
                totalDuration += 8;
            }
        }

        return totalDuration;
    }

    /**
     * Validate video URL
     * @param {string} url - Video URL to validate
     * @returns {Promise<boolean>} True if valid
     */
    async validateVideoURL(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            const contentType = response.headers.get('content-type');
            return contentType && contentType.startsWith('video/');
        } catch {
            return false;
        }
    }
}

/**
 * Enhanced Video Player with Playlist Support
 */
class EnhancedVideoPlayer {
    constructor(containerElement) {
        this.container = containerElement;
        this.playlist = [];
        this.currentIndex = 0;
        this.videoElement = null;
        this.isPlaying = false;
    }

    /**
     * Load playlist into player
     * @param {string[]} videoUrls - Array of video URLs
     */
    loadPlaylist(videoUrls) {
        this.playlist = videoUrls;
        this.currentIndex = 0;
        this.render();
    }

    /**
     * Render the player
     */
    render() {
        this.container.innerHTML = `
            <div class="enhanced-video-player">
                <div class="video-container">
                    <video id="mainVideo" class="video-player" controls>
                        <source src="${this.playlist[0]}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
                <div class="playlist-info">
                    <span>Video <span id="currentVideoNum">1</span> of ${this.playlist.length}</span>
                    <span id="totalDuration">Total: ${this.playlist.length * 8}s (estimated)</span>
                </div>
                <div class="playlist-controls">
                    <button id="prevBtn" class="btn btn-small">⏮ Previous</button>
                    <button id="playPauseBtn" class="btn btn-small">▶️ Play</button>
                    <button id="nextBtn" class="btn btn-small">Next ⏭</button>
                    <button id="autoplayBtn" class="btn btn-small">🔁 Auto-play: OFF</button>
                </div>
            </div>
        `;

        this.videoElement = document.getElementById('mainVideo');
        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const autoplayBtn = document.getElementById('autoplayBtn');

        let autoplay = false;

        prevBtn.addEventListener('click', () => this.playPrevious());
        nextBtn.addEventListener('click', () => this.playNext());

        playPauseBtn.addEventListener('click', () => {
            if (this.videoElement.paused) {
                this.videoElement.play();
                playPauseBtn.textContent = '⏸ Pause';
            } else {
                this.videoElement.pause();
                playPauseBtn.textContent = '▶️ Play';
            }
        });

        autoplayBtn.addEventListener('click', () => {
            autoplay = !autoplay;
            autoplayBtn.textContent = autoplay ? '🔁 Auto-play: ON' : '🔁 Auto-play: OFF';
        });

        this.videoElement.addEventListener('ended', () => {
            if (autoplay && this.currentIndex < this.playlist.length - 1) {
                this.playNext();
            }
        });

        this.videoElement.addEventListener('play', () => {
            playPauseBtn.textContent = '⏸ Pause';
        });

        this.videoElement.addEventListener('pause', () => {
            playPauseBtn.textContent = '▶️ Play';
        });
    }

    /**
     * Play next video
     */
    playNext() {
        if (this.currentIndex < this.playlist.length - 1) {
            this.currentIndex++;
            this.videoElement.src = this.playlist[this.currentIndex];
            this.videoElement.play();
            document.getElementById('currentVideoNum').textContent = this.currentIndex + 1;
        }
    }

    /**
     * Play previous video
     */
    playPrevious() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.videoElement.src = this.playlist[this.currentIndex];
            this.videoElement.play();
            document.getElementById('currentVideoNum').textContent = this.currentIndex + 1;
        }
    }
}

// ========== Export for module systems (optional) ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VideoStitcher, EnhancedVideoPlayer };
}
