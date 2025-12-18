/**
 * Script Splitter - Uses AI to intelligently split scripts into scenes
 * with starting and ending frame descriptions
 * Supports both GeminiGen and OpenAI providers
 */
const ScriptSplitter = {
    /**
     * Split script into scenes using AI
     * @param {string} provider - "geminigen" or "openai"
     * @param {string} apiKey - API key for the provider
     * @param {string} rawScript - The raw script text
     * @param {number} numberOfScenes - How many scenes to split into
     * @param {object} options - Additional options (model, etc.)
     */
    async splitScript(provider, apiKey, rawScript, numberOfScenes, options = {}) {
        const systemInstruction = `You are a professional screenplay and storyboard expert. Your job is to split scripts into scenes with detailed visual descriptions for AI image generation.`;

        const prompt = `
Split the following script into exactly ${numberOfScenes} scenes. For each scene, provide:
1. Scene number
2. Scene description (1-2 sentences summarizing what happens)
3. Starting frame description (detailed visual description for image generation - include environment, characters, mood, lighting, composition)
4. Ending frame description (detailed visual description for image generation - include environment, characters, mood, lighting, composition)

IMPORTANT REQUIREMENTS:
- Each scene must have UNIQUE and DIFFERENT descriptions
- Starting and ending frames must be VISUALLY DISTINCT from each other
- Be specific about character positions, expressions, camera angles
- Include details about environment, lighting, time of day, mood
- Make descriptions rich enough for AI image generation

Output format (JSON):
{
  "scenes": [
    {
      "sceneNumber": 1,
      "description": "Brief scene summary",
      "startingFrame": "Detailed visual description for starting image",
      "endingFrame": "Detailed visual description for ending image"
    }
  ]
}

Script to split:
${rawScript}

Respond ONLY with valid JSON, no other text.
`;

        try {
            if (provider === 'openai') {
                // OpenAI - Returns response immediately
                const model = options.model || 'gpt-4o-mini';
                const result = await GeminiGenAPI.generateTextOpenAI(
                    apiKey,
                    prompt,
                    systemInstruction,
                    model,
                    0.7
                );

                if (!result.success) {
                    throw new Error(result.message || 'OpenAI request failed');
                }

                // Parse response immediately
                const parsed = this.parseAIResponse(result.responseText);
                return parsed;

            } else {
                // GeminiGen - Returns UUID, needs webhook
                const result = await GeminiGenAPI.generateText(
                    apiKey,
                    prompt,
                    systemInstruction,
                    0.7
                );

                if (!result.success) {
                    throw new Error(result.message || 'GeminiGen request failed');
                }

                // Return UUID for webhook tracking
                return {
                    success: true,
                    uuid: result.uuid,
                    message: 'Script splitting started. Waiting for AI response...',
                    requiresWebhook: true
                };
            }

        } catch (error) {
            console.error('Script splitting error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Parse AI response from webhook
     */
    parseAIResponse(responseText) {
        try {
            // Try to find JSON in the response
            const jsonMatch = responseText.match(/\{[\s\S]*"scenes"[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in AI response');
            }

            const data = JSON.parse(jsonMatch[0]);

            if (!data.scenes || !Array.isArray(data.scenes)) {
                throw new Error('Invalid scene structure in AI response');
            }

            return {
                success: true,
                scenes: data.scenes
            };

        } catch (error) {
            console.error('Parse error:', error);
            return {
                success: false,
                message: 'Failed to parse AI response: ' + error.message
            };
        }
    },

    /**
     * Simple fallback splitter (splits by paragraphs/line breaks)
     */
    simpleSplit(rawScript, numberOfScenes) {
        const paragraphs = rawScript
            .split(/\n\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 0);

        const scenesPerParagraph = Math.max(1, Math.floor(paragraphs.length / numberOfScenes));
        const scenes = [];

        for (let i = 0; i < numberOfScenes; i++) {
            const startIdx = i * scenesPerParagraph;
            const endIdx = i === numberOfScenes - 1 ? paragraphs.length : (i + 1) * scenesPerParagraph;
            const sceneParagraphs = paragraphs.slice(startIdx, endIdx);

            scenes.push({
                sceneNumber: i + 1,
                description: sceneParagraphs[0].substring(0, 100) + '...',
                startingFrame: sceneParagraphs[0],
                endingFrame: sceneParagraphs[sceneParagraphs.length - 1]
            });
        }

        return {
            success: true,
            scenes: scenes
        };
    }
};
