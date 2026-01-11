/**
 * STORYBOARD BRAIN - Local AI-Powered Storyboard System
 * Built-in intelligence for character detection, environment analysis,
 * and intelligent scene generation without external API dependencies
 */

const StoryboardBrain = {

    /**
     * CHARACTER EXTRACTION - Detect all characters from script
     * Uses pattern matching and NLP-like analysis
     */
    extractCharacters(script) {
        const characters = [];
        const characterMap = new Map();

        // Common name patterns and indicators
        const namePatterns = [
            // Direct dialogue attribution: "John said", "Mary replied"
            /([A-Z][a-z]+)\s+(said|replied|asked|shouted|whispered|called|answered|continued|exclaimed)/g,
            // Possessive forms: "John's", "Mary's"
            /([A-Z][a-z]+)'s/g,
            // Subject-verb patterns: "John walked", "Mary runs"
            /([A-Z][a-z]+)\s+(walked|runs|sits|stands|looked|went|came|left|entered|approached)/g,
            // Common character references
            /\b(he|she|his|her|him|her|Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+)/gi
        ];

        // Extract potential character names
        namePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(script)) !== null) {
                let name = match[1];
                if (name && name.length > 1 && !this.isCommonWord(name)) {
                    characterMap.set(name, (characterMap.get(name) || 0) + 1);
                }
            }
        });

        // Filter by frequency (characters mentioned multiple times)
        characterMap.forEach((count, name) => {
            if (count >= 2) {  // Mentioned at least twice
                characters.push({
                    name: name,
                    content: this.generateCharacterDescription(name, script)
                });
            }
        });

        return characters;
    },

    /**
     * Check if word is a common word (not a character name)
     */
    isCommonWord(word) {
        const commonWords = new Set([
            'The', 'And', 'But', 'For', 'Not', 'With', 'From', 'This', 'That',
            'Have', 'Has', 'Had', 'Were', 'Was', 'Been', 'Being', 'Are', 'Can',
            'Could', 'Would', 'Should', 'May', 'Might', 'Must', 'Will', 'Shall'
        ]);
        return commonWords.has(word);
    },

    /**
     * Generate detailed character description
     */
    generateCharacterDescription(name, script) {
        // Analyze context around character mentions
        const context = this.getCharacterContext(name, script);

        const attributes = [];

        // Gender detection
        const gender = this.detectGender(name, context);
        if (gender) attributes.push(gender);

        // Age hints
        const age = this.detectAge(context);
        if (age) attributes.push(age);

        // Physical descriptions
        const physical = this.detectPhysicalTraits(context);
        attributes.push(...physical);

        // Clothing/appearance
        const clothing = this.detectClothing(context);
        if (clothing.length > 0) attributes.push(...clothing);

        // Personality/demeanor
        const personality = this.detectPersonality(context);
        if (personality.length > 0) attributes.push(...personality);

        // Build description with 20+ attributes
        let description = '';

        // Add default photorealistic attributes
        const defaults = [
            'realistic facial features',
            'natural skin texture',
            'detailed eyes',
            'natural hair',
            'proportional body',
            'cinematic lighting',
            'professional photography',
            'high detail',
            '8k resolution',
            'photorealistic rendering'
        ];

        description = attributes.concat(defaults).slice(0, 20).join(', ');

        return description || 'Character with natural appearance, realistic features, professional cinematic look, detailed rendering';
    },

    /**
     * Get context sentences around character mentions
     */
    getCharacterContext(name, script) {
        const sentences = script.match(/[^.!?]+[.!?]+/g) || [];
        return sentences.filter(s => s.includes(name)).join(' ');
    },

    /**
     * Detect character gender from context
     */
    detectGender(name, context) {
        const lower = context.toLowerCase();
        if (lower.includes(' he ') || lower.includes(' his ') || lower.includes(' him ')) return 'male';
        if (lower.includes(' she ') || lower.includes(' her ') || lower.includes(' hers ')) return 'female';

        // Name-based hints
        const maleNames = ['john', 'james', 'robert', 'michael', 'william', 'david', 'richard', 'joseph'];
        const femaleNames = ['mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica'];

        const nameLower = name.toLowerCase();
        if (maleNames.includes(nameLower)) return 'male';
        if (femaleNames.includes(nameLower)) return 'female';

        return null;
    },

    /**
     * Detect age hints
     */
    detectAge(context) {
        const lower = context.toLowerCase();
        if (lower.includes('young') || lower.includes('teenager') || lower.includes('youth')) return 'young adult (18-25 years)';
        if (lower.includes('child') || lower.includes('kid') || lower.includes('boy') || lower.includes('girl')) return 'child (8-14 years)';
        if (lower.includes('old') || lower.includes('elderly') || lower.includes('aged')) return 'elderly (60+ years)';
        if (lower.includes('middle-aged')) return 'middle-aged (40-55 years)';
        return 'adult (25-40 years)';
    },

    /**
     * Detect physical traits
     */
    detectPhysicalTraits(context) {
        const traits = [];
        const lower = context.toLowerCase();

        // Hair
        if (lower.includes('blonde') || lower.includes('blond')) traits.push('blonde hair');
        else if (lower.includes('dark hair') || lower.includes('black hair')) traits.push('dark hair');
        else if (lower.includes('brown hair')) traits.push('brown hair');
        else if (lower.includes('red hair') || lower.includes('ginger')) traits.push('red hair');

        // Build
        if (lower.includes('tall')) traits.push('tall stature');
        else if (lower.includes('short')) traits.push('short stature');

        if (lower.includes('thin') || lower.includes('slender')) traits.push('slender build');
        else if (lower.includes('muscular') || lower.includes('athletic')) traits.push('athletic build');

        // Eyes
        if (lower.includes('blue eyes')) traits.push('blue eyes');
        else if (lower.includes('brown eyes')) traits.push('brown eyes');
        else if (lower.includes('green eyes')) traits.push('green eyes');

        return traits;
    },

    /**
     * Detect clothing descriptions
     */
    detectClothing(context) {
        const clothing = [];
        const lower = context.toLowerCase();

        const clothingPatterns = [
            'suit', 'dress', 'jeans', 'shirt', 'jacket', 'coat', 'uniform',
            'casual', 'formal', 'elegant', 'simple'
        ];

        clothingPatterns.forEach(item => {
            if (lower.includes(item)) clothing.push(item + ' clothing');
        });

        return clothing;
    },

    /**
     * Detect personality traits
     */
    detectPersonality(context) {
        const traits = [];
        const lower = context.toLowerCase();

        const personalityWords = {
            'confident': 'confident demeanor',
            'shy': 'shy expression',
            'angry': 'serious expression',
            'happy': 'friendly smile',
            'sad': 'melancholic look',
            'determined': 'determined expression',
            'calm': 'calm demeanor'
        };

        Object.keys(personalityWords).forEach(word => {
            if (lower.includes(word)) traits.push(personalityWords[word]);
        });

        return traits;
    },

    /**
     * ENVIRONMENT EXTRACTION - Detect all settings/locations
     */
    extractEnvironments(script) {
        const environments = [];
        const envMap = new Map();

        // Location indicators
        const locationPatterns = [
            // "in the/at the" patterns
            /(?:in|at|inside|outside|near|by)\s+(?:the|a|an)\s+([a-z\s]{3,30}?)(?:\.|,|\s+(?:he|she|they|it|there|where))/gi,
            // Common location types
            /(room|house|building|street|park|forest|city|town|village|office|shop|store|restaurant|cafe|bar|school|church|beach|mountain|valley|river|lake|field|garden)/gi
        ];

        locationPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(script)) !== null) {
                let location = match[1] || match[0];
                location = location.trim().replace(/\s+/g, ' ');
                if (location.length > 2) {
                    envMap.set(location, (envMap.get(location) || 0) + 1);
                }
            }
        });

        // Filter and generate descriptions
        envMap.forEach((count, location) => {
            if (count >= 1) {
                environments.push({
                    name: this.capitalizeLocation(location),
                    content: this.generateEnvironmentDescription(location, script)
                });
            }
        });

        // If no environments detected, add default
        if (environments.length === 0) {
            environments.push({
                name: 'General Scene',
                content: 'Indoor or outdoor setting, natural lighting, cinematic composition, professional photography, realistic atmosphere, detailed background, depth of field, 8k quality'
            });
        }

        return environments;
    },

    /**
     * Capitalize location name
     */
    capitalizeLocation(location) {
        return location.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    },

    /**
     * Generate environment description
     */
    generateEnvironmentDescription(location, script) {
        const context = this.getEnvironmentContext(location, script);
        const attributes = [];

        // Time of day
        const timeOfDay = this.detectTimeOfDay(context);
        if (timeOfDay) attributes.push(timeOfDay);

        // Weather
        const weather = this.detectWeather(context);
        if (weather) attributes.push(weather);

        // Lighting
        const lighting = this.detectLighting(context);
        if (lighting) attributes.push(lighting);

        // Mood/atmosphere
        const mood = this.detectMood(context);
        if (mood) attributes.push(mood);

        // Add cinematic defaults
        const defaults = [
            'cinematic composition',
            'professional photography',
            'detailed architecture',
            'realistic textures',
            'depth of field',
            'atmospheric perspective',
            'color grading',
            '8k resolution',
            'photorealistic rendering',
            'dramatic lighting',
            'environmental storytelling',
            'immersive atmosphere'
        ];

        return attributes.concat(defaults).slice(0, 20).join(', ');
    },

    /**
     * Get environment context
     */
    getEnvironmentContext(location, script) {
        const sentences = script.match(/[^.!?]+[.!?]+/g) || [];
        return sentences.filter(s => s.toLowerCase().includes(location.toLowerCase())).join(' ');
    },

    /**
     * Detect time of day
     */
    detectTimeOfDay(context) {
        const lower = context.toLowerCase();
        if (lower.includes('morning') || lower.includes('dawn') || lower.includes('sunrise')) return 'morning light';
        if (lower.includes('noon') || lower.includes('midday')) return 'noon brightness';
        if (lower.includes('afternoon')) return 'afternoon golden hour';
        if (lower.includes('evening') || lower.includes('dusk') || lower.includes('sunset')) return 'evening sunset glow';
        if (lower.includes('night') || lower.includes('dark')) return 'night scene';
        return 'natural daylight';
    },

    /**
     * Detect weather
     */
    detectWeather(context) {
        const lower = context.toLowerCase();
        if (lower.includes('rain') || lower.includes('rainy')) return 'rainy weather';
        if (lower.includes('snow') || lower.includes('snowy')) return 'snowy conditions';
        if (lower.includes('storm') || lower.includes('thunder')) return 'stormy atmosphere';
        if (lower.includes('fog') || lower.includes('mist')) return 'foggy ambiance';
        if (lower.includes('cloud') || lower.includes('overcast')) return 'cloudy sky';
        if (lower.includes('sunny') || lower.includes('clear')) return 'clear sunny day';
        return 'clear weather';
    },

    /**
     * Detect lighting style
     */
    detectLighting(context) {
        const lower = context.toLowerCase();
        if (lower.includes('bright')) return 'bright lighting';
        if (lower.includes('dim') || lower.includes('dark')) return 'dim atmospheric lighting';
        if (lower.includes('shadow')) return 'dramatic shadows';
        return 'natural lighting';
    },

    /**
     * Detect mood/atmosphere
     */
    detectMood(context) {
        const lower = context.toLowerCase();
        if (lower.includes('tense') || lower.includes('suspense')) return 'tense atmosphere';
        if (lower.includes('peaceful') || lower.includes('calm')) return 'peaceful mood';
        if (lower.includes('busy') || lower.includes('crowded')) return 'busy environment';
        if (lower.includes('quiet') || lower.includes('silent')) return 'quiet atmosphere';
        if (lower.includes('mysterious')) return 'mysterious ambiance';
        return 'neutral atmosphere';
    },

    /**
     * INTELLIGENT PARAGRAPH SPLITTING
     * Analyzes story structure and splits intelligently
     */
    splitIntoParagraphs(script, paragraphCount) {
        // Remove extra whitespace
        script = script.trim().replace(/\s+/g, ' ');

        // Split into sentences
        const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];

        if (sentences.length === 0) {
            return [script];
        }

        // Calculate target sentences per paragraph
        const targetPerParagraph = Math.ceil(sentences.length / paragraphCount);
        const paragraphs = [];

        let currentParagraph = [];
        let currentLength = 0;

        sentences.forEach((sentence, index) => {
            currentParagraph.push(sentence.trim());
            currentLength++;

            // Check if we should start a new paragraph
            const shouldBreak = (
                currentLength >= targetPerParagraph &&
                paragraphs.length < paragraphCount - 1
            ) || (
                index === sentences.length - 1
            );

            if (shouldBreak && currentParagraph.length > 0) {
                paragraphs.push(currentParagraph.join(' '));
                currentParagraph = [];
                currentLength = 0;
            }
        });

        // Add any remaining sentences
        if (currentParagraph.length > 0) {
            if (paragraphs.length < paragraphCount) {
                paragraphs.push(currentParagraph.join(' '));
            } else {
                // Append to last paragraph
                paragraphs[paragraphs.length - 1] += ' ' + currentParagraph.join(' ');
            }
        }

        // Ensure we have exactly the requested number of paragraphs
        while (paragraphs.length < paragraphCount) {
            paragraphs.push('...');
        }

        return paragraphs.slice(0, paragraphCount);
    },

    /**
     * SCENE GENERATION from paragraphs
     */
    generateScenesFromParagraph(paragraphText, scenesPerParagraph) {
        const scenes = [];

        // Split paragraph into smaller chunks for scenes
        const sentences = paragraphText.match(/[^.!?]+[.!?]+/g) || [paragraphText];
        const sentencesPerScene = Math.ceil(sentences.length / scenesPerParagraph);

        for (let i = 0; i < scenesPerParagraph; i++) {
            const start = i * sentencesPerScene;
            const end = Math.min(start + sentencesPerScene, sentences.length);
            const sceneText = sentences.slice(start, end).join(' ').trim();

            if (sceneText) {
                scenes.push(sceneText);
            } else {
                scenes.push('Scene continuation...');
            }
        }

        return scenes;
    },

    /**
     * FRAME PROMPT GENERATION
     * Generate start and end frame prompts for a scene
     */
    generateFramePrompts(sceneText) {
        // Analyze scene for key elements
        const hasAction = /\b(walked|running|jumped|flew|drove|moved|went|came)\b/i.test(sceneText);
        const hasDialogue = /"[^"]+"/g.test(sceneText);
        const hasEmotion = /\b(happy|sad|angry|excited|worried|surprised|shocked)\b/i.test(sceneText);

        // Extract first and last sentences for context
        const sentences = sceneText.match(/[^.!?]+[.!?]+/g) || [sceneText];
        const firstSentence = sentences[0] || sceneText;
        const lastSentence = sentences[sentences.length - 1] || sceneText;

        // Generate starting frame
        let startingFrame = this.generateVisualDescription(firstSentence, 'opening');

        // Generate ending frame
        let endingFrame = this.generateVisualDescription(lastSentence, 'closing');

        return {
            startingFrame,
            endingFrame
        };
    },

    /**
     * Generate visual description from text
     */
    generateVisualDescription(text, timing) {
        const words = text.toLowerCase();
        let description = [];

        // Detect subjects (who)
        const subjects = this.extractSubjects(text);
        if (subjects.length > 0) {
            description.push(subjects.join(' and '));
        }

        // Detect actions (what)
        const actions = this.extractActions(text);
        if (actions.length > 0) {
            description.push(actions[0]);
        }

        // Detect locations (where)
        const location = this.extractLocation(text);
        if (location) {
            description.push('in ' + location);
        }

        // Add cinematic defaults
        const cinematicDefaults = [
            'cinematic composition',
            'professional lighting',
            'realistic style',
            'detailed rendering',
            'photorealistic',
            '8k quality'
        ];

        description.push(...cinematicDefaults);

        // Add timing-specific elements
        if (timing === 'opening') {
            description.push('establishing shot', 'scene introduction');
        } else {
            description.push('scene conclusion', 'final moment');
        }

        return description.join(', ');
    },

    /**
     * Extract subjects from text
     */
    extractSubjects(text) {
        const subjects = [];
        const namePattern = /\b([A-Z][a-z]+)\b/g;
        let match;

        while ((match = namePattern.exec(text)) !== null) {
            if (!this.isCommonWord(match[1])) {
                subjects.push(match[1]);
            }
        }

        // Check for pronouns
        const lower = text.toLowerCase();
        if (subjects.length === 0) {
            if (lower.includes(' he ') || lower.includes('his')) subjects.push('man');
            if (lower.includes(' she ') || lower.includes('her')) subjects.push('woman');
        }

        return [...new Set(subjects)]; // Remove duplicates
    },

    /**
     * Extract actions from text
     */
    extractActions(text) {
        const actions = [];
        const actionPattern = /\b(walk|run|sit|stand|look|turn|move|open|close|hold|grab|reach|speak|say|tell)\w*\b/gi;
        let match;

        while ((match = actionPattern.exec(text)) !== null) {
            actions.push(match[0].toLowerCase() + 'ing');
        }

        return actions;
    },

    /**
     * Extract location from text
     */
    extractLocation(text) {
        const locationPattern = /(?:in|at|inside|outside|near|by)\s+(?:the|a|an)\s+([a-z\s]{3,20}?)(?:\.|,|\s)/i;
        const match = text.match(locationPattern);
        return match ? match[1].trim() : null;
    },

    /**
     * MAIN PIPELINE ORCHESTRATOR WITH PROGRESS TRACKING AND ERROR HANDLING
     */
    async runEnhancedPipeline(config, progressCallback) {
        const { script, paragraphCount, scenesPerParagraph } = config;

        // Initialize timeout and heartbeat monitoring
        const overallTimeout = new ProcessingTimeout(120000); // 2 minutes total
        const heartbeat = new ProcessingHeartbeat(3000, 15000); // Check every 3s, stall after 15s

        try {
            // Set up error recovery for timeout
            overallTimeout.start((error) => {
                heartbeat.stop();
                Utils.hideLoading();
                Utils.showErrorRecovery('timeout', error.message, {
                    elapsed: error.elapsed,
                    onRetry: () => {
                        window.location.reload();
                    },
                    onReduce: () => {
                        Utils.hideLoading();
                        Utils.showToast('Try reducing the number of paragraphs or scenes', 'warning');
                        window.history.back();
                    },
                    onCancel: () => {
                        window.location.href = 'index.html';
                    }
                });
            });

            // Set up error recovery for stalls
            heartbeat.start((error) => {
                overallTimeout.clear();
                Utils.hideLoading();
                Utils.showErrorRecovery('stall', error.message, {
                    timeSinceLastBeat: error.timeSinceLastBeat,
                    onRetry: () => {
                        window.location.reload();
                    },
                    onCancel: () => {
                        window.location.href = 'index.html';
                    }
                });
            });

            // STEP 1: Parse Script (0-10%)
            heartbeat.beat();
            Utils.showProgress('parse', 5, 'Parsing script...');
            // Minimal delay to show progress
            await new Promise(resolve => setTimeout(resolve, 100));

            heartbeat.beat();
            Utils.showProgress('parse', 10, 'Script parsed successfully', {
                completed: []
            });

            // STEP 2: Extract Characters (10-25%)
            heartbeat.beat();
            Utils.showProgress('characters', 12, 'Analyzing characters...');

            const characters = this.extractCharacters(script);
            heartbeat.beat();

            StateManager.saveExtractedCharacters(characters);
            heartbeat.beat();

            Utils.showProgress('characters', 25, `Found ${characters.length} characters`, {
                completed: ['parse', 'characters'],
                details: { charactersFound: characters.length }
            });

            // STEP 3: Extract Environments (25-40%)
            heartbeat.beat();
            Utils.showProgress('environments', 27, 'Detecting environments...');

            const environments = this.extractEnvironments(script);
            heartbeat.beat();

            StateManager.saveExtractedEnvironments(environments);
            heartbeat.beat();

            Utils.showProgress('environments', 40, `Found ${environments.length} environments`, {
                completed: ['parse', 'characters', 'environments'],
                details: { environmentsFound: environments.length }
            });

            // STEP 4: Split into Paragraphs (40-50%)
            heartbeat.beat();
            Utils.showProgress('paragraphs', 42, 'Splitting into paragraphs...');

            const paragraphs = this.splitIntoParagraphs(script, paragraphCount);
            heartbeat.beat();

            StateManager.saveParagraphs(paragraphs);
            heartbeat.beat();

            Utils.showProgress('paragraphs', 50, `Created ${paragraphs.length} paragraphs`, {
                completed: ['parse', 'characters', 'environments', 'paragraphs']
            });

            // STEP 5: Generate Scenes (50-90%)
            const totalScenes = paragraphCount * scenesPerParagraph;
            const allScenes = [];
            let globalSceneNumber = 1;

            paragraphs.forEach((paragraphText, paraIndex) => {
                const scenes = this.generateScenesFromParagraph(paragraphText, scenesPerParagraph);

                scenes.forEach((sceneText, sceneIndex) => {
                    heartbeat.beat();

                    const sceneProgress = 50 + ((globalSceneNumber / totalScenes) * 40);
                    Utils.showProgress('scenes', sceneProgress, `Generating scene ${globalSceneNumber} of ${totalScenes}...`, {
                        completed: ['parse', 'characters', 'environments', 'paragraphs'],
                        details: { currentScene: globalSceneNumber, totalScenes }
                    });

                    const framePrompts = this.generateFramePrompts(sceneText);

                    allScenes.push({
                        sceneNumber: globalSceneNumber++,
                        paragraphIndex: paraIndex + 1,
                        paragraphText: paragraphText,
                        sceneText: sceneText,
                        startingFrame: framePrompts.startingFrame,
                        endingFrame: framePrompts.endingFrame
                    });

                    heartbeat.beat();
                });
            });

            StateManager.saveScenes(allScenes);
            heartbeat.beat();

            // STEP 6: Complete (90-100%)
            Utils.showProgress('prompts', 95, 'Finalizing prompts...');
            await new Promise(resolve => setTimeout(resolve, 200));

            heartbeat.beat();
            Utils.showProgress('prompts', 100, 'Processing complete!', {
                completed: ['parse', 'characters', 'environments', 'paragraphs', 'scenes', 'prompts']
            });

            // Clean up monitoring
            overallTimeout.clear();
            heartbeat.stop();

            // Legacy callback support
            if (progressCallback) progressCallback('Processing complete!');

            return {
                success: true,
                characters: characters,
                environments: environments,
                paragraphs: paragraphs,
                scenes: allScenes
            };

        } catch (error) {
            console.error('Storyboard Brain error:', error);

            // Clean up monitoring
            overallTimeout.clear();
            heartbeat.stop();

            // Show error recovery
            Utils.hideLoading();
            Utils.showErrorRecovery('error', error.message || 'An unexpected error occurred during processing', {
                onRetry: () => {
                    window.location.reload();
                },
                onCancel: () => {
                    window.location.href = 'index.html';
                }
            });

            return {
                success: false,
                message: error.message
            };
        }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryboardBrain;
}
