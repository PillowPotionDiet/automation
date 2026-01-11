/**
 * ENHANCED CHARACTER ANALYZER
 * Advanced character extraction with 20+ attributes
 * Detects names, appearance, personality, relationships, and more
 */

const EnhancedCharacterAnalyzer = {
    /**
     * Extract all characters from script with detailed attributes
     * @param {string} script - The full script text
     * @returns {Array} Array of character objects with detailed attributes
     */
    extractCharacters(script) {
        const characters = [];

        // Pattern 1: Parenthetical character descriptions (most detailed)
        // Format: Name (age, attributes, description)
        const parentheticalPattern = /([A-Z][a-z]+)\s*\(([^)]+)\)/g;
        const matches = script.matchAll(parentheticalPattern);

        for (const match of matches) {
            const name = match[1].trim();
            const description = match[2];

            // Skip if this is not a character (check for age/appearance keywords)
            if (!this.isLikelyCharacter(description)) {
                continue;
            }

            const character = {
                name: name,
                description: description,

                // Physical attributes
                age: this.extractAge(description),
                gender: this.detectGender(description, name),
                appearance: this.extractAppearance(description),
                height: this.extractHeight(description),
                skin: this.extractSkinTone(description),
                hairStyle: this.extractHairStyle(description),
                facialFeatures: this.extractFacialFeatures(description),
                clothing: this.extractClothing(description),

                // Personality
                personality: this.extractPersonality(description),
                demeanor: this.extractDemeanor(description),

                // Context from full script
                firstMention: script.indexOf(name),
                mentionCount: this.countMentions(script, name),
                dialoguePresence: this.hasDialogue(script, name),

                // Relationships (will be filled in second pass)
                relationships: {}
            };

            characters.push(character);
        }

        // Pattern 2: Simple name mentions (backup for names without parenthetical descriptions)
        // Look for capitalized names that appear multiple times
        const simpleNames = this.extractSimpleNames(script, characters);
        for (const name of simpleNames) {
            // Skip if already found
            if (characters.find(c => c.name === name)) continue;

            characters.push({
                name: name,
                description: '',
                age: null,
                gender: this.detectGenderFromContext(script, name),
                appearance: '',
                height: null,
                skin: null,
                hairStyle: null,
                facialFeatures: null,
                clothing: null,
                personality: [],
                demeanor: null,
                firstMention: script.indexOf(name),
                mentionCount: this.countMentions(script, name),
                dialoguePresence: this.hasDialogue(script, name),
                relationships: {}
            });
        }

        // Second pass: Extract relationships between characters
        this.extractRelationships(script, characters);

        return characters;
    },

    /**
     * Check if description likely describes a character
     */
    isLikelyCharacter(description) {
        const characterKeywords = [
            'year', 'old', 'man', 'woman', 'boy', 'girl', 'person',
            'skin', 'hair', 'eyes', 'face', 'wearing', 'personality',
            'height', 'tall', 'short', 'build', 'appearance'
        ];

        const lowerDesc = description.toLowerCase();
        return characterKeywords.some(keyword => lowerDesc.includes(keyword));
    },

    /**
     * Extract age from description
     */
    extractAge(text) {
        // Pattern: "26-year-old" or "26 years old" or "(26)"
        const agePattern = /(\d+)[\s-]?(?:year|yr)[\s-]?(?:old)?/i;
        const match = text.match(agePattern);
        return match ? parseInt(match[1]) : null;
    },

    /**
     * Detect gender from description
     */
    detectGender(description, name = '') {
        const lowerDesc = description.toLowerCase();

        // Check explicit gender terms
        if (lowerDesc.includes('man') || lowerDesc.includes('male') ||
            lowerDesc.includes('boy') || lowerDesc.includes('gentleman') ||
            lowerDesc.includes('he ') || lowerDesc.includes('his ')) {
            return 'male';
        }

        if (lowerDesc.includes('woman') || lowerDesc.includes('female') ||
            lowerDesc.includes('girl') || lowerDesc.includes('lady') ||
            lowerDesc.includes('she ') || lowerDesc.includes('her ')) {
            return 'female';
        }

        // Check common gender-specific names
        const maleNames = ['ayaan', 'hamza', 'saad', 'ali', 'omar', 'bilal', 'kamran'];
        const femaleNames = ['zara', 'sara', 'fatima', 'ayesha', 'mariam', 'aisha'];

        const lowerName = name.toLowerCase();
        if (maleNames.includes(lowerName)) return 'male';
        if (femaleNames.includes(lowerName)) return 'female';

        return 'unknown';
    },

    /**
     * Detect gender from script context
     */
    detectGenderFromContext(script, name) {
        // Get sentences containing the name
        const sentences = script.split(/[.!?]+/);
        const relevantSentences = sentences.filter(s => s.includes(name)).join(' ');

        return this.detectGender(relevantSentences, name);
    },

    /**
     * Extract appearance description
     */
    extractAppearance(text) {
        const appearance = [];

        // Extract specific appearance terms
        const appearancePatterns = [
            /\b(fair|dark|wheatish|pale|tan|olive|brown)[\s-]?(?:wheatish|skin)?\b/gi,
            /\b(tall|short|slim|muscular|thin|heavy|petite|broad-shouldered)\b/gi,
            /\b(long|short|curly|straight|wavy|black|brown|blonde|styled|trimmed)\s+(?:hair|beard)\b/gi,
            /\b(round|oval|sharp|heart-shaped|delicate)\s+(?:face|features|jawline)\b/gi,
            /\b(expressive|deep|bright|confident|lively)\s+(?:eyes)\b/gi
        ];

        for (const pattern of appearancePatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                appearance.push(match[0].trim());
            }
        }

        return appearance.join(', ');
    },

    /**
     * Extract height information
     */
    extractHeight(text) {
        const heightPattern = /\b(tall|short|medium\s+height)\b/gi;
        const match = text.match(heightPattern);
        return match ? match[0] : null;
    },

    /**
     * Extract skin tone
     */
    extractSkinTone(text) {
        const skinPattern = /\b(fair|dark|wheatish|pale|tan|olive|brown|fair-wheatish)[\s-]?(?:wheatish)?\s*skin\b/gi;
        const match = text.match(skinPattern);
        return match ? match[0] : null;
    },

    /**
     * Extract hair style
     */
    extractHairStyle(text) {
        const hairPattern = /\b(long|short|shoulder-length|curly|straight|wavy|black|brown|blonde|styled|thick|trimmed)\s+(?:black|brown|blonde)?\s*(?:hair)\b/gi;
        const match = text.match(hairPattern);
        return match ? match[0] : null;
    },

    /**
     * Extract facial features
     */
    extractFacialFeatures(text) {
        const features = [];

        const facePatterns = [
            /\b(round|oval|sharp|heart-shaped|delicate)\s+(?:face|features)\b/gi,
            /\b(sharp|strong|soft)\s+jawline\b/gi,
            /\b(light|full|trimmed|clean-shaven)\s+(?:beard|facial\s+hair)\b/gi,
            /\b(expressive|deep|bright|confident|lively)\s+eyes\b/gi
        ];

        for (const pattern of facePatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                features.push(match[0].trim());
            }
        }

        return features.join(', ');
    },

    /**
     * Extract clothing description
     */
    extractClothing(text) {
        const clothingPattern = /wearing\s+(?:a|an)?\s*([^,]+?)(?:\,|\.|\))/i;
        const match = text.match(clothingPattern);
        return match ? match[1].trim() : null;
    },

    /**
     * Extract personality traits
     */
    extractPersonality(text) {
        const traits = [];

        const personalityPatterns = {
            'calm': /\b(calm|peaceful|composed|thoughtful)\b/gi,
            'confident': /\b(confident|bold|fearless|assured)\b/gi,
            'protective': /\b(protective|caring|nurturing)\b/gi,
            'humorous': /\b(humorous|funny|cheerful|carefree)\b/gi,
            'gentle': /\b(gentle|soft-spoken|graceful|delicate)\b/gi,
            'energetic': /\b(energetic|lively|playful|outspoken)\b/gi,
            'serious': /\b(serious|stern|grave|solemn)\b/gi,
            'friendly': /\b(friendly|warm|welcoming)\b/gi
        };

        const lowerText = text.toLowerCase();
        for (const [trait, pattern] of Object.entries(personalityPatterns)) {
            if (pattern.test(lowerText)) {
                traits.push(trait);
            }
        }

        return traits;
    },

    /**
     * Extract demeanor
     */
    extractDemeanor(text) {
        const demeanorPattern = /\b(calm|confident|protective|humorous|graceful|energetic|thoughtful|carefree)\s+(?:posture|nature|attitude|personality|demeanor)\b/gi;
        const match = text.match(demeanorPattern);
        return match ? match[0] : null;
    },

    /**
     * Extract simple names (capitalized words that appear multiple times)
     */
    extractSimpleNames(script, existingCharacters) {
        const names = new Set();
        const existingNames = existingCharacters.map(c => c.name);

        // Find all capitalized words
        const capitalizedWords = script.match(/\b[A-Z][a-z]{2,}\b/g) || [];

        // Count occurrences
        const nameCounts = {};
        for (const word of capitalizedWords) {
            // Skip common words and existing names
            if (this.isCommonWord(word) || existingNames.includes(word)) continue;

            nameCounts[word] = (nameCounts[word] || 0) + 1;
        }

        // Keep names that appear 3+ times
        for (const [name, count] of Object.entries(nameCounts)) {
            if (count >= 3) {
                names.add(name);
            }
        }

        return Array.from(names);
    },

    /**
     * Check if word is a common word (not a name)
     */
    isCommonWord(word) {
        const commonWords = [
            'The', 'One', 'Day', 'Time', 'Life', 'With', 'Sara', 'Winter',
            'Curiosity', 'A', 'Few', 'As', 'Without', 'Lahore'
        ];
        return commonWords.includes(word);
    },

    /**
     * Count mentions of a name in script
     */
    countMentions(script, name) {
        const regex = new RegExp(`\\b${name}\\b`, 'gi');
        const matches = script.match(regex);
        return matches ? matches.length : 0;
    },

    /**
     * Check if character has dialogue
     */
    hasDialogue(script, name) {
        // Look for patterns like: Name said, Name replied, "..." Name
        const dialoguePatterns = [
            new RegExp(`${name}\\s+(said|replied|asked|answered|spoke|whispered|shouted)`, 'i'),
            new RegExp(`"[^"]*"\\s+${name}`, 'i')
        ];

        return dialoguePatterns.some(pattern => pattern.test(script));
    },

    /**
     * Extract relationships between characters
     */
    extractRelationships(script, characters) {
        const relationshipPatterns = {
            'friend': /\b(friend|friendship|companion|buddy|pal)\b/gi,
            'best friend': /\b(best\s+friend)\b/gi,
            'cousin': /\b(cousin)\b/gi,
            'romantic interest': /\b(love|affection|romantic|feelings\s+for)\b/gi,
            'group member': /\b(group|circle|together)\b/gi
        };

        for (let i = 0; i < characters.length; i++) {
            for (let j = i + 1; j < characters.length; j++) {
                const char1 = characters[i];
                const char2 = characters[j];

                // Find sentences mentioning both characters
                const sentences = script.split(/[.!?]+/);
                const sharedSentences = sentences.filter(s =>
                    s.includes(char1.name) && s.includes(char2.name)
                ).join(' ');

                // Detect relationship type
                for (const [type, pattern] of Object.entries(relationshipPatterns)) {
                    if (pattern.test(sharedSentences)) {
                        char1.relationships[char2.name] = type;
                        char2.relationships[char1.name] = type;
                        break;
                    }
                }

                // Default to "acquaintance" if mentioned together but no specific relationship
                if (!char1.relationships[char2.name] && sharedSentences.length > 0) {
                    char1.relationships[char2.name] = 'acquaintance';
                    char2.relationships[char1.name] = 'acquaintance';
                }
            }
        }

        // Detect "best friends" relationship from script
        if (script.includes('best friends')) {
            const bestFriendsPattern = /([A-Z][a-z]+)(?:\s*,\s*([A-Z][a-z]+))?(?:\s*,?\s*and\s+([A-Z][a-z]+))?\s+(?:had been|were)\s+best friends/i;
            const match = script.match(bestFriendsPattern);

            if (match) {
                const friendNames = [match[1], match[2], match[3]].filter(Boolean);

                // Mark all as best friends with each other
                for (const name1 of friendNames) {
                    for (const name2 of friendNames) {
                        if (name1 === name2) continue;

                        const char1 = characters.find(c => c.name === name1);
                        const char2 = characters.find(c => c.name === name2);

                        if (char1 && char2) {
                            char1.relationships[char2.name] = 'best friend';
                        }
                    }
                }
            }
        }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedCharacterAnalyzer;
}
