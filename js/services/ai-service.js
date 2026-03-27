// ============================================
// ProCode EduPulse — AI Hint Service
// ============================================

const DEFAULT_SYSTEM_PROMPT = `You are a friendly coding tutor for beginners learning HTML, CSS, and JavaScript. 
When a student asks for a hint:
- Give helpful guidance, NOT the direct answer
- Point them in the right direction with explanations
- Reference relevant concepts they should apply
- Use encouraging language
- Keep responses concise (2-4 sentences max)
- Use code snippets only to illustrate concepts, never the full solution`;

/**
 * AI hint generation service.
 */
class AIService {
    /**
     * Create an AIService instance.
     */
    constructor() {
        this.apiKey = '';
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        this.systemPrompt = DEFAULT_SYSTEM_PROMPT;
    }

    /**
     * Configure AI service settings.
     * @param {{apiKey?: string, apiUrl?: string, systemPrompt?: string}} options
     * @returns {void}
     */
    configure({ apiKey, apiUrl, systemPrompt }) {
        if (apiKey) this.apiKey = apiKey;
        if (apiUrl) this.apiUrl = apiUrl;
        if (systemPrompt) this.systemPrompt = systemPrompt;
    }

    /**
     * Check if API key is configured.
     * @returns {boolean}
     */
    isConfigured() {
        return !!this.apiKey;
    }

    /**
     * Get a hint for a coding challenge.
     * @param {Object} params
     * @param {string} params.challengeTitle - Title of the challenge
     * @param {string} params.instructions - Challenge instructions
     * @param {string} params.studentCode - Student's current code
     * @param {string} params.language - Language (html, css, js)
     * @returns {Promise<string>} The hint text
     */
    async getHint({ challengeTitle, instructions, studentCode, language = 'html' }) {
        if (!this.isConfigured()) {
            return this._getFallbackHint(instructions, studentCode);
        }

        const prompt = `Challenge: "${challengeTitle}"
Instructions: ${instructions}

The student's current code:
\`\`\`${language}
${studentCode || '(empty - student hasn\'t written anything yet)'}
\`\`\`

Please provide a helpful hint to guide them.`;

        try {
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: this.systemPrompt }]
                    },
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 256
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not generate a hint. Try re-reading the instructions carefully.';
        } catch (error) {
            console.error('AI Hint error:', error);
            return this._getFallbackHint(instructions, studentCode);
        }
    }

    /**
     * Provides a basic fallback hint when AI is not available.
     */
    /**
     * Provides a basic fallback hint when AI is not available.
     * @param {string} instructions
     * @param {string} studentCode
     * @returns {string}
     */
    _getFallbackHint(instructions, studentCode) {
        const hints = [
            '💡 Start by reading the instructions carefully. Break down each requirement into small steps.',
            '💡 Check your HTML structure — make sure all opening tags have matching closing tags.',
            '💡 Try writing the basic structure first, then add details one at a time.',
            '💡 Look at the element names mentioned in the instructions. Those are clues about which HTML tags to use!',
            '💡 Remember: HTML elements are nested inside each other like boxes within boxes.',
            '💡 If you\'re stuck on CSS, think about which property controls what you\'re trying to change (color, size, spacing, etc.).'
        ];

        if (!studentCode || studentCode.trim().length < 10) {
            return '💡 It looks like you haven\'t written much yet. Start with the basic HTML structure: `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`. Then read each instruction one at a time and add elements as needed.';
        }

        return hints[Math.floor(Math.random() * hints.length)];
    }
}

export const aiService = new AIService();
