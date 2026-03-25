// ============================================
// ProCode EduPulse — Code Validation Engine
// ============================================

/**
 * Code validation engine for challenges.
 */
export class ValidationEngine {
    /**
     * Validate student code against a set of rules.
     * @param {string} code - Student's HTML/CSS/JS code
     * @param {Array} rules - Array of validation rules
     * @returns {{ pass: boolean, feedback: string, details: Array }}
     */
    static validate(code, rules) {
        const results = [];

        for (const rule of rules) {
            let result;
            switch (rule.type) {
                case 'dom-query':
                    result = this._validateDOMQuery(code, rule);
                    break;
                case 'dom-count':
                    result = this._validateDOMCount(code, rule);
                    break;
                case 'text-contains':
                    result = this._validateTextContains(code, rule);
                    break;
                case 'regex':
                    result = this._validateRegex(code, rule);
                    break;
                case 'css-property':
                    result = this._validateCSSProperty(code, rule);
                    break;
                case 'attribute':
                    result = this._validateAttribute(code, rule);
                    break;
                default:
                    result = { pass: false, message: `Unknown rule type: ${rule.type}` };
            }
            results.push(result);
        }

        const allPass = results.every(r => r.pass);
        const failures = results.filter(r => !r.pass);

        return {
            pass: allPass,
            feedback: allPass
                ? '🎉 All checks passed! Great work!'
                : `❌ ${failures.length} check(s) failed:\n${failures.map(f => `• ${f.message}`).join('\n')}`,
            details: results
        };
    }

    /**
     * DOM Query validation — checks if a selector exists in the code.
     * @param {string} code
     * @param {object} rule
     * @returns {{pass: boolean, message: string}}
     */
    static _validateDOMQuery(code, rule) {
        try {
            const doc = this._parseHTML(code);
            const elements = doc.querySelectorAll(rule.selector);
            const pass = elements.length > 0;
            return {
                pass,
                message: pass
                    ? `✓ Found "${rule.selector}"`
                    : rule.errorMessage || `Expected to find element matching "${rule.selector}"`
            };
        } catch (e) {
            return { pass: false, message: `Error parsing code: ${e.message}` };
        }
    }

    /**
     * DOM Count validation — checks the count of elements matching a selector.
     * @param {string} code
     * @param {{selector: string, count: number, errorMessage?: string}} rule
     * @returns {{pass: boolean, message: string}}
     */
    static _validateDOMCount(code, rule) {
        try {
            const doc = this._parseHTML(code);
            const elements = doc.querySelectorAll(rule.selector);
            const pass = elements.length === rule.count;
            return {
                pass,
                message: pass
                    ? `✓ Found ${rule.count} "${rule.selector}" element(s)`
                    : rule.errorMessage || `Expected ${rule.count} element(s) matching "${rule.selector}", found ${elements.length}`
            };
        } catch (e) {
            return { pass: false, message: `Error parsing code: ${e.message}` };
        }
    }

    /**
     * Text Contains validation — checks if code contains specific text.
     * @param {string} code
     * @param {{text: string, errorMessage?: string}} rule
     * @returns {{pass: boolean, message: string}}
     */
    static _validateTextContains(code, rule) {
        const normalizedCode = code.toLowerCase().replace(/\s+/g, ' ');
        const searchText = rule.text.toLowerCase();
        const pass = normalizedCode.includes(searchText);
        return {
            pass,
            message: pass
                ? `✓ Code contains "${rule.text}"`
                : rule.errorMessage || `Expected code to contain "${rule.text}"`
        };
    }

    /**
     * Regex validation — checks if code matches a regex pattern.
     * @param {string} code
     * @param {{pattern: string, flags?: string, errorMessage?: string}} rule
     * @returns {{pass: boolean, message: string}}
     */
    static _validateRegex(code, rule) {
        try {
            const regex = new RegExp(rule.pattern, rule.flags || 'i');
            const pass = regex.test(code);
            return {
                pass,
                message: pass
                    ? `✓ Code matches pattern`
                    : rule.errorMessage || `Code does not match the expected pattern`
            };
        } catch (e) {
            return { pass: false, message: `Invalid regex: ${e.message}` };
        }
    }

    /**
     * CSS Property validation — checks if specific CSS property is set.
     * @param {string} code
     * @param {{property: string, value: string, errorMessage?: string}} rule
     * @returns {{pass: boolean, message: string}}
     */
    static _validateCSSProperty(code, rule) {
        const pattern = new RegExp(
            `${rule.property}\\s*:\\s*${rule.value}`,
            'i'
        );
        const pass = pattern.test(code);
        return {
            pass,
            message: pass
                ? `✓ CSS property "${rule.property}: ${rule.value}" found`
                : rule.errorMessage || `Expected CSS: "${rule.property}: ${rule.value}"`
        };
    }

    /**
     * Attribute validation — checks element has specific attribute.
     * @param {string} code
     * @param {{selector: string, attribute: string, value?: string, errorMessage?: string}} rule
     * @returns {{pass: boolean, message: string}}
     */
    static _validateAttribute(code, rule) {
        try {
            const doc = this._parseHTML(code);
            const el = doc.querySelector(rule.selector);
            if (!el) {
                return {
                    pass: false,
                    message: rule.errorMessage || `Element "${rule.selector}" not found`
                };
            }

            const attrValue = el.getAttribute(rule.attribute);
            let pass;

            if (rule.value !== undefined) {
                pass = attrValue === rule.value;
            } else {
                pass = el.hasAttribute(rule.attribute);
            }

            return {
                pass,
                message: pass
                    ? `✓ Element has attribute "${rule.attribute}"`
                    : rule.errorMessage || `Expected "${rule.selector}" to have attribute "${rule.attribute}"${rule.value !== undefined ? ` with value "${rule.value}"` : ''}`
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    }

    /**
     * Parse HTML string into a document for DOM queries.
     * @param {string} code
     * @returns {Document}
     */
    static _parseHTML(code) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(code, 'text/html');
        return doc;
    }
}
