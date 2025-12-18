/**
 * GEMINIGEN BRAIN - AI-Powered Storyboard Pipeline
 * Executes a 5-step sequential pipeline to generate storyboard data
 *
 * Pipeline:
 * 1. Character Identification
 * 2. Environment Identification
 * 3. Script → Paragraph Splitting
 * 4. Paragraph → Scene Generation
 * 5. Scene → Start & End Frame Prompts
 */

const GeminiGenBrain = {
    /**
     * Tag-based parser utility
     * Extracts content between [TAG: Name]...[/TAG] delimiters
     */
    extractByTag(tagName, responseText) {
        const results = [];
        const regex = new RegExp(`\\[${tagName}:\\s*([^\\]]+)\\]([\\s\\S]*?)\\[\\/${tagName}\\]`, 'gi');
        let match;

        while ((match = regex.exec(responseText)) !== null) {
            results.push({
                name: match[1].trim(),
                content: match[2].trim()
            });
        }

        return results;
    },

    /**
     * Extract simple tagged blocks (like PARAGRAPH_1, SCENE_1)
     */
    extractSimpleTag(tagPattern, responseText) {
        const results = [];
        const regex = new RegExp(`\\[${tagPattern}\\]([\\s\\S]*?)\\[\\/${tagPattern}\\]`, 'gi');
        let match;

        while ((match = regex.exec(responseText)) !== null) {
            results.push(match[1].trim());
        }

        return results;
    },

    /**
     * Extract numbered tags (PARAGRAPH_1, PARAGRAPH_2, etc.)
     */
    extractNumberedTags(tagPrefix, responseText) {
        const results = [];
        let index = 1;

        while (true) {
            const tagName = `${tagPrefix}_${index}`;
            const regex = new RegExp(`\\[${tagName}\\]([\\s\\S]*?)\\[\\/${tagName}\\]`, 'i');
            const match = responseText.match(regex);

            if (!match) break;

            results.push(match[1].trim());
            index++;
        }

        return results;
    },

    /**
     * Poll webhook status
     */
    async pollWebhookStatus(uuid, maxAttempts = 120, interval = 3000) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, interval));

            try {
                const response = await fetch(`/v2/webhook-status/${uuid}`);
                const data = await response.json();

                if (data.status === 2) {
                    // Completed
                    return {
                        success: true,
                        responseText: data.response_text,
                        creditsUsed: data.credits_used || 0
                    };
                } else if (data.status === 3) {
                    // Failed
                    return {
                        success: false,
                        message: data.error_message || 'Generation failed'
                    };
                }
            } catch (error) {
                console.error('Webhook polling error:', error);
            }
        }

        return {
            success: false,
            message: 'Timeout waiting for response'
        };
    },

    /**
     * STEP 1: Character Identification
     */
    async extractCharacters(apiKey, script, progressCallback) {
        try {
            if (progressCallback) progressCallback('Analyzing script for characters...');

            const prompt = `Analyze the FULL script below and identify ALL characters.

RULES:
- Detect ONLY characters that exist
- Number of characters is NOT fixed
- For EACH character output EXACTLY:

[CHARACTER: Name]
Include AT LEAST 20 attributes:
Face, eyes, eye color, skin tone, hair type, hair color,
beard, age, body build, height, posture,
clothing, colors, accessories, expression,
marks, vibe, realism notes.
[/CHARACTER]

STRICT FORMAT ONLY.
NO commentary.

SCRIPT:
${script}`;

            const result = await APIHandler.generateText(apiKey, prompt);

            if (!result.success) {
                return { success: false, message: result.message };
            }

            if (progressCallback) progressCallback('Waiting for character analysis...');

            // Poll webhook for response
            const webhookResult = await this.pollWebhookStatus(result.uuid);

            if (!webhookResult.success) {
                return webhookResult;
            }

            // Parse characters
            const characters = this.extractByTag('CHARACTER', webhookResult.responseText);

            if (progressCallback) progressCallback(`Found ${characters.length} characters`);

            return {
                success: true,
                characters: characters,
                creditsUsed: webhookResult.creditsUsed
            };

        } catch (error) {
            console.error('Character extraction error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * STEP 2: Environment Identification
     */
    async extractEnvironments(apiKey, script, progressCallback) {
        try {
            if (progressCallback) progressCallback('Analyzing script for environments...');

            const prompt = `Analyze the FULL script below and identify ALL environments.

RULES:
- Number of environments is NOT fixed
- For EACH environment output EXACTLY:

[ENVIRONMENT: Name]
Include AT LEAST 20 attributes:
Lighting, time of day, weather, architecture,
materials, depth, background, foreground,
color palette, mood, atmosphere, realism,
scale, cinematic style, movement.
[/ENVIRONMENT]

STRICT FORMAT ONLY.
NO commentary.

SCRIPT:
${script}`;

            const result = await APIHandler.generateText(apiKey, prompt);

            if (!result.success) {
                return { success: false, message: result.message };
            }

            if (progressCallback) progressCallback('Waiting for environment analysis...');

            // Poll webhook for response
            const webhookResult = await this.pollWebhookStatus(result.uuid);

            if (!webhookResult.success) {
                return webhookResult;
            }

            // Parse environments
            const environments = this.extractByTag('ENVIRONMENT', webhookResult.responseText);

            if (progressCallback) progressCallback(`Found ${environments.length} environments`);

            return {
                success: true,
                environments: environments,
                creditsUsed: webhookResult.creditsUsed
            };

        } catch (error) {
            console.error('Environment extraction error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * STEP 3: Script → Paragraph Splitting
     */
    async splitIntoParagraphs(apiKey, script, paragraphCount, progressCallback) {
        try {
            if (progressCallback) progressCallback(`Splitting script into ${paragraphCount} paragraphs...`);

            const prompt = `Split the script below into EXACTLY ${paragraphCount} paragraphs.

RULES:
- Preserve story flow
- Expand or compress if required
- Use STRICT format:

[PARAGRAPH_1]
...
[/PARAGRAPH_1]

[PARAGRAPH_2]
...
[/PARAGRAPH_2]

NO extra text.

SCRIPT:
${script}`;

            const result = await APIHandler.generateText(apiKey, prompt);

            if (!result.success) {
                return { success: false, message: result.message };
            }

            if (progressCallback) progressCallback('Waiting for paragraph splitting...');

            // Poll webhook for response
            const webhookResult = await this.pollWebhookStatus(result.uuid);

            if (!webhookResult.success) {
                return webhookResult;
            }

            // Parse paragraphs
            const paragraphs = this.extractNumberedTags('PARAGRAPH', webhookResult.responseText);

            if (paragraphs.length !== paragraphCount) {
                console.warn(`Expected ${paragraphCount} paragraphs, got ${paragraphs.length}`);
            }

            if (progressCallback) progressCallback(`Split into ${paragraphs.length} paragraphs`);

            return {
                success: true,
                paragraphs: paragraphs,
                creditsUsed: webhookResult.creditsUsed
            };

        } catch (error) {
            console.error('Paragraph splitting error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * STEP 4: Paragraph → Scene Generation
     */
    async generateScenesForParagraph(apiKey, paragraphText, paragraphIndex, scenesPerParagraph, progressCallback) {
        try {
            if (progressCallback) progressCallback(`Generating ${scenesPerParagraph} scenes for paragraph ${paragraphIndex}...`);

            const prompt = `Create EXACTLY ${scenesPerParagraph} cinematic scenes from the paragraph below.

RULES:
- Visual, descriptive, cinematic
- Use STRICT format:

[SCENE_1]
...
[/SCENE_1]

[SCENE_2]
...
[/SCENE_2]

NO extra text.

PARAGRAPH:
${paragraphText}`;

            const result = await APIHandler.generateText(apiKey, prompt);

            if (!result.success) {
                return { success: false, message: result.message };
            }

            if (progressCallback) progressCallback(`Waiting for scene generation (paragraph ${paragraphIndex})...`);

            // Poll webhook for response
            const webhookResult = await this.pollWebhookStatus(result.uuid);

            if (!webhookResult.success) {
                return webhookResult;
            }

            // Parse scenes
            const scenes = this.extractNumberedTags('SCENE', webhookResult.responseText);

            if (scenes.length !== scenesPerParagraph) {
                console.warn(`Expected ${scenesPerParagraph} scenes, got ${scenes.length}`);
            }

            if (progressCallback) progressCallback(`Generated ${scenes.length} scenes for paragraph ${paragraphIndex}`);

            return {
                success: true,
                scenes: scenes,
                creditsUsed: webhookResult.creditsUsed
            };

        } catch (error) {
            console.error('Scene generation error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * STEP 5: Scene → Start & End Frame Prompts
     */
    async generateFramePromptsForScenes(apiKey, scenes, progressCallback) {
        try {
            if (progressCallback) progressCallback(`Generating frame prompts for ${scenes.length} scenes...`);

            // Build the scenes input
            let scenesInput = '';
            scenes.forEach((sceneText, index) => {
                scenesInput += `[SCENE_${index + 1}]\n${sceneText}\n[/SCENE_${index + 1}]\n\n`;
            });

            const prompt = `For EACH scene below, generate:

- STARTING FRAME (scene opening visual)
- ENDING FRAME (scene closing visual)

RULES:
- Together they must represent the COMPLETE scene
- No missing story elements
- STRICT format only:

[SCENE_1]
[START_FRAME]
...
[/START_FRAME]
[END_FRAME]
...
[/END_FRAME]
[/SCENE_1]

[SCENE_2]
[START_FRAME]
...
[/START_FRAME]
[END_FRAME]
...
[/END_FRAME]
[/SCENE_2]

NO extra text.

SCENES:
${scenesInput}`;

            const result = await APIHandler.generateText(apiKey, prompt);

            if (!result.success) {
                return { success: false, message: result.message };
            }

            if (progressCallback) progressCallback('Waiting for frame prompt generation...');

            // Poll webhook for response
            const webhookResult = await this.pollWebhookStatus(result.uuid);

            if (!webhookResult.success) {
                return webhookResult;
            }

            // Parse frame prompts for each scene
            const framePrompts = [];
            for (let i = 1; i <= scenes.length; i++) {
                const sceneTagName = `SCENE_${i}`;
                const sceneRegex = new RegExp(`\\[${sceneTagName}\\]([\\s\\S]*?)\\[\\/${sceneTagName}\\]`, 'i');
                const sceneMatch = webhookResult.responseText.match(sceneRegex);

                if (sceneMatch) {
                    const sceneContent = sceneMatch[1];

                    const startFrameRegex = /\[START_FRAME\]([\s\S]*?)\[\/START_FRAME\]/i;
                    const endFrameRegex = /\[END_FRAME\]([\s\S]*?)\[\/END_FRAME\]/i;

                    const startMatch = sceneContent.match(startFrameRegex);
                    const endMatch = sceneContent.match(endFrameRegex);

                    framePrompts.push({
                        sceneIndex: i,
                        startFrame: startMatch ? startMatch[1].trim() : '',
                        endFrame: endMatch ? endMatch[1].trim() : ''
                    });
                }
            }

            if (progressCallback) progressCallback(`Generated frame prompts for ${framePrompts.length} scenes`);

            return {
                success: true,
                framePrompts: framePrompts,
                creditsUsed: webhookResult.creditsUsed
            };

        } catch (error) {
            console.error('Frame prompt generation error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * MAIN ORCHESTRATOR: Run complete 5-step pipeline
     */
    async runCompletePipeline(config, progressCallback) {
        const {
            apiKey,
            script,
            paragraphCount,
            scenesPerParagraph
        } = config;

        try {
            const totalCredits = {
                characterExtraction: 0,
                environmentExtraction: 0,
                paragraphSplitting: 0,
                sceneGeneration: 0,
                frameGeneration: 0,
                total: 0
            };

            // STEP 1: Extract Characters
            if (progressCallback) progressCallback('Step 1/5: Character Identification');
            const charResult = await this.extractCharacters(apiKey, script, progressCallback);
            if (!charResult.success) {
                return { success: false, message: 'Character extraction failed: ' + charResult.message };
            }
            totalCredits.characterExtraction = charResult.creditsUsed;
            totalCredits.total += charResult.creditsUsed;

            StateManager.saveExtractedCharacters(charResult.characters);
            StateManager.addCredits('characterExtraction', charResult.creditsUsed);

            // STEP 2: Extract Environments
            if (progressCallback) progressCallback('Step 2/5: Environment Identification');
            const envResult = await this.extractEnvironments(apiKey, script, progressCallback);
            if (!envResult.success) {
                return { success: false, message: 'Environment extraction failed: ' + envResult.message };
            }
            totalCredits.environmentExtraction = envResult.creditsUsed;
            totalCredits.total += envResult.creditsUsed;

            StateManager.saveExtractedEnvironments(envResult.environments);
            StateManager.addCredits('environmentExtraction', envResult.creditsUsed);

            // STEP 3: Split into Paragraphs
            if (progressCallback) progressCallback('Step 3/5: Script to Paragraph Splitting');
            const paraResult = await this.splitIntoParagraphs(apiKey, script, paragraphCount, progressCallback);
            if (!paraResult.success) {
                return { success: false, message: 'Paragraph splitting failed: ' + paraResult.message };
            }
            totalCredits.paragraphSplitting = paraResult.creditsUsed;
            totalCredits.total += paraResult.creditsUsed;

            StateManager.saveParagraphs(paraResult.paragraphs);
            StateManager.addCredits('paragraphSplitting', paraResult.creditsUsed);

            // STEP 4: Generate Scenes for Each Paragraph
            if (progressCallback) progressCallback('Step 4/5: Paragraph to Scene Generation');
            const allScenes = [];
            let sceneCredits = 0;

            for (let i = 0; i < paraResult.paragraphs.length; i++) {
                const paragraphText = paraResult.paragraphs[i];
                const sceneResult = await this.generateScenesForParagraph(
                    apiKey,
                    paragraphText,
                    i + 1,
                    scenesPerParagraph,
                    progressCallback
                );

                if (!sceneResult.success) {
                    return { success: false, message: `Scene generation failed for paragraph ${i + 1}: ${sceneResult.message}` };
                }

                sceneCredits += sceneResult.creditsUsed;

                // Store scenes with paragraph reference
                sceneResult.scenes.forEach((sceneText, sceneIndex) => {
                    allScenes.push({
                        paragraphIndex: i + 1,
                        paragraphText: paragraphText,
                        sceneText: sceneText,
                        sceneIndexInParagraph: sceneIndex + 1
                    });
                });
            }

            totalCredits.sceneGeneration = sceneCredits;
            totalCredits.total += sceneCredits;
            StateManager.addCredits('sceneGeneration', sceneCredits);

            // STEP 5: Generate Frame Prompts for All Scenes
            if (progressCallback) progressCallback('Step 5/5: Scene to Frame Prompts');
            const sceneTexts = allScenes.map(s => s.sceneText);
            const frameResult = await this.generateFramePromptsForScenes(apiKey, sceneTexts, progressCallback);

            if (!frameResult.success) {
                return { success: false, message: 'Frame prompt generation failed: ' + frameResult.message };
            }

            totalCredits.frameGeneration = frameResult.creditsUsed;
            totalCredits.total += frameResult.creditsUsed;
            StateManager.addCredits('frameGeneration', frameResult.creditsUsed);

            // Combine scenes with frame prompts
            const finalScenes = [];
            let globalSceneNumber = 1;

            allScenes.forEach((scene, index) => {
                const framePrompt = frameResult.framePrompts[index];

                finalScenes.push({
                    sceneNumber: globalSceneNumber++,
                    paragraphIndex: scene.paragraphIndex,
                    paragraphText: scene.paragraphText,
                    sceneText: scene.sceneText,
                    startingFrame: framePrompt ? framePrompt.startFrame : '',
                    endingFrame: framePrompt ? framePrompt.endFrame : ''
                });
            });

            // Save final scenes
            StateManager.saveScenes(finalScenes);

            if (progressCallback) progressCallback('Pipeline completed successfully!');

            return {
                success: true,
                characters: charResult.characters,
                environments: envResult.environments,
                paragraphs: paraResult.paragraphs,
                scenes: finalScenes,
                creditsUsed: totalCredits
            };

        } catch (error) {
            console.error('Pipeline error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiGenBrain;
}
