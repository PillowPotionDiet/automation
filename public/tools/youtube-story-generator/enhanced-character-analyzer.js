/**
 * ULTRA-POWERFUL CHARACTER ANALYZER V3
 * Handles ANY script format - parenthetical, narrative, dialogue-based, action-based
 * Uses multiple detection strategies and AI-like intelligence
 */

const EnhancedCharacterAnalyzer = {
    /**
     * Extract ALL characters using MULTIPLE detection strategies
     */
    extractCharacters(script) {
        console.log('[Character Analyzer] Starting deep analysis...');

        const allCharacters = new Map(); // name -> character object

        // STRATEGY 1: Parenthetical descriptions (e.g., "Name (26-year-old man...)")
        this.extractParenthetical(script, allCharacters);

        // STRATEGY 2: Narrative descriptions (e.g., "John, a tall man with...")
        this.extractNarrative(script, allCharacters);

        // STRATEGY 3: Dialogue and action patterns
        this.extractFromDialogue(script, allCharacters);

        // STRATEGY 4: Proper names mentioned multiple times
        this.extractFrequentNames(script, allCharacters);

        // ENRICH: Add contextual details for all characters
        for (const [name, char] of allCharacters.entries()) {
            this.enrichCharacter(char, script);
        }

        // RELATIONSHIPS: Detect connections between characters
        const characters = Array.from(allCharacters.values());
        this.extractRelationships(script, characters);

        console.log(`[Character Analyzer] Found ${characters.length} characters:`,
                    characters.map(c => `${c.name} (${c.confidence}% confidence)`));

        return characters;
    },

    /**
     * STRATEGY 1: Extract from parenthetical descriptions
     * Handles: "Name (age, description, details)"
     */
    extractParenthetical(script, charactersMap) {
        // Match: Name (at least 20 chars of description)
        const pattern = /\b([A-Z][a-z]+)\s*\(([^)]{20,}?)\)/g;
        let match;

        while ((match = pattern.exec(script)) !== null) {
            const name = match[1];
            const description = match[2];

            // Only process if description looks like a character
            if (!this.looksLikeCharacter(description)) continue;
            if (this.isCommonWord(name)) continue;

            if (!charactersMap.has(name)) {
                charactersMap.set(name, {
                    name: name,
                    descriptions: [],
                    confidence: 95, // High confidence for parenthetical
                    detectionMethod: 'parenthetical'
                });
            }

            charactersMap.get(name).descriptions.push(description);
        }
    },

    /**
     * STRATEGY 2: Extract from narrative descriptions
     * Handles: "John, a tall man with dark hair, walked..."
     *          "A young woman named Sarah appeared..."
     */
    extractNarrative(script, charactersMap) {
        const patterns = [
            // Pattern: "Name, a/an DESCRIPTION,"
            /\b([A-Z][a-z]+),\s+a(?:n)?\s+([^,]{10,100}?),/g,
            // Pattern: "DESCRIPTION named Name"
            /\ba(?:n)?\s+([^,]{10,50}?)\s+named\s+([A-Z][a-z]+)/g,
            // Pattern: "Name was a DESCRIPTION"
            /\b([A-Z][a-z]+)\s+(?:was|is)\s+a(?:n)?\s+([^.!?]{10,100}?)[\.\!\?]/g,
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(script)) !== null) {
                let name, description;

                // Handle different pattern groups
                if (match[0].includes('named')) {
                    description = match[1];
                    name = match[2];
                } else {
                    name = match[1];
                    description = match[2];
                }

                if (this.isCommonWord(name)) continue;
                if (!this.looksLikeCharacter(description)) continue;

                if (!charactersMap.has(name)) {
                    charactersMap.set(name, {
                        name: name,
                        descriptions: [],
                        confidence: 85,
                        detectionMethod: 'narrative'
                    });
                }

                charactersMap.get(name).descriptions.push(description);
            }
        }
    },

    /**
     * STRATEGY 3: Extract from dialogue and actions
     * Handles: "John said", "Mary walked", possessives, etc.
     */
    extractFromDialogue(script, charactersMap) {
        const patterns = [
            // Dialogue: "Name said/asked/replied"
            /\b([A-Z][a-z]+)\s+(said|asked|replied|shouted|whispered|answered|exclaimed|called|continued|spoke)/g,
            // Possessive: "Name's"
            /\b([A-Z][a-z]+)'s\s+/g,
            // Actions: "Name walked/looked/turned"
            /\b([A-Z][a-z]+)\s+(walked|looked|turned|ran|stood|sat|entered|left|approached|noticed)/g,
        ];

        const nameCounts = new Map();

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(script)) !== null) {
                const name = match[1];
                if (this.isCommonWord(name)) continue;

                nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
            }
        }

        // Only add names mentioned 2+ times
        for (const [name, count] of nameCounts.entries()) {
            if (count >= 2 && !charactersMap.has(name)) {
                charactersMap.set(name, {
                    name: name,
                    descriptions: [],
                    confidence: Math.min(50 + (count * 5), 80),
                    detectionMethod: 'dialogue'
                });
            }
        }
    },

    /**
     * STRATEGY 4: Extract frequently mentioned proper names
     */
    extractFrequentNames(script, charactersMap) {
        const words = script.match(/\b[A-Z][a-z]{2,}\b/g) || [];
        const counts = new Map();

        for (const word of words) {
            if (this.isCommonWord(word)) continue;
            if (charactersMap.has(word)) continue; // Already found

            counts.set(word, (counts.get(word) || 0) + 1);
        }

        // Add names mentioned 4+ times
        for (const [name, count] of counts.entries()) {
            if (count >= 4) {
                charactersMap.set(name, {
                    name: name,
                    descriptions: [],
                    confidence: Math.min(40 + (count * 3), 75),
                    detectionMethod: 'frequency'
                });
            }
        }
    },

    /**
     * ENRICH: Extract detailed attributes for each character
     */
    enrichCharacter(character, script) {
        // Combine all description sources
        const fullContext = [
            ...character.descriptions,
            this.getNameContext(script, character.name)
        ].join(' ');

        // Split into analyzable parts
        const parts = fullContext.split(/[,;]+/).map(p => p.trim());

        // Extract EVERYTHING
        character.age = this.extractAge(fullContext);
        character.gender = this.detectGender(fullContext, character.name);
        character.nationality = this.extractNationality(parts);

        // Physical appearance
        character.skinTone = this.extractSkinTone(parts);
        character.faceShape = this.extractFaceShape(parts);
        character.hairColor = this.extractHairColor(parts);
        character.hairLength = this.extractHairLength(parts);
        character.hairStyle = this.extractHairStyle(parts);
        character.facialHair = this.extractFacialHair(parts);
        character.eyeColor = this.extractEyeColor(parts);
        character.eyeDescription = this.extractEyeDescription(parts);
        character.height = this.extractHeight(parts);
        character.bodyBuild = this.extractBodyBuild(parts);
        character.facialFeatures = this.extractFacialFeatures(parts);

        // Clothing
        character.clothing = this.extractClothing(parts);
        character.accessories = this.extractAccessories(parts);

        // Personality
        character.personalityTraits = this.extractPersonalityTraits(parts);
        character.demeanor = this.extractDemeanor(parts);
        character.attitude = this.extractAttitude(parts);

        // Context
        character.mentionCount = this.countMentions(script, character.name);
        character.firstMention = script.indexOf(character.name);
        character.dialoguePresence = this.hasDialogue(script, character.name);

        // Generate content string for compatibility
        character.content = this.generateContentString(character);
    },

    /**
     * Get all context around character name
     */
    getNameContext(script, name) {
        const sentences = script.split(/[.!?]+/);
        const relevant = sentences.filter(s => s.includes(name));
        return relevant.join('. ');
    },

    /**
     * Check if text describes a character
     */
    looksLikeCharacter(text) {
        const keywords = [
            'year', 'old', 'man', 'woman', 'boy', 'girl', 'male', 'female',
            'skin', 'hair', 'eyes', 'face', 'wearing', 'personality',
            'tall', 'short', 'pakistani', 'indian', 'american', 'age'
        ];
        const lower = text.toLowerCase();
        return keywords.some(kw => lower.includes(kw));
    },

    /**
     * Common words that aren't character names
     */
    isCommonWord(word) {
        const common = [
            'The', 'One', 'Day', 'Time', 'Life', 'With', 'Winter', 'Curiosity',
            'A', 'Few', 'As', 'Without', 'Lahore', 'Mr', 'Mrs', 'Ms', 'Dr',
            'When', 'Where', 'What', 'How', 'Why', 'Who', 'Which', 'Before',
            'After', 'During', 'While', 'Since', 'Until', 'Because', 'Although'
        ];
        return common.includes(word);
    },

    // ========== EXTRACTION METHODS ==========

    extractAge(text) {
        const patterns = [
            /(\d+)[\s-]?year[\s-]?old/i,
            /age[:\s]+(\d+)/i
        ];
        for (const p of patterns) {
            const m = text.match(p);
            if (m) return parseInt(m[1]);
        }
        return null;
    },

    detectGender(text, name) {
        const lower = text.toLowerCase();
        if (/\b(man|male|he|his|him|gentleman|boy|father|brother|son)\b/.test(lower)) return 'male';
        if (/\b(woman|female|she|her|lady|girl|mother|sister|daughter)\b/.test(lower)) return 'female';

        // Name-based detection
        const maleNames = ['ayaan', 'hamza', 'saad', 'ali', 'omar', 'bilal', 'kamran'];
        const femaleNames = ['zara', 'sara', 'fatima', 'ayesha', 'mariam', 'aisha'];
        const n = name.toLowerCase();
        if (maleNames.includes(n)) return 'male';
        if (femaleNames.includes(n)) return 'female';

        return 'unknown';
    },

    extractNationality(parts) {
        const pattern = /(pakistani|indian|american|british|chinese|japanese|korean|arab|turkish|persian|afghan|bangladeshi|sri lankan)/i;
        for (const part of parts) {
            const m = part.match(pattern);
            if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
        }
        return null;
    },

    extractSkinTone(parts) {
        for (const part of parts) {
            if (/skin/i.test(part)) {
                const m = part.match(/(fair|wheatish|dark|pale|tan|olive|brown|light|medium|deep|fair-wheatish)[\s-]*(wheatish|skin)?/i);
                if (m) return part.trim();
            }
        }
        return null;
    },

    extractFaceShape(parts) {
        const pattern = /(oval|round|square|heart-shaped|oblong|delicate|angular|sharp)\s+(face|features)/i;
        for (const part of parts) {
            const m = part.match(pattern);
            if (m) return m[1];
        }
        return null;
    },

    extractHairColor(parts) {
        const pattern = /(black|brown|blonde|gray|white|red|auburn)\s+hair/i;
        for (const part of parts) {
            const m = part.match(pattern);
            if (m) return m[1];
        }
        return null;
    },

    extractHairLength(parts) {
        const pattern = /(long|short|shoulder-length|waist-length|medium)\s+(?:black|brown|blonde|hair)/i;
        for (const part of parts) {
            const m = part.match(pattern);
            if (m) return m[1];
        }
        return null;
    },

    extractHairStyle(parts) {
        for (const part of parts) {
            if (/hair/i.test(part)) {
                return part.trim();
            }
        }
        return null;
    },

    extractFacialHair(parts) {
        for (const part of parts) {
            if (/beard|shaven|mustache|stubble/i.test(part)) {
                return part.trim();
            }
        }
        return null;
    },

    extractEyeColor(parts) {
        const pattern = /(brown|blue|green|hazel|gray|black|amber)\s+eyes/i;
        for (const part of parts) {
            const m = part.match(pattern);
            if (m) return m[1];
        }
        return null;
    },

    extractEyeDescription(parts) {
        for (const part of parts) {
            if (/eyes/i.test(part)) {
                return part.trim();
            }
        }
        return null;
    },

    extractHeight(parts) {
        const pattern = /(tall|short|medium height|average height|petite)\b/i;
        for (const part of parts) {
            const m = part.match(pattern);
            if (m) return m[0].trim();
        }
        return null;
    },

    extractBodyBuild(parts) {
        const pattern = /(slim|muscular|athletic|broad-shouldered|thin|lean|stocky)\b/i;
        const builds = [];
        for (const part of parts) {
            const m = part.match(pattern);
            if (m) builds.push(m[0]);
        }
        return builds.length > 0 ? builds.join(', ') : null;
    },

    extractFacialFeatures(parts) {
        const pattern = /(sharp|delicate|strong|soft)\s+(jawline|cheekbones|features)/i;
        const features = [];
        for (const part of parts) {
            const m = part.match(pattern);
            if (m) features.push(m[0]);
        }
        return features.length > 0 ? features.join(', ') : null;
    },

    extractClothing(parts) {
        const keywords = ['wearing', 'dressed', 'kurta', 'shalwar', 'kameez', 'dupatta', 'dress', 'hoodie', 'jeans', 'sneakers', 'shawl', 'shirt', 'pants'];
        const clothing = [];
        for (const part of parts) {
            if (keywords.some(kw => part.toLowerCase().includes(kw))) {
                clothing.push(part.trim());
            }
        }
        return clothing.length > 0 ? clothing.join(', ') : null;
    },

    extractAccessories(parts) {
        const pattern = /(scarf|shawl|jewelry|watch|glasses|bracelet|necklace|earrings)/i;
        const acc = [];
        for (const part of parts) {
            const m = part.match(pattern);
            if (m) acc.push(part.trim());
        }
        return acc.length > 0 ? acc.join(', ') : null;
    },

    extractPersonalityTraits(parts) {
        const pattern = /(calm|thoughtful|confident|bold|gentle|graceful|humorous|cheerful|carefree|playful|energetic|protective|serious)\s+(personality|nature|attitude|posture)?/i;
        const traits = [];
        for (const part of parts) {
            if (part.match(pattern)) {
                traits.push(part.trim());
            }
        }
        return traits;
    },

    extractDemeanor(parts) {
        const pattern = /(calm|confident|graceful|carefree|gentle)\s+(posture|demeanor)/i;
        for (const part of parts) {
            const m = part.match(pattern);
            if (m) return part.trim();
        }
        return null;
    },

    extractAttitude(parts) {
        const pattern = /(thoughtful|playful|carefree|protective|confident)\s+attitude/i;
        for (const part of parts) {
            const m = part.match(pattern);
            if (m) return part.trim();
        }
        return null;
    },

    countMentions(script, name) {
        const re = new RegExp(`\\b${name}\\b`, 'gi');
        const matches = script.match(re);
        return matches ? matches.length : 0;
    },

    hasDialogue(script, name) {
        const patterns = [
            new RegExp(`${name}\\s+(said|asked|replied|answered|spoke)`, 'i'),
            new RegExp(`"[^"]*"\\s+${name}`, 'i')
        ];
        return patterns.some(p => p.test(script));
    },

    /**
     * Generate content string from character attributes
     */
    generateContentString(char) {
        const parts = [];

        if (char.gender) parts.push(char.gender);
        if (char.age) parts.push(`${char.age} years old`);
        if (char.nationality) parts.push(char.nationality);
        if (char.skinTone) parts.push(char.skinTone);
        if (char.faceShape) parts.push(`${char.faceShape} face`);
        if (char.height) parts.push(char.height);
        if (char.bodyBuild) parts.push(char.bodyBuild);
        if (char.hairStyle) parts.push(char.hairStyle);
        if (char.facialHair) parts.push(char.facialHair);
        if (char.eyeDescription) parts.push(char.eyeDescription);
        if (char.facialFeatures) parts.push(char.facialFeatures);
        if (char.clothing) parts.push(char.clothing);
        if (char.personalityTraits && char.personalityTraits.length > 0) {
            parts.push(...char.personalityTraits);
        }
        if (char.demeanor) parts.push(char.demeanor);

        // Add defaults for image generation
        parts.push('realistic facial features');
        parts.push('natural skin texture');
        parts.push('detailed eyes');
        parts.push('proportional body');
        parts.push('cinematic lighting');
        parts.push('professional photography');
        parts.push('high detail');
        parts.push('8k resolution');
        parts.push('photorealistic rendering');

        return parts.join(', ');
    },

    /**
     * Extract relationships between characters
     */
    extractRelationships(script, characters) {
        // Best friends
        if (script.includes('best friend')) {
            const pattern = /([A-Z][a-z]+)(?:\s*,\s*([A-Z][a-z]+))?(?:\s*,?\s*(?:and|&)\s+([A-Z][a-z]+))?\s+(?:had been|were|are)\s+best friends/i;
            const m = script.match(pattern);
            if (m) {
                const names = [m[1], m[2], m[3]].filter(Boolean);
                for (const n1 of names) {
                    for (const n2 of names) {
                        if (n1 === n2) continue;
                        const c1 = characters.find(c => c.name === n1);
                        const c2 = characters.find(c => c.name === n2);
                        if (c1 && c2) {
                            if (!c1.relationships) c1.relationships = {};
                            c1.relationships[c2.name] = 'best friend';
                        }
                    }
                }
            }
        }

        // Cousin
        const cousinPattern = /(?:introduced|brought)\s+(?:his|her)\s+cousin\s+([A-Z][a-z]+)/i;
        const cm = script.match(cousinPattern);
        if (cm) {
            const cousinName = cm[1];
            for (const char of characters) {
                if (char.name !== cousinName) {
                    if (!char.relationships) char.relationships = {};
                    char.relationships[cousinName] = 'cousin';
                    const cousin = characters.find(c => c.name === cousinName);
                    if (cousin) {
                        if (!cousin.relationships) cousin.relationships = {};
                        cousin.relationships[char.name] = 'cousin';
                    }
                }
            }
        }

        // Group/friends
        if (script.match(/group|circle|friends/i)) {
            for (let i = 0; i < characters.length; i++) {
                for (let j = i + 1; j < characters.length; j++) {
                    const c1 = characters[i];
                    const c2 = characters[j];
                    if (!c1.relationships) c1.relationships = {};
                    if (!c2.relationships) c2.relationships = {};
                    if (!c1.relationships[c2.name]) {
                        c1.relationships[c2.name] = 'friend';
                        c2.relationships[c1.name] = 'friend';
                    }
                }
            }
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedCharacterAnalyzer;
}
