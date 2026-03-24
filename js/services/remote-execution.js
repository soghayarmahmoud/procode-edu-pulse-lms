// ============================================
// ProCode EduPulse — Remote Code Execution Engine
// ============================================

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

export class RemoteExecutionService {
    /**
     * Executes code remotely using the Piston API.
     * @param {string} language - The programming language (e.g. 'python', 'javascript')
     * @param {string} userCode - The student's code
     * @param {string} testCode - Optional hidden test code to run against the user's code
     * @returns {Promise<{pass: boolean, feedback: string}>}
     */
    static async execute(language, userCode, testCode = null) {
        // Map common frontend languages to backend equivalents if needed,
        // though typically this is called for python/node.js.
        const langAlias = this._mapLanguage(language);
        let content = userCode;

        if (testCode) {
            // Combine user code and test code appropriately based on language
            content = this._combineCode(language, userCode, testCode);
        }

        const payload = {
            language: langAlias.language,
            version: langAlias.version,
            files: [
                {
                    name: `main.${langAlias.extension}`,
                    content: content
                }
            ]
        };

        try {
            const response = await fetch(PISTON_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Execution API Error: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.compile && data.compile.code !== 0) {
                return {
                    pass: false,
                    feedback: `Compilation Error:\n${data.compile.output}`
                };
            }

            const output = data.run.output;
            const code = data.run.code; // exit code

            // If testCode is provided, we assume it prints "TESTS_PASSED" or exits with 0 on success.
            if (testCode) {
                if (code === 0 && output.includes('TESTS_PASSED')) {
                    return { pass: true, feedback: '🎉 All hidden test cases passed!\n\nOutput:\n' + output.replace('TESTS_PASSED', '').trim() };
                } else {
                    return { pass: false, feedback: `❌ Some tests failed.\n\nOutput:\n${output}` };
                }
            } else {
                // Just running code without specific tests - pass if no crash.
                return { 
                    pass: code === 0, 
                    feedback: code === 0 ? `Code executed successfully.\n\nOutput:\n${output}` : `Execution Failed (Exit ${code}).\n\nOutput:\n${output}` 
                };
            }
        } catch (error) {
            return {
                pass: false,
                feedback: `Network or Server Error: ${error.message}`
            };
        }
    }

    static _mapLanguage(lang) {
        const map = {
            'python': { language: 'python', version: '3.10.0', extension: 'py' },
            'javascript': { language: 'javascript', version: '18.15.0', extension: 'js' },
            'node': { language: 'javascript', version: '18.15.0', extension: 'js' },
            'c++': { language: 'c++', version: '10.2.0', extension: 'cpp' },
            'java': { language: 'java', version: '15.0.2', extension: 'java' }
        };
        // Fallback to python
        return map[lang.toLowerCase()] || map['python'];
    }

    static _combineCode(lang, userCode, testCode) {
        lang = lang.toLowerCase();
        if (lang === 'python') {
            return `${userCode}\n\n# --- HIDDEN UNIT TESTS ---\n${testCode}`;
        } else if (lang === 'javascript' || lang === 'node') {
            return `${userCode}\n\n// --- HIDDEN UNIT TESTS ---\n${testCode}`;
        }
        return `${userCode}\n${testCode}`;
    }
}
