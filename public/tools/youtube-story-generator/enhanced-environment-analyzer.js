/**
 * ULTRA-POWERFUL ENVIRONMENT ANALYZER V3
 * Handles ANY script format and extracts detailed location information
 * Uses multiple detection strategies and contextual analysis
 */

const EnhancedEnvironmentAnalyzer = {
    /**
     * Extract ALL environments using MULTIPLE detection strategies
     */
    extractEnvironments(script) {
        console.log('[Environment Analyzer] Starting deep analysis...');

        const allEnvironments = new Map(); // name -> environment object

        // STRATEGY 1: Explicit location indicators (in/at/on/inside/outside)
        this.extractExplicitLocations(script, allEnvironments);

        // STRATEGY 2: Common location types
        this.extractLocationTypes(script, allEnvironments);

        // STRATEGY 3: City/place names
        this.extractPlaceNames(script, allEnvironments);

        // STRATEGY 4: Descriptive locations from context
        this.extractDescriptiveLocations(script, allEnvironments);

        // ENRICH: Add contextual details for all environments
        for (const [name, env] of allEnvironments.entries()) {
            this.enrichEnvironment(env, script);
        }

        const environments = Array.from(allEnvironments.values());

        // Add default if nothing found
        if (environments.length === 0) {
            environments.push({
                name: 'General Scene',
                confidence: 50,
                content: this.generateDefaultContent()
            });
        }

        console.log(`[Environment Analyzer] Found ${environments.length} environments:`,
                    environments.map(e => `${e.name} (${e.confidence}% confidence)`));

        return environments;
    },

    /**
     * STRATEGY 1: Extract explicit location mentions
     * Handles: "in the park", "at the cafe", "inside the house"
     */
    extractExplicitLocations(script, envMap) {
        const patterns = [
            // in/at/on the LOCATION
            /\b(?:in|at|on|inside|outside|near|by|beside|within)\s+(?:the|a|an)\s+([a-z\s]{3,40}?)(?:\.|,|;|\s+(?:where|when|as|while|he|she|they|it|there))/gi,
            // from the LOCATION
            /\bfrom\s+(?:the|a|an)\s+([a-z\s]{3,30}?)\s+(?:to|into|toward)/gi,
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(script)) !== null) {
                let location = match[1].trim();

                // Clean up location name
                location = this.cleanLocationName(location);

                if (location.length < 3 || this.isGenericWord(location)) continue;

                if (!envMap.has(location)) {
                    envMap.set(location, {
                        name: this.capitalizeLocation(location),
                        descriptions: [],
                        confidence: 85,
                        detectionMethod: 'explicit'
                    });
                }
            }
        }
    },

    /**
     * STRATEGY 2: Common location types
     * Handles: roadside, street, park, cafe, house, etc.
     */
    extractLocationTypes(script, envMap) {
        const locationTypes = [
            // Outdoor
            'roadside', 'street', 'road', 'highway', 'alley', 'boulevard',
            'park', 'garden', 'forest', 'field', 'meadow', 'beach', 'shore',
            'mountain', 'hill', 'valley', 'desert', 'countryside',

            // Indoor
            'room', 'house', 'home', 'building', 'apartment', 'office',
            'shop', 'store', 'market', 'mall', 'bazaar',

            // Food & drink
            'restaurant', 'cafe', 'coffee shop', 'dhaba', 'tea shop', 'bar', 'pub',

            // Public places
            'school', 'college', 'university', 'library', 'museum',
            'hospital', 'clinic', 'church', 'mosque', 'temple',
            'station', 'airport', 'port', 'terminal',

            // Entertainment
            'theater', 'cinema', 'stadium', 'arena', 'playground'
        ];

        const lowerScript = script.toLowerCase();

        for (const locType of locationTypes) {
            const pattern = new RegExp(`\\b${locType}\\b`, 'gi');
            const matches = script.match(pattern);

            if (matches && matches.length >= 1) {
                const capitalized = this.capitalizeLocation(locType);

                if (!envMap.has(capitalized)) {
                    envMap.set(capitalized, {
                        name: capitalized,
                        descriptions: [],
                        confidence: 90,
                        detectionMethod: 'type'
                    });
                }
            }
        }

        // Special case: "chai dhaba" or "favorite dhaba"
        const dhabaPattern = /(?:chai|favorite|roadside)\s+dhaba/gi;
        const dhabaMatch = script.match(dhabaPattern);
        if (dhabaMatch) {
            const name = 'Roadside Chai Dhaba';
            if (!envMap.has(name)) {
                envMap.set(name, {
                    name: name,
                    descriptions: [],
                    confidence: 95,
                    detectionMethod: 'specific'
                });
            }
        }
    },

    /**
     * STRATEGY 3: City and place names
     * Handles: Lahore, Karachi, Mumbai, etc.
     */
    extractPlaceNames(script, envMap) {
        // Common Pakistani/Indian/World cities
        const knownCities = [
            'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Multan',
            'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
            'London', 'Paris', 'New York', 'Dubai', 'Singapore'
        ];

        for (const city of knownCities) {
            const pattern = new RegExp(`\\b${city}\\b`, 'gi');
            const matches = script.match(pattern);

            if (matches && matches.length >= 2) {
                if (!envMap.has(city)) {
                    envMap.set(city, {
                        name: city,
                        descriptions: [],
                        confidence: 95,
                        detectionMethod: 'city'
                    });
                }
            }
        }

        // Generic pattern for potential place names (capitalized, mentioned 3+ times)
        const capitalizedWords = script.match(/\b[A-Z][a-z]{3,}\b/g) || [];
        const counts = new Map();

        for (const word of capitalizedWords) {
            if (this.isGenericWord(word) || envMap.has(word)) continue;
            counts.set(word, (counts.get(word) || 0) + 1);
        }

        for (const [name, count] of counts.entries()) {
            if (count >= 3 && this.looksLikePlaceName(script, name)) {
                envMap.set(name, {
                    name: name,
                    descriptions: [],
                    confidence: Math.min(60 + (count * 5), 85),
                    detectionMethod: 'place'
                });
            }
        }
    },

    /**
     * STRATEGY 4: Descriptive locations from narrative
     * Handles: "under the glow of streetlights", "winter morning"
     */
    extractDescriptiveLocations(script, envMap) {
        // Time + location patterns
        const timeLocationPattern = /\b(morning|afternoon|evening|night)\s+(?:at|in|on)\s+([a-z\s]{3,30}?)\b/gi;
        let match;

        while ((match = timeLocationPattern.exec(script)) !== null) {
            const location = this.cleanLocationName(match[2]);
            if (location.length >= 3 && !this.isGenericWord(location)) {
                const name = this.capitalizeLocation(location);
                if (!envMap.has(name)) {
                    envMap.set(name, {
                        name: name,
                        descriptions: [],
                        confidence: 75,
                        detectionMethod: 'descriptive'
                    });
                }
            }
        }
    },

    /**
     * Check if word looks like a place name
     */
    looksLikePlaceName(script, name) {
        // Check if mentioned with location keywords
        const pattern = new RegExp(`\\b(?:in|at|to|from|near)\\s+${name}\\b`, 'i');
        return pattern.test(script);
    },

    /**
     * Clean location name
     */
    cleanLocationName(location) {
        // Remove leading/trailing prepositions and articles
        location = location.replace(/^(the|a|an|in|at|on|to|from|by|near)\s+/i, '');
        location = location.replace(/\s+(the|a|an|in|at|on|to|from|by|near)$/i, '');
        return location.trim();
    },

    /**
     * Capitalize location
     */
    capitalizeLocation(location) {
        return location.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    },

    /**
     * Check if word is too generic
     */
    isGenericWord(word) {
        const generic = [
            'time', 'day', 'night', 'moment', 'place', 'way', 'thing', 'one',
            'life', 'world', 'people', 'group', 'conversation', 'everyone',
            'somewhere', 'anywhere', 'nowhere', 'something', 'nothing'
        ];
        return generic.some(g => g.toLowerCase() === word.toLowerCase());
    },

    /**
     * ENRICH: Extract detailed attributes for each environment
     */
    enrichEnvironment(env, script) {
        // Get all context mentioning this environment
        const context = this.getLocationContext(script, env.name);
        const parts = context.split(/[,;]+/).map(p => p.trim());

        // Extract EVERYTHING
        env.type = this.classifyLocationType(context);
        env.size = this.estimateSize(context);
        env.lighting = this.extractLighting(context);
        env.weather = this.extractWeather(context);
        env.timeOfDay = this.extractTimeOfDay(context);
        env.season = this.extractSeason(context);
        env.colors = this.extractColors(context);
        env.atmosphere = this.extractAtmosphere(context);
        env.sounds = this.extractSounds(context);
        env.mood = this.extractMood(context);
        env.activities = this.extractActivities(context);
        env.significance = this.calculateSignificance(script, env.name);

        // Generate content string
        env.content = this.generateContentString(env);
    },

    /**
     * Get context sentences mentioning location
     */
    getLocationContext(script, location) {
        const sentences = script.split(/[.!?]+/);
        const relevant = sentences.filter(s =>
            s.toLowerCase().includes(location.toLowerCase())
        );
        return relevant.join('. ');
    },

    /**
     * Classify location type
     */
    classifyLocationType(context) {
        const lower = context.toLowerCase();

        const outdoorKeywords = ['roadside', 'street', 'outdoor', 'outside', 'sky', 'sun', 'wind', 'open air', 'streetlight', 'glow'];
        const indoorKeywords = ['room', 'indoor', 'inside', 'building', 'house', 'ceiling', 'wall', 'floor'];

        const outdoorCount = outdoorKeywords.filter(kw => lower.includes(kw)).length;
        const indoorCount = indoorKeywords.filter(kw => lower.includes(kw)).length;

        if (outdoorCount > indoorCount) return 'outdoor';
        if (indoorCount > outdoorCount) return 'indoor';
        return 'mixed';
    },

    estimateSize(context) {
        const lower = context.toLowerCase();
        if (/\b(small|tiny|cramped|narrow|cozy)\b/.test(lower)) return 'small';
        if (/\b(large|huge|vast|spacious|wide|expansive)\b/.test(lower)) return 'large';
        if (/\b(medium|average|moderate)\b/.test(lower)) return 'medium';
        return null;
    },

    extractLighting(context) {
        const patterns = [
            /\b(dim|dark|shadowy|low)\s+(?:light|lighting|atmosphere)/i,
            /\b(bright|brilliant|well-lit|sunny|radiant)\s+(?:light|lighting)?/i,
            /\b(natural|sunlight|daylight|moonlight)\b/i,
            /\b(streetlight|lamp|neon|electric|artificial)\s*(?:light|lighting)?/i,
            /\b(glow|golden|warm|soft|atmospheric)\s+(?:light|lighting|glow)/i
        ];

        const lighting = [];
        for (const pattern of patterns) {
            const match = context.match(pattern);
            if (match) lighting.push(match[0]);
        }

        return lighting.length > 0 ? lighting.join(', ') : null;
    },

    extractWeather(context) {
        const pattern = /\b(sunny|rainy|cloudy|clear|foggy|stormy|windy|snowy|misty)\s*(?:weather|day|evening|morning)?/i;
        const match = context.match(pattern);
        return match ? match[1] : null;
    },

    extractTimeOfDay(context) {
        const lower = context.toLowerCase();
        if (/\b(morning|dawn|sunrise|early day)\b/.test(lower)) return 'morning';
        if (/\b(afternoon|midday|noon)\b/.test(lower)) return 'afternoon';
        if (/\b(evening|dusk|sunset|twilight)\b/.test(lower)) return 'evening';
        if (/\b(night|nighttime|midnight)\b/.test(lower)) return 'night';
        return null;
    },

    extractSeason(context) {
        const pattern = /\b(spring|summer|autumn|fall|winter)\b/i;
        const match = context.match(pattern);
        return match ? match[1] : null;
    },

    extractColors(context) {
        const pattern = /\b(red|blue|green|yellow|orange|purple|pink|black|white|gray|grey|brown|golden|silver|pastel)\b/gi;
        const matches = context.match(pattern) || [];
        const unique = [...new Set(matches.map(m => m.toLowerCase()))];
        return unique.length > 0 ? unique.join(', ') : null;
    },

    extractAtmosphere(context) {
        const atmospheres = [];
        const patterns = {
            'peaceful': /\b(peaceful|calm|serene|tranquil|quiet)\b/i,
            'bustling': /\b(bustling|busy|crowded|lively|energetic|vibrant)\b/i,
            'tense': /\b(tense|stressful|anxious|heavy)\b/i,
            'romantic': /\b(romantic|intimate|cozy|warm)\b/i,
            'melancholic': /\b(melancholic|sad|empty|lonely)\b/i,
            'joyful': /\b(joyful|happy|cheerful|uplifting)\b/i
        };

        for (const [atm, pattern] of Object.entries(patterns)) {
            if (pattern.test(context)) atmospheres.push(atm);
        }

        return atmospheres.length > 0 ? atmospheres.join(', ') : null;
    },

    extractSounds(context) {
        const sounds = [];
        const patterns = {
            'voices': /\b(voices|talking|conversation|chatter|laughter)\b/i,
            'traffic': /\b(traffic|cars|vehicles|horns)\b/i,
            'nature': /\b(birds|wind|leaves|rustling|rain)\b/i,
            'music': /\b(music|song|melody)\b/i,
            'silence': /\b(silence|quiet|still)\b/i
        };

        for (const [sound, pattern] of Object.entries(patterns)) {
            if (pattern.test(context)) sounds.push(sound);
        }

        return sounds.length > 0 ? sounds.join(', ') : null;
    },

    extractMood(context) {
        const patterns = {
            'hopeful': /\b(hopeful|optimistic|dreams|future|better)\b/i,
            'nostalgic': /\b(nostalgic|memories|childhood|past)\b/i,
            'somber': /\b(somber|heavy|sad|empty)\b/i,
            'uplifting': /\b(uplifting|inspiring|encouraging)\b/i,
            'neutral': /\b(normal|ordinary|typical|regular)\b/i
        };

        for (const [mood, pattern] of Object.entries(patterns)) {
            if (pattern.test(context)) return mood;
        }

        return null;
    },

    extractActivities(context) {
        const activities = [];
        const patterns = {
            'meeting': /\b(meeting|gathered|met|assembly|gathering)\b/i,
            'conversation': /\b(talking|chatting|conversation|discussing|sharing)\b/i,
            'eating/drinking': /\b(eating|drinking|tea|chai|coffee|food|meal)\b/i,
            'reading': /\b(reading|book|studying)\b/i,
            'walking': /\b(walking|strolling|wandering|pacing)\b/i,
            'waiting': /\b(waiting|sitting|lingering)\b/i,
            'shopping': /\b(shopping|buying|browsing)\b/i,
            'playing': /\b(playing|game|sport)\b/i
        };

        for (const [activity, pattern] of Object.entries(patterns)) {
            if (pattern.test(context)) activities.push(activity);
        }

        return activities.length > 0 ? activities.join(', ') : null;
    },

    calculateSignificance(script, location) {
        const mentions = (script.match(new RegExp(location, 'gi')) || []).length;
        const scriptLength = script.split(/\s+/).length;
        const frequency = (mentions / scriptLength) * 1000;
        return Math.min(100, Math.round(frequency * 20));
    },

    /**
     * Generate content string from environment attributes
     */
    generateContentString(env) {
        const parts = [];

        // Type and size
        if (env.type) parts.push(env.type);
        if (env.size) parts.push(`${env.size} space`);

        // Time and weather
        if (env.timeOfDay) parts.push(`${env.timeOfDay} time`);
        if (env.season) parts.push(env.season);
        if (env.weather) parts.push(`${env.weather} weather`);

        // Visual details
        if (env.lighting) parts.push(env.lighting);
        if (env.colors) parts.push(env.colors);

        // Atmosphere and mood
        if (env.atmosphere) parts.push(`${env.atmosphere} atmosphere`);
        if (env.mood) parts.push(`${env.mood} mood`);

        // Sounds and activities
        if (env.sounds) parts.push(env.sounds);
        if (env.activities) parts.push(env.activities);

        // Add cinematic defaults for image generation
        parts.push('cinematic composition');
        parts.push('professional photography');
        parts.push('detailed architecture');
        parts.push('realistic textures');
        parts.push('atmospheric perspective');
        parts.push('color grading');
        parts.push('depth of field');
        parts.push('8k resolution');
        parts.push('photorealistic rendering');
        parts.push('dramatic lighting');
        parts.push('environmental storytelling');
        parts.push('immersive atmosphere');

        return parts.join(', ');
    },

    /**
     * Generate default content when no environments detected
     */
    generateDefaultContent() {
        return 'general scene, neutral atmosphere, natural lighting, cinematic composition, professional photography, detailed background, realistic textures, depth of field, atmospheric perspective, 8k resolution, photorealistic rendering';
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedEnvironmentAnalyzer;
}
