/**
 * MAIN APPLICATION
 * Script-to-Video Generator - Main Application Logic
 */

// ========== Global State ==========
const AppState = {
    // API and managers
    api: null,
    rateLimiter: null,
    consistencyManager: null,
    videoStitcher: null,
    webhookManager: null,

    // User input
    apiKey: '',
    script: '',
    paragraphCount: 3,
    scenesPerParagraph: 3,

    // Image generation settings
    imageModel: 'imagen-pro',
    aspectRatio: '16:9',
    artisticStyle: 'Photorealistic',

    // Video generation settings
    videoModel: 'veo-3.1',
    videoResolution: '1080p',
    videoAspectRatio: '16:9',

    // Processed data
    paragraphs: [],
    scenes: [],
    frames: [],

    // Generation tracking
    currentStep: 1,
    isGenerating: false,
    startTime: null,
    generatedImages: 0,
    generatedVideos: 0,
    totalImages: 0,
    totalVideos: 0,

    // Logs
    logs: []
};

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Initializing Script-to-Video Generator...');

    // Initialize managers
    AppState.rateLimiter = new RateLimiter();
    AppState.consistencyManager = new ConsistencyManager();
    AppState.videoStitcher = new VideoStitcher();
    AppState.webhookManager = new WebhookManager();

    // Load saved API key
    const savedApiKey = loadFromStorage('apiKey');
    if (savedApiKey) {
        document.getElementById('apiKey').value = savedApiKey;
        AppState.apiKey = savedApiKey;
        AppState.api = new GeminiGenAPI(savedApiKey);
    }

    // Load saved webhook settings
    const webhookStatus = AppState.webhookManager.getStatus();
    if (webhookStatus.configured) {
        document.getElementById('webhookUrl').value = AppState.webhookManager.webhookUrl;
        document.getElementById('webhookSecret').value = AppState.webhookManager.webhookSecret;
        updateWebhookStatus();
    }

    // Load saved image generation settings
    const savedImageModel = loadFromStorage('imageModel');
    if (savedImageModel) {
        document.getElementById('imageModel').value = savedImageModel;
        AppState.imageModel = savedImageModel;
    }

    const savedAspectRatio = loadFromStorage('aspectRatio');
    if (savedAspectRatio) {
        document.getElementById('aspectRatio').value = savedAspectRatio;
        AppState.aspectRatio = savedAspectRatio;
    }

    const savedArtisticStyle = loadFromStorage('artisticStyle');
    if (savedArtisticStyle) {
        document.getElementById('artisticStyle').value = savedArtisticStyle;
        AppState.artisticStyle = savedArtisticStyle;
    }

    // Load saved video generation settings
    const savedVideoModel = loadFromStorage('videoModel');
    if (savedVideoModel) {
        document.getElementById('videoModel').value = savedVideoModel;
        AppState.videoModel = savedVideoModel;
    }

    const savedVideoResolution = loadFromStorage('videoResolution');
    if (savedVideoResolution) {
        document.getElementById('videoResolution').value = savedVideoResolution;
        AppState.videoResolution = savedVideoResolution;
    }

    const savedVideoAspectRatio = loadFromStorage('videoAspectRatio');
    if (savedVideoAspectRatio) {
        document.getElementById('videoAspectRatio').value = savedVideoAspectRatio;
        AppState.videoAspectRatio = savedVideoAspectRatio;
    }

    // Setup event listeners
    setupEventListeners();

    // Load saved script if any
    const savedScript = loadFromStorage('lastScript');
    if (savedScript) {
        document.getElementById('scriptInput').value = savedScript;
    }

    // Update initial UI
    updateCalculations();
    AppState.rateLimiter.updateUI();

    console.log('Application initialized successfully');
}

