/**
 * ENHANCED ENVIRONMENT ANALYZER
 * Advanced environment/location extraction with detailed attributes
 * Detects settings, atmosphere, lighting, weather, and sensory details
 */

const EnhancedEnvironmentAnalyzer = {
    /**
     * Extract all environments from script with detailed attributes
     * @param {string} script - The full script text
     * @returns {Array} Array of environment objects with detailed attributes
     */
    extractEnvironments(script) {
        const environments = [];

        // Pattern 1: Explicit location mentions with "in/at/on"
        const locationPatterns = [
            /\b(?:in|at|on|inside|outside|near|by|to)\s+(?:the|a|an|their)?\s*([a-z\s]{3,30}?)(?:\s+in\s+([A-Z][a-z]+))?\b/gi,
            /\b(roadside|street|city|building|room|house|shop|cafe|dhaba|restaurant|park)\b/gi
        ];

        const foundLocations = new Set();

        for (const pattern of locationPatterns) {
            const matches = script.matchAll(pattern);
            for (const match of matches) {
                let location = match[1] ? match[1].trim() : match[0].trim();

                // Clean up location name
                location = this.cleanLocationName(location);

                // Skip if too short or generic
                if (location.length < 3 || this.isGenericWord(location)) continue;

                foundLocations.add(location);
            }
        }

        // Pattern 2: Extract city/country names (capitalized locations)
        const cityPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
        const cities = script.match(cityPattern) || [];

        for (const city of cities) {
            if (this.isLikelyCity(city, script)) {
                foundLocations.add(city);
            }
        }

        // Create detailed environment objects
        for (const locationName of foundLocations) {
            const environment = {
                name: locationName,

                // Physical characteristics
                type: this.classifyLocationType(script, locationName),
                size: this.estimateSize(script, locationName),

                // Visual details
                lighting: this.extractLighting(script, locationName),
                weather: this.extractWeather(script, locationName),
                timeOfDay: this.extractTimeOfDay(script, locationName),
                season: this.extractSeason(script, locationName),
                colors: this.extractColors(script, locationName),
                atmosphere: this.extractAtmosphere(script, locationName),

                // Sensory details
                sounds: this.extractSounds(script, locationName),
                mood: this.extractMood(script, locationName),

                // Context
                firstMention: script.indexOf(locationName),
                significance: this.calculateSignificance(script, locationName),
                activities: this.extractActivities(script, locationName)
            };

            environments.push(environment);
        }

        return environments;
    },

    /**
     * Clean location name
     */
    cleanLocationName(location) {
        // Remove leading/trailing prepositions and articles
        location = location.replace(/^(the|a|an|in|at|on|to|from|by|near)\s+/i, '');
        location = location.replace(/\s+(the|a|an|in|at|on|to|from|by|near)$/i, '');

        // Capitalize first letter
        location = location.charAt(0).toUpperCase() + location.slice(1).toLowerCase();

        return location.trim();
    },

    /**
     * Check if word is too generic
     */
    isGenericWord(word) {
        const generic = [
            'time', 'day', 'night', 'moment', 'place', 'way', 'thing',
            'life', 'world', 'people', 'group', 'conversation'
        ];
        return generic.includes(word.toLowerCase());
    },

    /**
     * Check if name is likely a city
     */
    isLikelyCity(name, script) {
        // Check if mentioned with city-related context
        const cityKeywords = ['city', 'town', 'village', 'in ' + name, 'at ' + name];
        const lowerScript = script.toLowerCase();

        return cityKeywords.some(keyword => lowerScript.includes(keyword.toLowerCase()));
    },

    /**
     * Classify location type (indoor, outdoor, mixed)
     */
    classifyLocationType(script, location) {
        const context = this.getLocationContext(script, location);
        const lowerContext = context.toLowerCase();

        const outdoorKeywords = /\b(roadside|street|outdoor|outside|sky|sun|rain|wind|trees|grass|open\s+air|streetlight)\b/gi;
        const indoorKeywords = /\b(room|indoor|inside|building|house|ceiling|wall|floor|door|window)\b/gi;

        const outdoorCount = (lowerContext.match(outdoorKeywords) || []).length;
        const indoorCount = (lowerContext.match(indoorKeywords) || []).length;

        if (outdoorCount > indoorCount * 2) return 'outdoor';
        if (indoorCount > outdoorCount * 2) return 'indoor';
        return 'mixed';
    },

    /**
     * Get context sentences mentioning location
     */
    getLocationContext(script, location) {
        const sentences = script.split(/[.!?]+/);
        const relevant = sentences.filter(s => s.toLowerCase().includes(location.toLowerCase()));
        return relevant.join(' ');
    },

    /**
     * Estimate size of location
     */
    estimateSize(script, location) {
        const context = this.getLocationContext(script, location);
        const lowerContext = context.toLowerCase();

        if (/\b(small|tiny|cramped|narrow)\b/i.test(lowerContext)) return 'small';
        if (/\b(large|huge|vast|spacious|wide)\b/i.test(lowerContext)) return 'large';
        if (/\b(medium|average)\b/i.test(lowerContext)) return 'medium';

        // Infer from location type
        if (location.toLowerCase().includes('city')) return 'large';
        if (location.toLowerCase().includes('dhaba') || location.toLowerCase().includes('shop')) return 'small';

        return null;
    },

    /**
     * Extract lighting information
     */
    extractLighting(script, location) {
        const context = this.getLocationContext(script, location);
        const lighting = [];

        const lightingPatterns = {
            'dim': /\b(dim|dark|shadowy|low\s+light)\b/gi,
            'bright': /\b(bright|brilliant|well-lit|sunny)\b/gi,
            'natural': /\b(natural\s+light|sunlight|daylight)\b/gi,
            'artificial': /\b(streetlight|lamp|neon|electric)\b/gi,
            'atmospheric': /\b(glow|golden|warm\s+light|soft\s+light)\b/gi
        };

        for (const [type, pattern] of Object.entries(lightingPatterns)) {
            if (pattern.test(context)) {
                lighting.push(type);
            }
        }

        return lighting.join(', ') || null;
    },

    /**
     * Extract weather information
     */
    extractWeather(script, location) {
        const context = this.getLocationContext(script, location);

        const weatherPattern = /\b(sunny|rainy|cloudy|clear|foggy|stormy|windy)\s*(?:weather|day|evening)?\b/gi;
        const match = context.match(weatherPattern);

        return match ? match[0] : null;
    },

    /**
     * Extract time of day
     */
    extractTimeOfDay(script, location) {
        const context = this.getLocationContext(script, location);

        const timePatterns = {
            'morning': /\b(morning|dawn|sunrise|early\s+day)\b/gi,
            'afternoon': /\b(afternoon|midday|noon)\b/gi,
            'evening': /\b(evening|dusk|sunset|twilight)\b/gi,
            'night': /\b(night|nighttime|midnight|dark)\b/gi
        };

        for (const [time, pattern] of Object.entries(timePatterns)) {
            if (pattern.test(context)) {
                return time;
            }
        }

        return null;
    },

    /**
     * Extract season
     */
    extractSeason(script, location) {
        const context = this.getLocationContext(script, location);

        const seasonPattern = /\b(spring|summer|autumn|fall|winter)\b/gi;
        const match = context.match(seasonPattern);

        return match ? match[0] : null;
    },

    /**
     * Extract colors mentioned
     */
    extractColors(script, location) {
        const context = this.getLocationContext(script, location);
        const colors = [];

        const colorPattern = /\b(red|blue|green|yellow|orange|purple|pink|black|white|gray|brown|golden|silver)\b/gi;
        const matches = context.matchAll(colorPattern);

        for (const match of matches) {
            if (!colors.includes(match[0].toLowerCase())) {
                colors.push(match[0].toLowerCase());
            }
        }

        return colors.join(', ') || null;
    },

    /**
     * Extract atmosphere/ambiance
     */
    extractAtmosphere(script, location) {
        const context = this.getLocationContext(script, location);
        const atmospheres = [];

        const atmospherePatterns = {
            'peaceful': /\b(peaceful|calm|serene|tranquil|quiet)\b/gi,
            'bustling': /\b(bustling|busy|crowded|lively|energetic|vibrant)\b/gi,
            'tense': /\b(tense|stressful|anxious|heavy)\b/gi,
            'romantic': /\b(romantic|intimate|cozy|warm)\b/gi,
            'melancholic': /\b(melancholic|sad|empty|lonely)\b/gi,
            'joyful': /\b(joyful|happy|cheerful|uplifting)\b/gi,
            'mysterious': /\b(mysterious|enigmatic|strange)\b/gi
        };

        for (const [atmosphere, pattern] of Object.entries(atmospherePatterns)) {
            if (pattern.test(context)) {
                atmospheres.push(atmosphere);
            }
        }

        return atmospheres.join(', ') || null;
    },

    /**
     * Extract sounds
     */
    extractSounds(script, location) {
        const context = this.getLocationContext(script, location);
        const sounds = [];

        const soundPatterns = {
            'voices': /\b(voices|talking|conversation|chatter|laughter)\b/gi,
            'traffic': /\b(traffic|cars|vehicles|horns)\b/gi,
            'nature': /\b(birds|wind|leaves|rustling)\b/gi,
            'music': /\b(music|song|melody)\b/gi,
            'silence': /\b(silence|quiet|still)\b/gi
        };

        for (const [sound, pattern] of Object.entries(soundPatterns)) {
            if (pattern.test(context)) {
                sounds.push(sound);
            }
        }

        return sounds.join(', ') || null;
    },

    /**
     * Extract mood
     */
    extractMood(script, location) {
        const context = this.getLocationContext(script, location);

        const moodPatterns = {
            'hopeful': /\b(hopeful|optimistic|dreams|future)\b/gi,
            'nostalgic': /\b(nostalgic|memories|childhood|past)\b/gi,
            'somber': /\b(somber|heavy|sad|empty)\b/gi,
            'uplifting': /\b(uplifting|inspiring|encouraging)\b/gi,
            'neutral': /\b(normal|ordinary|typical)\b/gi
        };

        for (const [mood, pattern] of Object.entries(moodPatterns)) {
            if (pattern.test(context)) {
                return mood;
            }
        }

        return null;
    },

    /**
     * Calculate significance of location (0-100)
     */
    calculateSignificance(script, location) {
        const mentionCount = (script.match(new RegExp(location, 'gi')) || []).length;
        const scriptLength = script.split(/\s+/).length;

        // Significance based on mention frequency
        const frequency = (mentionCount / scriptLength) * 1000;

        // Cap at 100
        return Math.min(100, Math.round(frequency * 20));
    },

    /**
     * Extract activities that happen in location
     */
    extractActivities(script, location) {
        const context = this.getLocationContext(script, location);
        const activities = [];

        const activityPatterns = {
            'meeting': /\b(meeting|gathered|met|assembly)\b/gi,
            'conversation': /\b(talking|chatting|conversation|discussing)\b/gi,
            'eating/drinking': /\b(eating|drinking|tea|chai|food)\b/gi,
            'reading': /\b(reading|book)\b/gi,
            'walking': /\b(walking|strolling|wandering)\b/gi,
            'waiting': /\b(waiting|sitting|lingering)\b/gi
        };

        for (const [activity, pattern] of Object.entries(activityPatterns)) {
            if (pattern.test(context)) {
                activities.push(activity);
            }
        }

        return activities.join(', ') || null;
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedEnvironmentAnalyzer;
}
