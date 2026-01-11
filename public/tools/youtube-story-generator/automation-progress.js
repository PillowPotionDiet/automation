/**
 * Automation Progress UI
 * Displays real-time progress during Google Labs Flow automation
 */

const AutomationProgress = {
    overlayId: 'automationProgressOverlay',

    /**
     * Show automation progress overlay
     */
    show(characterCount, environmentCount) {
        // Remove existing overlay if any
        this.hide();

        const totalImages = characterCount + environmentCount;

        const overlay = document.createElement('div');
        overlay.id = this.overlayId;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease-in;
        `;

        overlay.innerHTML = `
            <div class="automation-progress-container" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                padding: 40px;
                max-width: 600px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                color: white;
            ">
                <!-- Header -->
                <div class="automation-header" style="text-align: center; margin-bottom: 30px;">
                    <div class="automation-icon" style="font-size: 48px; margin-bottom: 15px;">
                        🤖
                    </div>
                    <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 600;">
                        Generating Identities
                    </h2>
                    <p style="margin: 0; opacity: 0.9; font-size: 15px;">
                        Please follow the instructions below...
                    </p>
                </div>

                <!-- Progress Bar -->
                <div class="progress-bar-container" style="margin-bottom: 25px;">
                    <div style="
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 12px;
                        height: 12px;
                        overflow: hidden;
                        position: relative;
                    ">
                        <div id="automationProgressFill" style="
                            width: 0%;
                            height: 100%;
                            background: linear-gradient(90deg, #4ade80, #22c55e);
                            transition: width 0.5s ease;
                            border-radius: 12px;
                        "></div>
                    </div>
                    <div id="automationProgressPercentage" style="
                        text-align: center;
                        margin-top: 8px;
                        font-size: 14px;
                        font-weight: 600;
                    ">0%</div>
                </div>

                <!-- Progress Message -->
                <div id="automationProgressMessage" style="
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                    padding: 15px 20px;
                    margin-bottom: 20px;
                    text-align: center;
                    min-height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    line-height: 1.5;
                ">
                    Initializing automation...
                </div>

                <!-- Statistics -->
                <div class="automation-details" style="
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-bottom: 25px;
                ">
                    <div style="
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 10px;
                        padding: 15px;
                        text-align: center;
                    ">
                        <div style="font-size: 24px; font-weight: 700; margin-bottom: 5px;">
                            ${characterCount}
                        </div>
                        <div style="font-size: 12px; opacity: 0.8;">Characters</div>
                    </div>
                    <div style="
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 10px;
                        padding: 15px;
                        text-align: center;
                    ">
                        <div style="font-size: 24px; font-weight: 700; margin-bottom: 5px;">
                            ${environmentCount}
                        </div>
                        <div style="font-size: 12px; opacity: 0.8;">Environments</div>
                    </div>
                    <div style="
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 10px;
                        padding: 15px;
                        text-align: center;
                    ">
                        <div style="font-size: 24px; font-weight: 700; margin-bottom: 5px;">
                            ${totalImages}
                        </div>
                        <div style="font-size: 12px; opacity: 0.8;">Total Images</div>
                    </div>
                </div>

                <!-- Cancel Button -->
                <button id="cancelAutomationBtn" style="
                    width: 100%;
                    padding: 12px 24px;
                    background: rgba(239, 68, 68, 0.9);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.background='rgba(220, 38, 38, 1)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.9)'">
                    ✖ Cancel Automation
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Add fade-in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Update progress
     */
    update(percentage, message) {
        const fill = document.getElementById('automationProgressFill');
        const percentageText = document.getElementById('automationProgressPercentage');
        const messageText = document.getElementById('automationProgressMessage');

        if (fill) {
            fill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }

        if (percentageText) {
            percentageText.textContent = `${Math.round(percentage)}%`;
        }

        if (messageText) {
            messageText.textContent = message;
        }
    },

    /**
     * Hide overlay
     */
    hide() {
        const overlay = document.getElementById(this.overlayId);
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => overlay.remove(), 300);
        }
    },

    /**
     * Set cancel callback
     */
    onCancel(callback) {
        const cancelBtn = document.getElementById('cancelAutomationBtn');
        if (cancelBtn) {
            cancelBtn.onclick = callback;
        }
    }
};