// ========== Event Listeners ==========

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // API Key toggle visibility
    document.getElementById('toggleApiKey').addEventListener('click', toggleApiKeyVisibility);

    // Test connection
    document.getElementById('testConnection').addEventListener('click', testApiConnection);

    // API key change
    document.getElementById('apiKey').addEventListener('input', onApiKeyChange);

    // Script input
    document.getElementById('scriptInput').addEventListener('input', onScriptChange);

    // Configuration changes
    document.getElementById('paragraphCount').addEventListener('input', updateCalculations);
    document.getElementById('scenesPerParagraph').addEventListener('input', updateCalculations);

    // Image generation settings
    document.getElementById('imageModel').addEventListener('change', (e) => {
        AppState.imageModel = e.target.value;
        saveToStorage('imageModel', e.target.value);
    });
    document.getElementById('aspectRatio').addEventListener('change', (e) => {
        AppState.aspectRatio = e.target.value;
        saveToStorage('aspectRatio', e.target.value);
    });
    document.getElementById('artisticStyle').addEventListener('change', (e) => {
        AppState.artisticStyle = e.target.value;
        saveToStorage('artisticStyle', e.target.value);
    });

    // Video generation settings
    document.getElementById('videoModel').addEventListener('change', (e) => {
        AppState.videoModel = e.target.value;
        saveToStorage('videoModel', e.target.value);
    });
    document.getElementById('videoResolution').addEventListener('change', (e) => {
        AppState.videoResolution = e.target.value;
        saveToStorage('videoResolution', e.target.value);
    });
    document.getElementById('videoAspectRatio').addEventListener('change', (e) => {
        AppState.videoAspectRatio = e.target.value;
        saveToStorage('videoAspectRatio', e.target.value);
    });

    // Removed manual consistency toggles - now automatic

    // Webhook configuration
    document.getElementById('toggleWebhookSecret').addEventListener('click', toggleWebhookSecretVisibility);
    document.getElementById('saveWebhook').addEventListener('click', saveWebhookConfig);
    document.getElementById('testWebhook').addEventListener('click', testWebhookConnection);
    document.getElementById('webhookInfo').addEventListener('click', showWebhookInfo);

    // Webhook event toggles
    document.getElementById('event_imageComplete')?.addEventListener('change', (e) => {
        AppState.webhookManager.toggleEvent('imageGenerationCompleted', e.target.checked);
    });
    document.getElementById('event_imageFailed')?.addEventListener('change', (e) => {
        AppState.webhookManager.toggleEvent('imageGenerationFailed', e.target.checked);
    });
    document.getElementById('event_videoComplete')?.addEventListener('change', (e) => {
        AppState.webhookManager.toggleEvent('videoGenerationCompleted', e.target.checked);
    });
    document.getElementById('event_videoFailed')?.addEventListener('change', (e) => {
        AppState.webhookManager.toggleEvent('videoGenerationFailed', e.target.checked);
    });
    document.getElementById('event_allComplete')?.addEventListener('change', (e) => {
        AppState.webhookManager.toggleEvent('allGenerationsCompleted', e.target.checked);
    });

    // Generate button
    document.getElementById('generateBtn').addEventListener('click', startGeneration);

    // Breakdown buttons
    document.getElementById('approveBreakdown').addEventListener('click', approveBreakdown);
    document.getElementById('editBreakdown').addEventListener('click', editBreakdown);
    document.getElementById('resplitBreakdown').addEventListener('click', resplitScript);

    // Frame buttons
    document.getElementById('approveFrames').addEventListener('click', approveFrames);
    document.getElementById('backToScript').addEventListener('click', () => showStep(1));

    // Log controls
    document.getElementById('clearLog').addEventListener('click', clearLog);
    document.getElementById('exportLog').addEventListener('click', exportLog);

    // Collapse toggles
    document.getElementById('toggleBreakdown')?.addEventListener('click', () => toggleCollapse('scriptBreakdown', 'breakdownToggleIcon'));
    document.getElementById('toggleFrames')?.addEventListener('click', () => toggleCollapse('frameDefinitions', 'framesToggleIcon'));

    // Image modal
    document.querySelector('.modal-close')?.addEventListener('click', closeImageModal);
    document.getElementById('imageModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'imageModal') closeImageModal();
    });
}

// ========== Webhook Management ==========

/**
 * Toggle webhook secret visibility
 */
