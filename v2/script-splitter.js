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
        const systemInstruction = `You are a professional screenplay and storyboard expert specializing in visual storytelling and AI image generation prompts. Your expertise is in breaking down narratives into distinct, progressive scenes with rich visual descriptions.`;

        const prompt = `
TASK: Split the following script into exactly ${numberOfScenes} DISTINCT, PROGRESSIVE scenes.

CRITICAL RULES TO PREVENT REPETITION:
1. READ THE ENTIRE SCRIPT FIRST - Understand the full narrative arc
2. DIVIDE CHRONOLOGICALLY - Each scene must cover a DIFFERENT part of the story timeline
3. NO REPETITION - Never reuse or copy descriptions between scenes
4. SHOW PROGRESSION - Each scene should advance the story visually and narratively
5. UNIQUE VISUALS - Every scene must have completely different visual elements

FOR EACH SCENE, PROVIDE:
1. Scene number (1 to ${numberOfScenes})
2. Scene description: What happens in THIS SPECIFIC part of the story (1-2 sentences)
3. Starting frame: DETAILED visual description for the OPENING of this scene
   - Character position, expression, action
   - Environment, location, setting details
   - Lighting (time of day, mood lighting, light sources)
   - Camera angle and composition
   - Atmosphere and mood
4. Ending frame: DETAILED visual description for the CLOSING of this scene
   - Must be DIFFERENT from starting frame (show change/progression)
   - Include all the same detail types as starting frame

IMPORTANT VISUAL DESCRIPTION GUIDELINES:
✓ Be SPECIFIC: "Man in blue jacket standing by oak tree at sunset" NOT "person outside"
✓ Include COLORS, TEXTURES, MATERIALS: "red brick wall", "soft golden light", "worn leather jacket"
✓ Describe EXPRESSIONS: "smiling warmly", "looking worried", "eyes wide with surprise"
✓ Specify POSITIONS: "left side of frame", "center, facing camera", "background right"
✓ Add ATMOSPHERIC DETAILS: "morning mist", "dramatic shadows", "warm cafe lighting"
✓ Note TIME PROGRESSION: morning → afternoon → evening → night across scenes

EXAMPLE OF GOOD SCENE PROGRESSION:
Scene 1: Morning coffee shop → Character enters, orders → sits down with laptop
Scene 2: Afternoon park → Character walks dog → stops at bench to read
Scene 3: Evening home → Character cooks dinner → sets table with candles

EXAMPLE OF BAD (REPEATED) SCENES - AVOID THIS:
❌ Scene 1: Character in coffee shop
❌ Scene 2: Character still in coffee shop (NO PROGRESSION!)
❌ Scene 3: Character in coffee shop again (REPETITIVE!)

OUTPUT FORMAT (JSON ONLY):
{
  "scenes": [
    {
      "sceneNumber": 1,
      "description": "Opening scene - protagonist arrives at the train station in early morning light",
      "startingFrame": "Wide shot of a bustling train station at dawn, soft orange sunlight streaming through tall glass windows. A young woman in a red coat stands on platform 7, looking up at the departure board with a hopeful expression. Her brown leather suitcase sits beside her feet. Cool blue tones in shadows contrast with warm golden light.",
      "endingFrame": "Medium close-up of the same woman now seated on a wooden bench, her red coat unbuttoned. She's reading a paperback book with a gentle smile. The morning light has brightened to yellow-white. Her suitcase is now propped against the bench. Background shows blurred passengers walking past."
    }
  ]
}

SCRIPT TO SPLIT:
${rawScript}

RESPOND WITH VALID JSON ONLY. NO EXPLANATIONS. NO MARKDOWN. JUST THE JSON OBJECT.
`;

        try {
            if (provider === 'openai') {
                // OpenAI - Returns response immediately
                const model = options.model || 'gpt-4o-mini';
                const result = await APIHandler.generateTextOpenAI(
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
                const result = await APIHandler.generateText(
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
