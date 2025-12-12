/**
 * WEBHOOK MANAGER
 * Manages webhook notifications for generation events
 */

class WebhookManager {
    constructor() {
        this.webhookUrl = '';
        this.webhookSecret = '';
        this.enabled = false;
        this.events = {
            imageGenerationCompleted: true,
            imageGenerationFailed: true,
            videoGenerationCompleted: true,
            videoGenerationFailed: true,
            allGenerationsCompleted: true
        };

        // Load from storage
        this.loadFromStorage();
    }

    /**
     * Load webhook settings from localStorage
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem('webhookSettings');
            if (data) {
                const settings = JSON.parse(data);
                this.webhookUrl = settings.webhookUrl || '';
                this.webhookSecret = settings.webhookSecret || '';
                this.enabled = settings.enabled || false;
                this.events = settings.events || this.events;
            }
        } catch (error) {
            console.error('Error loading webhook settings:', error);
        }
    }

    /**
     * Save webhook settings to localStorage
     */
    saveToStorage() {
        try {
            const settings = {
                webhookUrl: this.webhookUrl,
                webhookSecret: this.webhookSecret,
                enabled: this.enabled,
                events: this.events,
                lastUpdated: Date.now()
            };
            localStorage.setItem('webhookSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving webhook settings:', error);
        }
    }

    /**
     * Configure webhook
     * @param {string} url - Webhook URL
     * @param {string} secret - Webhook secret for signature verification
     */
    configure(url, secret = '') {
        this.webhookUrl = url;
        this.webhookSecret = secret;
        this.enabled = !!url;
        this.saveToStorage();
    }

    /**
     * Toggle webhook event
     * @param {string} eventName - Event name
     * @param {boolean} enabled - Enable/disable
     */
    toggleEvent(eventName, enabled) {
        if (this.events.hasOwnProperty(eventName)) {
            this.events[eventName] = enabled;
            this.saveToStorage();
        }
    }

    /**
     * Generate HMAC signature for webhook payload
     * @param {Object} payload - Webhook payload
     * @returns {Promise<string>} Signature
     */
    async generateSignature(payload) {
        if (!this.webhookSecret) {
            return '';
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(payload));
        const key = encoder.encode(this.webhookSecret);

        // Use SubtleCrypto for HMAC-SHA256
        try {
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                key,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );

            const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);