function toggleWebhookSecretVisibility() {
    const input = document.getElementById('webhookSecret');
    const btn = document.getElementById('toggleWebhookSecret');

    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

/**
 * Save webhook configuration
 */
function saveWebhookConfig() {
    const webhookUrl = document.getElementById('webhookUrl').value.trim();
    const webhookSecret = document.getElementById('webhookSecret').value.trim();

    if (!webhookUrl) {
        showError('Please enter a webhook URL');
        return;
    }

    // Validate URL format
    try {
        new URL(webhookUrl);
    } catch (error) {
        showError('Please enter a valid webhook URL');
        return;
    }

    // Configure webhook
    AppState.webhookManager.configure(webhookUrl, webhookSecret);

    // Update UI
    updateWebhookStatus();

    showSuccess('Webhook configuration saved successfully');
    addLog('info', `Webhook configured: ${webhookUrl}`);
}

/**
 * Test webhook connection
 */
async function testWebhookConnection() {
    const webhookUrl = document.getElementById('webhookUrl').value.trim();

    if (!webhookUrl) {
        showError('Please enter a webhook URL first');
        return;
    }

    try {
        showInfo('Testing webhook connection...');

        const success = await AppState.webhookManager.testWebhook();

        if (success) {
            showSuccess('Webhook test successful! Check your endpoint for the test payload.');
            addLog('success', 'Webhook test completed successfully');
        } else {
            showError('Webhook test failed. Please check your endpoint URL and try again.');
            addLog('error', 'Webhook test failed');
        }
    } catch (error) {
        console.error('Webhook test error:', error);
        showError('Webhook test failed: ' + error.message);
        addLog('error', `Webhook test error: ${error.message}`);
    }
}

/**
 * Show webhook information modal
 */
function showWebhookInfo() {
    const infoMessage = `
📡 WEBHOOK NOTIFICATIONS

Webhooks allow you to receive real-time notifications when generation tasks complete.

HOW IT WORKS:
1. Configure your webhook endpoint URL (must be publicly accessible)
2. Optionally add a secret for HMAC-SHA256 signature verification
3. Select which events you want to receive notifications for
4. When events occur, the app will send HTTP POST requests to your endpoint

PAYLOAD FORMAT:
{
  "event": "IMAGE_GENERATION_COMPLETED",
  "timestamp": "2025-12-12T10:30:00.000Z",
  "data": {
    "sceneId": "p0_s1",
    "frameType": "start",
    "imageUrl": "https://...",
    "paragraphIndex": 0,
    "sceneIndex": 1
  }
}

SIGNATURE VERIFICATION:
If you provide a webhook secret, each request will include an 'X-Webhook-Signature' header containing an HMAC-SHA256 signature of the payload. Use this to verify the authenticity of the webhook.

SUPPORTED EVENTS:
- IMAGE_GENERATION_COMPLETED: Image generated successfully
- IMAGE_GENERATION_FAILED: Image generation failed
- VIDEO_GENERATION_COMPLETED: Video generated successfully
- VIDEO_GENERATION_FAILED: Video generation failed
- ALL_GENERATIONS_COMPLETED: All tasks finished

NOTES:
- Your endpoint must respond with HTTP 200-299 status
- Webhooks timeout after 10 seconds
- Failed webhooks are logged but don't stop generation
    `.trim();

    // Show as alert for now (could be enhanced with a custom modal)
    alert(infoMessage);
}

/**
 * Update webhook status indicator
 */
function updateWebhookStatus() {
    const status = AppState.webhookManager.getStatus();
    const statusEl = document.getElementById('webhookStatus');

    if (status.configured) {
        statusEl.style.display = 'flex';
        statusEl.querySelector('.webhook-status-text').textContent = `Webhook active: ${status.eventsCount} events enabled`;

        // Show events config section
        const eventsConfig = document.getElementById('webhookEventsConfig');
        if (eventsConfig) {
            eventsConfig.style.display = 'block';
        }
    } else {
        statusEl.style.display = 'none';
    }
}

// ========== API Key Management ==========

/**
 * Toggle API key visibility
 */
function toggleApiKeyVisibility() {
    const input = document.getElementById('apiKey');
    const btn = document.getElementById('toggleApiKey');

    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

/**
 * Handle API key change
 */
function onApiKeyChange(e) {
    const apiKey = e.target.value.trim();
    AppState.apiKey = apiKey;

    // Save to storage
    saveToStorage('apiKey', apiKey);

    // Enable/disable generate button
    updateGenerateButton();

    // Create new API instance if key is valid
    if (validateApiKey(apiKey)) {
        AppState.api = new GeminiGenAPI(apiKey);
    }
}

/**
 * Test API connection
 */
async function testApiConnection() {
    if (!validateApiKey(AppState.apiKey)) {
        showError(getErrorMessage('API_KEY_REQUIRED'));
        return;
    }

    const statusEl = document.getElementById('connectionStatus');
    const statusIndicator = statusEl.querySelector('.status-indicator');
    const statusText = statusEl.querySelector('.status-text');

    // Show testing state
    statusIndicator.className = 'status-indicator status-testing';
    statusText.textContent = 'Testing...';

    try {
        AppState.api = new GeminiGenAPI(AppState.apiKey);
        const isConnected = await AppState.api.testConnection();

        if (isConnected) {
            statusIndicator.className = 'status-indicator status-connected';
            statusText.textContent = 'Connected';
            show('#apiUsageSection');
            showSuccess(getErrorMessage('CONNECTION_SUCCESS'));
            updateGenerateButton();
        } else {
            throw new Error('Connection failed');
        }
    } catch (error) {
        console.error('Connection test error:', error);
        statusIndicator.className = 'status-indicator status-disconnected';
        statusText.textContent = 'Connection Failed';
        showError(getErrorMessage('CONNECTION_FAILED'));
    }
}

// ========== Script Management ==========

/**
 * Handle script input change
 */
function onScriptChange(e) {
    AppState.script = e.target.value;
    const charCount = document.getElementById('charCount');
    charCount.textContent = AppState.script.length;

    // Save to storage
    saveToStorage('lastScript', AppState.script);

    updateGenerateButton();
}

/**
 * Update calculations when config changes
 */
function updateCalculations() {
    const paragraphCount = parseInt(document.getElementById('paragraphCount').value);
    const scenesPerParagraph = parseInt(document.getElementById('scenesPerParagraph').value);

    AppState.paragraphCount = paragraphCount;
    AppState.scenesPerParagraph = scenesPerParagraph;

    const totalScenes = paragraphCount * scenesPerParagraph;
    const estimatedRequests = totalScenes * 3; // 2 images + 1+ videos per scene

    document.getElementById('totalScenes').textContent = scenesPerParagraph;
    document.getElementById('totalParagraphs').textContent = paragraphCount;
    document.getElementById('calculatedScenes').textContent = totalScenes;
    document.getElementById('estimatedRequests').textContent = estimatedRequests;
}

/**
 * Update generate button state
 */
function updateGenerateButton() {
    const btn = document.getElementById('generateBtn');
    const hasApiKey = validateApiKey(AppState.apiKey);
    const hasScript = AppState.script.trim().length > 0;

    btn.disabled = !hasApiKey || !hasScript;
}

// ========== Automatic Consistency Analysis ==========

/**
 * Display extracted consistency profiles
 */
function displayExtractedProfiles() {
    const resultsDiv = document.getElementById('analysisResults');
    const profilesDiv = document.getElementById('extractedProfiles');

    // Get HTML from consistency manager
    profilesDiv.innerHTML = AppState.consistencyManager.getConsistencyInfoHTML();

    // Show the results section
    resultsDiv.style.display = 'block';

    // Log to console
    console.log('Extracted profiles:', AppState.consistencyManager.getExtractedProfiles());
}

// ========== Generation Flow ==========

/**
 * Start the generation process
 */
async function startGeneration() {
    if (!validateInputs()) {
        return;
    }

    // PHASE A: Automatic script analysis for consistency profiles
    try {
        addLog('info', '🤖 Starting automatic script analysis...');
        showInfo('Analyzing script for characters and environment...');

        await AppState.consistencyManager.analyzeScript(AppState.script, AppState.api);

        // Display the extracted profiles
        displayExtractedProfiles();

        showSuccess('Script analysis complete! Consistency profiles extracted.');

    } catch (error) {
        console.error('Analysis error:', error);
        showWarning('Script analysis had issues, but continuing with generation...');
    }

    // Split script into paragraphs and scenes
    splitScript();

    // Show breakdown
    showBreakdown();
    showStep(2);
}

/**
 * Validate all inputs
 */
function validateInputs() {
    if (!validateApiKey(AppState.apiKey)) {
        showError(getErrorMessage('API_KEY_REQUIRED'));
        return false;
    }

    if (AppState.script.trim().length === 0) {
        showError(getErrorMessage('SCRIPT_EMPTY'));
        return false;
    }

    return true;
}

/**
 * Split script into paragraphs and scenes
 */
function splitScript() {
    // Split into paragraphs
    const paragraphs = splitIntoParagraphs(AppState.script, AppState.paragraphCount);

    // Split each paragraph into scenes
    AppState.paragraphs = paragraphs.map((paragraph, pIndex) => {
        const scenes = splitIntoScenes(paragraph, AppState.scenesPerParagraph);

        return {
            index: pIndex,
            text: paragraph,
            scenes: scenes.map((scene, sIndex) => ({
                paragraphIndex: pIndex,
                sceneIndex: sIndex,
                text: scene,
                id: `p${pIndex}_s${sIndex}`
            }))
        };
    });

    console.log('Script split into paragraphs and scenes:', AppState.paragraphs);
}

/**
 * Show script breakdown
 */
function showBreakdown() {
    const container = document.getElementById('scriptBreakdown');
    container.innerHTML = '';

    AppState.paragraphs.forEach((paragraph, pIndex) => {
        const paragraphDiv = document.createElement('div');
        paragraphDiv.className = 'paragraph-item';

        let html = `<h4>▼ PARAGRAPH ${pIndex + 1} (${paragraph.scenes.length} scenes)</h4>`;

        paragraph.scenes.forEach((scene, sIndex) => {
            html += `
                <div class="scene-item" data-paragraph="${pIndex}" data-scene="${sIndex}">
                    ├─ Scene ${pIndex + 1}.${sIndex + 1}: "${truncate(scene.text, 80)}"
                </div>
            `;
        });

        paragraphDiv.innerHTML = html;
        container.appendChild(paragraphDiv);
    });
}

/**
 * Approve breakdown and move to frame definitions
 */
function approveBreakdown() {
    generateFrameDefinitions();
    showFrameDefinitions();
    showStep(3);
}

/**
 * Edit breakdown (go back to script)
 */
function editBreakdown() {
    showStep(1);
}

/**
 * Re-split script with new settings
 */
function resplitScript() {
    splitScript();
    showBreakdown();
    showSuccess('Script re-split successfully');
}

/**
 * Generate frame definitions from scenes
 */
function generateFrameDefinitions() {
    AppState.frames = [];

    AppState.paragraphs.forEach(paragraph => {
        paragraph.scenes.forEach(scene => {
            const prompts = generateFramePrompts(scene.text);

            AppState.frames.push({
                sceneId: scene.id,
                paragraphIndex: scene.paragraphIndex,
                sceneIndex: scene.sceneIndex,
                sceneText: scene.text,
                startPrompt: AppState.consistencyManager.applyToPrompt(prompts.start),
                endPrompt: AppState.consistencyManager.applyToPrompt(prompts.end),
                startImage: null,
                endImage: null
            });
        });
    });

    console.log('Frame definitions generated:', AppState.frames);
}

/**
 * Show frame definitions
 */
function showFrameDefinitions() {
    const container = document.getElementById('frameDefinitions');
    container.innerHTML = '';

    AppState.frames.forEach((frame, index) => {
        const frameDiv = document.createElement('div');
        frameDiv.className = 'frame-item';

        frameDiv.innerHTML = `
            <h4>Scene ${frame.paragraphIndex + 1}.${frame.sceneIndex + 1}</h4>
            <div class="frame-detail">
                ├─ START: "${truncate(frame.startPrompt, 100)}"
            </div>
            <div class="frame-detail">
                └─ END: "${truncate(frame.endPrompt, 100)}"
            </div>
        `;

        container.appendChild(frameDiv);
    });

    // Show consistency info
    const consistencyInfo = document.getElementById('consistencyInfo');
    consistencyInfo.innerHTML = AppState.consistencyManager.getConsistencyInfoHTML();
}

/**
 * Approve frames and start generation
 */
async function approveFrames() {
    showStep(4);
    await startImageGeneration();
}

// ========== Image Generation ==========

/**
 * Start image generation for all frames
 */
async function startImageGeneration() {
    AppState.isGenerating = true;
    AppState.startTime = Date.now();
    AppState.generatedImages = 0;
    AppState.totalImages = AppState.frames.length * 2; // start + end
    AppState.totalVideos = AppState.frames.length + (AppState.frames.length - 1); // scenes + transitions

    // Update stats
    updateStats();

    // Create scene grid
    createSceneGrid();

    // Generate all images
    addLog('info', 'Starting image generation...');

    for (const frame of AppState.frames) {
        await generateFrameImages(frame);
    }

    addLog('success', 'All images generated successfully!');
    showSuccess('Image generation complete! Moving to video generation...');

    // Move to video generation
    setTimeout(() => {
        showStep(5);
        startVideoGeneration();
    }, 2000);
}

/**
 * Generate images for a single frame
 */
async function generateFrameImages(frame) {
    const sceneId = frame.sceneId;

    // Generate START frame
    await generateSingleImage(frame, 'start');

    // Generate END frame
    await generateSingleImage(frame, 'end');
}

/**
 * Generate a single image
 */
async function generateSingleImage(frame, frameType) {
    const sceneId = frame.sceneId;
    const prompt = frameType === 'start' ? frame.startPrompt : frame.endPrompt;

    addLog('info', `Generating ${frameType.toUpperCase()} frame for Scene ${frame.paragraphIndex + 1}.${frame.sceneIndex + 1}...`);

    // Show loading
    showImageLoading(sceneId, frameType);

    try {
        // Acquire rate limit permission
        await AppState.rateLimiter.acquire();

        // Get consistency options and merge with user settings
        const consistencyOptions = AppState.consistencyManager.getImageGenerationOptions();
        const options = {
            ...consistencyOptions,
            model: AppState.imageModel,
            aspect_ratio: AppState.aspectRatio,
            style: AppState.artisticStyle
        };

        // Generate image
        const imageUrl = await retry(
            async () => await AppState.api.generateImage(prompt, options),
            3,
            2000
        );

        // Update frame data
        if (frameType === 'start') {
            frame.startImage = imageUrl;
        } else {
            frame.endImage = imageUrl;
        }

        // Update UI
        updateImageDisplay(sceneId, frameType, imageUrl);
        AppState.generatedImages++;
        updateStats();

        addLog('success', `${frameType.toUpperCase()} frame complete for Scene ${frame.paragraphIndex + 1}.${frame.sceneIndex + 1} (${formatTime((Date.now() - AppState.startTime) / 1000)})`);

        // Send webhook notification
        await AppState.webhookManager.notifyImageGenerated(
            sceneId,
            frameType,
            imageUrl,
            frame.paragraphIndex,
            frame.sceneIndex
        );

    } catch (error) {
        console.error(`Error generating ${frameType} frame:`, error);
        addLog('error', `Failed to generate ${frameType} frame for Scene ${frame.paragraphIndex + 1}.${frame.sceneIndex + 1}: ${error.message}`);
        showError(`Failed to generate ${frameType} frame: ${error.message}`);

        // Show error state
        showImageError(sceneId, frameType);

        // Send webhook notification for failure
        await AppState.webhookManager.notifyImageFailed(
            sceneId,
            frameType,
            error.message,
            frame.paragraphIndex,
            frame.sceneIndex
        );
    }
}

// ========== Video Generation ==========

/**
 * Start video generation
 */
async function startVideoGeneration() {
    addLog('info', 'Starting video generation...');

    const videoGrid = document.getElementById('videoGrid');
    videoGrid.innerHTML = '';

    // Generate videos for each paragraph
    for (const paragraph of AppState.paragraphs) {
        await generateParagraphVideos(paragraph);
    }

    addLog('success', 'All videos generated successfully!');
    showSuccess('Video generation complete!');
    AppState.isGenerating = false;

    // Send final webhook notification for all completions
    await AppState.webhookManager.notifyAllComplete(
        AppState.generatedImages,
        AppState.generatedVideos,
        Math.floor((Date.now() - AppState.startTime) / 1000)
    );
}

/**
 * Generate videos for a paragraph
 */
async function generateParagraphVideos(paragraph) {
    const pIndex = paragraph.index;

    // Create paragraph section
    const section = document.createElement('div');
    section.className = 'video-paragraph-section';
    section.id = `paragraph-${pIndex}`;

    section.innerHTML = `
        <div class="paragraph-header">
            <h3>PARAGRAPH ${pIndex + 1} VIDEOS</h3>
        </div>
    `;

    document.getElementById('videoGrid').appendChild(section);

    // ROW 1: Individual scene videos
    await generateSceneVideos(paragraph, section);

    // ROW 2: Transition videos
    await generateTransitionVideos(paragraph, section);

    // ROW 3: Stitched final video
    await generateStitchedVideo(paragraph, section);
}

/**
 * Generate individual scene videos (start → end)
 */
async function generateSceneVideos(paragraph, section) {
    const row = document.createElement('div');
    row.className = 'video-row';
    row.innerHTML = '<h4 class="video-row-title">ROW 1: INDIVIDUAL SCENE VIDEOS (Start → End Transitions)</h4>';

    const container = document.createElement('div');
    container.className = 'video-cards-container';

    for (const scene of paragraph.scenes) {
        const frame = AppState.frames.find(f => f.sceneId === scene.id);

        if (frame && frame.startImage && frame.endImage) {
            const videoUrl = await generateSceneVideo(frame);

            // Create video card
            const card = createVideoCard(
                `Scene ${scene.paragraphIndex + 1}.${scene.sceneIndex + 1}`,
                videoUrl,
                scene.text
            );
            container.appendChild(card);
        }
    }

    row.appendChild(container);
    section.appendChild(row);
}

/**
 * Generate a single scene video
 */
async function generateSceneVideo(frame) {
    addLog('info', `Generating video for Scene ${frame.paragraphIndex + 1}.${frame.sceneIndex + 1}...`);

    try {
        await AppState.rateLimiter.acquire();

        // Build consistent prompt
        const enhancedPrompt = AppState.consistencyManager.applyToPrompt(frame.sceneText);

        // Build video generation options
        const options = {
            model: AppState.videoModel,
            resolution: AppState.videoResolution,
            aspect_ratio: AppState.videoAspectRatio,
            file_urls: frame.startImage  // Use start image as reference
        };

        // Progress callback
        const progressCallback = (percentage, statusDesc) => {
            addLog('info', `Video ${frame.paragraphIndex + 1}.${frame.sceneIndex + 1} progress: ${percentage}% - ${statusDesc}`);
        };

        const videoUrl = await AppState.api.generateVideo(
            enhancedPrompt,
            options,
            progressCallback
        );

        AppState.generatedVideos++;
        updateStats();

        addLog('success', `Video complete for Scene ${frame.paragraphIndex + 1}.${frame.sceneIndex + 1}`);

        // Send webhook notification
        await AppState.webhookManager.notifyVideoGenerated(
            frame.sceneId,
            'scene',
            videoUrl,
            frame.paragraphIndex,
            frame.sceneIndex
        );

        return videoUrl;

    } catch (error) {
        console.error('Error generating scene video:', error);
        addLog('error', `Failed to generate video: ${error.message}`);

        // Send webhook notification for failure
        await AppState.webhookManager.notifyVideoFailed(
            frame.sceneId,
            'scene',
            error.message,
            frame.paragraphIndex,
            frame.sceneIndex
        );

        throw error;
    }
}

/**
 * Generate transition videos (scene → scene)
 */
async function generateTransitionVideos(paragraph, section) {
    if (paragraph.scenes.length < 2) return;

    const row = document.createElement('div');
    row.className = 'video-row';
    row.innerHTML = '<h4 class="video-row-title">ROW 2: TRANSITION VIDEOS (Scene → Scene Connections)</h4>';

    const container = document.createElement('div');
    container.className = 'video-cards-container';

    for (let i = 0; i < paragraph.scenes.length - 1; i++) {
        const currentFrame = AppState.frames.find(f => f.sceneId === paragraph.scenes[i].id);
        const nextFrame = AppState.frames.find(f => f.sceneId === paragraph.scenes[i + 1].id);

        if (currentFrame && nextFrame) {
            const videoUrl = await generateTransitionVideo(currentFrame, nextFrame);

            const card = createVideoCard(
                `Transition ${paragraph.index + 1}.${i + 1} → ${paragraph.index + 1}.${i + 2}`,
                videoUrl,
                `Smooth transition between scenes`
            );
            container.appendChild(card);
        }
    }

    row.appendChild(container);
    section.appendChild(row);
}

/**
 * Generate a transition video
 */
async function generateTransitionVideo(currentFrame, nextFrame) {
    addLog('info', `Generating transition video ${currentFrame.paragraphIndex + 1}.${currentFrame.sceneIndex + 1} → ${nextFrame.paragraphIndex + 1}.${nextFrame.sceneIndex + 1}...`);

    try {
        await AppState.rateLimiter.acquire();

        const prompt = `Smooth cinematic transition from scene ${currentFrame.sceneIndex + 1} to scene ${nextFrame.sceneIndex + 1}`;
        const enhancedPrompt = AppState.consistencyManager.applyToPrompt(prompt);

        // Build video generation options
        const options = {
            model: AppState.videoModel,
            resolution: AppState.videoResolution,
            aspect_ratio: AppState.videoAspectRatio,
            file_urls: currentFrame.endImage  // Use current end image as reference
        };

        // Progress callback
        const progressCallback = (percentage, statusDesc) => {
            addLog('info', `Transition video progress: ${percentage}% - ${statusDesc}`);
        };

        const videoUrl = await AppState.api.generateVideo(
            enhancedPrompt,
            options,
            progressCallback
        );

        AppState.generatedVideos++;
        updateStats();

        addLog('success', `Transition video complete`);

        // Send webhook notification
        await AppState.webhookManager.notifyVideoGenerated(
            `transition_${currentFrame.sceneId}_to_${nextFrame.sceneId}`,
            'transition',
            videoUrl,
            currentFrame.paragraphIndex,
            currentFrame.sceneIndex
        );

        return videoUrl;

    } catch (error) {
        console.error('Error generating transition video:', error);
        addLog('error', `Failed to generate transition video: ${error.message}`);

        // Send webhook notification for failure
        await AppState.webhookManager.notifyVideoFailed(
            `transition_${currentFrame.sceneId}_to_${nextFrame.sceneId}`,
            'transition',
            error.message,
            currentFrame.paragraphIndex,
            currentFrame.sceneIndex
        );

        throw error;
    }
}

/**
 * Generate final stitched video for paragraph
 */
async function generateStitchedVideo(paragraph, section) {
    const row = document.createElement('div');
    row.className = 'video-row';
    row.innerHTML = '<h4 class="video-row-title">ROW 3: FINAL STITCHED PARAGRAPH VIDEO</h4>';

    // Collect all video URLs for this paragraph
    // Note: In a real implementation, you'd store these during generation
    // For now, we'll create a placeholder

    const card = document.createElement('div');
    card.className = 'video-card final-video-card';
    card.innerHTML = `
        <h3 class="video-card-title">🎬 PARAGRAPH ${paragraph.index + 1} - COMPLETE STITCHED VIDEO</h3>
        <div class="video-player-container">
            <div style="padding: 40px; text-align: center; color: white;">
                <p>Final stitched video will appear here</p>
                <p>Total scenes: ${paragraph.scenes.length}</p>
                <p>Estimated duration: ${paragraph.scenes.length * 8 + (paragraph.scenes.length - 1) * 8} seconds</p>
            </div>
        </div>
        <div class="video-includes">
            <h4>Includes:</h4>
            <ul>
                ${paragraph.scenes.map((s, i) => `
                    <li>✓ Scene ${paragraph.index + 1}.${i + 1} (start→end)</li>
                    ${i < paragraph.scenes.length - 1 ? `<li>✓ Transition ${paragraph.index + 1}.${i + 1}→${i + 2}</li>` : ''}
                `).join('')}
            </ul>
        </div>
        <div class="video-actions">
            <button class="btn btn-primary">⬇️ Download Full Video (MP4)</button>
            <button class="btn btn-secondary">📦 Download All Clips (ZIP)</button>
        </div>
    `;

    row.appendChild(card);
    section.appendChild(row);
}

// ========== UI Helper Functions ==========

/**
 * Create scene grid
 */
function createSceneGrid() {
    const grid = document.getElementById('sceneGrid');
    grid.innerHTML = '';

    // Update stats display
    document.getElementById('statTotalScenes').textContent = AppState.frames.length;
    document.getElementById('statImagesGenerated').textContent = `0 / ${AppState.totalImages}`;
    document.getElementById('statVideosGenerated').textContent = `0 / ${AppState.totalVideos}`;

    AppState.frames.forEach(frame => {
        const card = createSceneCard(frame);
        grid.appendChild(card);
    });
}

/**
 * Create a scene card
 */
function createSceneCard(frame) {
    const card = document.createElement('div');
    card.className = 'scene-card';
    card.id = `scene-${frame.sceneId}`;

    card.innerHTML = `
        <div class="scene-card-header">
            <h3 class="scene-card-title">PARAGRAPH ${frame.paragraphIndex + 1} - SCENE ${frame.sceneIndex + 1}</h3>
            <p class="scene-card-description">"${truncate(frame.sceneText, 60)}"</p>
        </div>

        <div class="frame-images">
            <div class="frame-image-container" id="${frame.sceneId}-start">
                <div class="frame-image-label">START FRAME</div>
                <div class="frame-loading">
                    <div class="spinner"></div>
                    <p class="loading-text">Waiting...</p>
                </div>
            </div>

            <div class="frame-image-container" id="${frame.sceneId}-end">
                <div class="frame-image-label">END FRAME</div>
                <div class="frame-loading">
                    <div class="spinner"></div>
                    <p class="loading-text">Waiting...</p>
                </div>
            </div>
        </div>

        <div class="scene-status" id="${frame.sceneId}-status">
            Status: Waiting to generate...
        </div>

        <div class="scene-locks">
            ${AppState.consistencyManager.getConsistencyTags()}
        </div>
    `;

    return card;
}

/**
 * Show image loading state
 */
function showImageLoading(sceneId, frameType) {
    const container = document.getElementById(`${sceneId}-${frameType}`);
    if (!container) return;

    container.innerHTML = `
        <div class="frame-image-label">${frameType.toUpperCase()} FRAME</div>
        <div class="frame-loading">
            <div class="spinner"></div>
            <p class="loading-text">Generating...</p>
        </div>
    `;

    updateSceneStatus(sceneId, 'processing', 'Generating images...');
}

/**
 * Update image display
 */
function updateImageDisplay(sceneId, frameType, imageUrl) {
    const container = document.getElementById(`${sceneId}-${frameType}`);
    if (!container) return;

    container.innerHTML = `
        <div class="frame-image-label">${frameType.toUpperCase()} FRAME</div>
        <img src="${imageUrl}" alt="${frameType} frame" class="frame-image">
        <div class="frame-actions">
            <button class="frame-action-btn" onclick="viewFullImage('${imageUrl}')">🔍</button>
            <button class="frame-action-btn" onclick="regenerateImage('${sceneId}', '${frameType}')">🔄</button>
        </div>
    `;
}

/**
 * Show image error state
 */
function showImageError(sceneId, frameType) {
    const container = document.getElementById(`${sceneId}-${frameType}`);
    if (!container) return;

    container.innerHTML = `
        <div class="frame-image-label">${frameType.toUpperCase()} FRAME</div>
        <div class="frame-loading" style="color: var(--error-color);">
            <p>❌ Generation failed</p>
            <button class="btn btn-small" onclick="regenerateImage('${sceneId}', '${frameType}')">Retry</button>
        </div>
    `;

    updateSceneStatus(sceneId, 'error', 'Error generating images');
}

/**
 * Update scene status
 */
function updateSceneStatus(sceneId, status, message) {
    const statusEl = document.getElementById(`${sceneId}-status`);
    if (!statusEl) return;

    statusEl.className = `scene-status ${status}`;
    statusEl.textContent = `Status: ${message}`;
}

/**
 * Create a video card
 */
function createVideoCard(title, videoUrl, description) {
    const card = document.createElement('div');
    card.className = 'video-card';

    card.innerHTML = `
        <h4 class="video-card-title">${title}</h4>
        <div class="video-player-container">
            <video class="video-player" controls>
                <source src="${videoUrl}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </div>
        <p class="video-info">Duration: 8 seconds</p>
        <p class="video-info">Quality: 1080p</p>
        <p class="video-info">Model: Veo 3.1 Fast</p>
        <div class="video-actions">
            <button class="btn btn-small" onclick="downloadFromURL('${videoUrl}', '${title}.mp4')">⬇️ Download</button>
            <button class="btn btn-small">🔄 Regenerate</button>
        </div>
    `;

    return card;
}

/**
 * Update statistics dashboard
 */
function updateStats() {
    const elapsed = AppState.startTime ? (Date.now() - AppState.startTime) / 1000 : 0;

    document.getElementById('statImagesGenerated').textContent = `${AppState.generatedImages} / ${AppState.totalImages}`;
    document.getElementById('statVideosGenerated').textContent = `${AppState.generatedVideos} / ${AppState.totalVideos}`;
    document.getElementById('statTimeElapsed').textContent = formatTime(elapsed);

    // Update progress bar
    const totalItems = AppState.totalImages + AppState.totalVideos;
    const completedItems = AppState.generatedImages + AppState.generatedVideos;
    const progress = percentage(completedItems, totalItems);

    document.getElementById('overallProgressBar').style.width = `${progress}%`;
    document.getElementById('overallProgressText').textContent = `${progress}%`;

    // Update current status
    let status = 'Ready';
    if (AppState.isGenerating) {
        if (AppState.generatedImages < AppState.totalImages) {
            status = 'Generating Images...';
        } else {
            status = 'Generating Videos...';
        }
    }
    document.getElementById('statCurrentStatus').textContent = status;

    // Update API usage
    document.getElementById('statApiUsage').textContent = `${AppState.rateLimiter.totalRequests} / 3000`;
}

// ========== Log Management ==========

/**
 * Add log entry
 */
function addLog(type, message) {
    const logContent = document.getElementById('logContent');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;

    const timestamp = getTimestamp();
    entry.innerHTML = `
        <span class="log-timestamp">${timestamp}</span>
        <span class="log-message">${message}</span>
    `;

    logContent.appendChild(entry);

    // Auto-scroll if enabled
    if (document.getElementById('autoScrollLog').checked) {
        logContent.scrollTop = logContent.scrollHeight;
    }

    // Store in app state
    AppState.logs.push({ timestamp, type, message });
}

/**
 * Clear log
 */
function clearLog() {
    document.getElementById('logContent').innerHTML = '';
    AppState.logs = [];
    addLog('info', 'Log cleared');
}

/**
 * Export log
 */
function exportLog() {
    const logText = AppState.logs.map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`).join('\n');
    downloadFile(logText, `generation-log-${Date.now()}.txt`, 'text/plain');
    showSuccess('Log exported successfully');
}

// ========== Navigation ==========

/**
 * Show specific step
 */
function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.step-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected step
    document.getElementById(`step${stepNumber}`).classList.add('active');
    AppState.currentStep = stepNumber;
}

/**
 * Toggle collapse
 */
function toggleCollapse(contentId, iconId) {
    const content = document.getElementById(contentId);
    const icon = document.getElementById(iconId);

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▼';
    } else {
        content.style.display = 'none';
        icon.textContent = '▶';
    }
}

// ========== Global Functions (called from HTML) ==========

/**
 * View full-size image in modal
 */
function viewFullImage(imageUrl) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');

    modalImage.src = imageUrl;
    modal.classList.add('active');
}

/**
 * Close image modal
 */
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('active');
}

/**
 * Regenerate a specific image
 */
async function regenerateImage(sceneId, frameType) {
    const frame = AppState.frames.find(f => f.sceneId === sceneId);
    if (!frame) return;

    addLog('info', `Regenerating ${frameType} frame for Scene ${frame.paragraphIndex + 1}.${frame.sceneIndex + 1}...`);

    await generateSingleImage(frame, frameType);
}

// ========== Console Commands (for debugging) ==========
window.AppState = AppState;
window.resetRateLimiter = () => AppState.rateLimiter?.reset();
window.resetConsistency = () => AppState.consistencyManager?.reset();
window.showStep = showStep;

console.log('App.js loaded. Debug commands available: AppState, resetRateLimiter(), resetConsistency(), showStep(n)');