            // Convert to hex string
            return Array.from(new Uint8Array(signature))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } catch (error) {
            console.error('Error generating signature:', error);
            return '';
        }
    }

    /**
     * Send webhook notification
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    async sendWebhook(event, data) {
        if (!this.enabled || !this.webhookUrl) {
            return;
        }

        // Check if event is enabled
        if (!this.events[event]) {
            return;
        }

        const payload = {
            event: event,
            timestamp: new Date().toISOString(),
            data: data
        };

        try {
            // Generate signature
            const signature = await this.generateSignature(payload);

            // Send webhook
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'User-Agent': 'ScriptToVideoGenerator/1.0'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                addLog('success', `Webhook sent: ${event}`);
                console.log('Webhook sent successfully:', event);
            } else {
                throw new Error(`Webhook failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Error sending webhook:', error);
            addLog('error', `Webhook failed: ${error.message}`);
        }
    }

    /**
     * Send image generation completed webhook
     * @param {Object} imageData - Image data
     */
    async notifyImageGenerated(imageData) {
        await this.sendWebhook('imageGenerationCompleted', {
            id: imageData.id,
            sceneId: imageData.sceneId,
            frameType: imageData.frameType,
            url: imageData.url,
            status: 'completed'
        });
    }

    /**
     * Send image generation failed webhook
     * @param {Object} errorData - Error data
     */
    async notifyImageFailed(errorData) {
        await this.sendWebhook('imageGenerationFailed', {
            id: errorData.id,
            sceneId: errorData.sceneId,
            frameType: errorData.frameType,
            error: errorData.error,
            status: 'failed'
        });
    }

    /**
     * Send video generation completed webhook
     * @param {Object} videoData - Video data
     */
    async notifyVideoGenerated(videoData) {
        await this.sendWebhook('videoGenerationCompleted', {
            id: videoData.id,
            paragraphIndex: videoData.paragraphIndex,
            sceneIndex: videoData.sceneIndex,
            url: videoData.url,
            duration: videoData.duration || 8,
            status: 'completed'
        });
    }

    /**
     * Send video generation failed webhook
     * @param {Object} errorData - Error data
     */
    async notifyVideoFailed(errorData) {
        await this.sendWebhook('videoGenerationFailed', {
            id: errorData.id,
            paragraphIndex: errorData.paragraphIndex,
            sceneIndex: errorData.sceneIndex,
            error: errorData.error,
            status: 'failed'
        });
    }

    /**
     * Send all generations completed webhook
     * @param {Object} summary - Generation summary
     */
    async notifyAllCompleted(summary) {
        await this.sendWebhook('allGenerationsCompleted', {
            totalScenes: summary.totalScenes,
            imagesGenerated: summary.imagesGenerated,
            videosGenerated: summary.videosGenerated,
            timeElapsed: summary.timeElapsed,
            status: 'completed'
        });
    }

    /**
     * Test webhook connection
     */
    async testWebhook() {
        if (!this.webhookUrl) {
            throw new Error('Webhook URL not configured');
        }

        const testPayload = {
            event: 'webhook.test',
            timestamp: new Date().toISOString(),
            data: {
                message: 'This is a test webhook from Script-to-Video Generator',
                test: true
            }
        };

        const signature = await this.generateSignature(testPayload);

        const response = await fetch(this.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'User-Agent': 'ScriptToVideoGenerator/1.0'
            },
            body: JSON.stringify(testPayload)
        });

        if (!response.ok) {
            throw new Error(`Webhook test failed: ${response.status}`);
        }

        return true;
    }

    /**
     * Get webhook configuration info HTML
     * @returns {string} HTML string
     */
    getWebhookInfoHTML() {
        return `
            <div class="webhook-info-card">
                <h4>📡 Webhook Information</h4>

                <div class="webhook-section">
                    <h5>How it works</h5>
                    <p>When configured, we will send HTTP POST requests to your webhook URL whenever certain events occur in your account.</p>
                </div>

                <div class="webhook-section">
                    <h5>Webhook Events</h5>
                    <ul class="webhook-events-list">
                        <li><span class="event-icon">✓</span> Image generation completed</li>
                        <li><span class="event-icon">✓</span> Image generation failed</li>
                        <li><span class="event-icon">✓</span> Video generation completed</li>
                        <li><span class="event-icon">✓</span> Video generation failed</li>
                        <li><span class="event-icon">✓</span> All generations completed</li>
                    </ul>
                </div>

                <div class="webhook-section">
                    <h5>Payload Format</h5>
                    <p>Webhook requests will be sent as JSON with the following structure:</p>
                    <pre class="webhook-payload-example">{
  "event": "imageGenerationCompleted",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "img_123",
    "sceneId": "scene_1",
    "url": "https://cdn.imagen.ai/...",
    "status": "completed"
  }
}</pre>
                </div>

                <div class="webhook-section">
                    <h5>Security</h5>
                    <p>We recommend using HTTPS URLs and implementing signature verification to ensure webhook authenticity.</p>
                    <p><small>Signatures are sent in the <code>X-Webhook-Signature</code> header using HMAC-SHA256.</small></p>
                </div>
            </div>
        `;
    }

    /**
     * Disable webhook
     */
    disable() {
        this.enabled = false;
        this.saveToStorage();
    }

    /**
     * Enable webhook
     */
    enable() {
        if (this.webhookUrl) {
            this.enabled = true;
            this.saveToStorage();
        }
    }

    /**
     * Get webhook status
     * @returns {Object} Status object
     */
    getStatus() {
        return {
            enabled: this.enabled,
            configured: !!this.webhookUrl,
            url: this.webhookUrl ? this.maskUrl(this.webhookUrl) : null,
            hasSecret: !!this.webhookSecret,
            events: this.events
        };
    }

    /**
     * Mask webhook URL for display
     * @param {string} url - URL to mask
     * @returns {string} Masked URL
     */
    maskUrl(url) {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            return `${urlObj.protocol}//${urlObj.host}${path.substring(0, 20)}...`;
        } catch {
            return url.substring(0, 30) + '...';
        }
    }
}

// ========== Export for module systems (optional) ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebhookManager;
}
