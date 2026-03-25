// ============================================
// ProCode EduPulse — Code Editor (CodeMirror 6)
// ============================================

let editorView = null;

/**
 * CodeMirror-backed editor component with fallback.
 */
export class CodeEditor {
    /**
     * Create a CodeEditor instance.
     * @param {string|Element} container
     * @param {{language?: string, initialCode?: string, onChange?: Function|null, readOnly?: boolean}} [options={}]
     */
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            language: options.language || 'html',
            initialCode: options.initialCode || '',
            onChange: options.onChange || null,
            readOnly: options.readOnly || false,
            ...options
        };
        this.view = null;
        this._init();
    }

    /**
     * Initialize CodeMirror editor.
     * @returns {Promise<void>}
     */
    async _init() {
        // Use CodeMirror 6 via CDN
        try {
            const stateVer = '6.2.1';
            const viewVer = '6.16.0';
            const deps = `?deps=@codemirror/state@${stateVer},@codemirror/view@${viewVer}`;

            const { EditorView, ViewPlugin } = await import(`https://esm.sh/@codemirror/view@${viewVer}`);
            const { EditorState } = await import(`https://esm.sh/@codemirror/state@${stateVer}`);
            const { basicSetup } = await import(`https://esm.sh/@codemirror/basic-setup${deps}`);
            const { html } = await import(`https://esm.sh/@codemirror/lang-html@6.4.5${deps}`);
            const { css } = await import(`https://esm.sh/@codemirror/lang-css@6.2.1${deps}`);
            const { javascript } = await import(`https://esm.sh/@codemirror/lang-javascript@6.1.9${deps}`);
            const { python } = await import(`https://esm.sh/@codemirror/lang-python@6.1.3${deps}`);
            const { java } = await import(`https://esm.sh/@codemirror/lang-java@6.0.1${deps}`);
            const { cpp } = await import(`https://esm.sh/@codemirror/lang-cpp@6.0.2${deps}`);
            const { php } = await import(`https://esm.sh/@codemirror/lang-php@6.0.1${deps}`);
            const { rust } = await import(`https://esm.sh/@codemirror/lang-rust@6.0.1${deps}`);
            const { sql } = await import(`https://esm.sh/@codemirror/lang-sql@6.5.4${deps}`);
            const { oneDark } = await import(`https://esm.sh/@codemirror/theme-one-dark@6.1.2${deps}`);

            const langMap = { 
                html, 
                css, 
                javascript, js: javascript,
                python, py: python,
                java,
                cpp, 'c++': cpp,
                php,
                rust, rs: rust,
                sql
            };
            const langExt = langMap[this.options.language.toLowerCase()] || html;

            const extensions = [
                basicSetup,
                langExt(),
                oneDark,
                EditorView.lineWrapping,
            ];

            if (this.options.onChange) {
                const onChangeFn = this.options.onChange;
                extensions.push(
                    ViewPlugin.fromClass(class {
                        constructor(view) { this.view = view; }
                        update(update) {
                            if (update.docChanged) {
                                onChangeFn(update.state.doc.toString());
                            }
                        }
                    })
                );
            }

            if (this.options.readOnly) {
                extensions.push(EditorState.readOnly.of(true));
            }

            this.view = new EditorView({
                state: EditorState.create({
                    doc: this.options.initialCode,
                    extensions
                }),
                parent: this.container
            });

            editorView = this.view;

            // Set up change listener via a simpler approach
            if (this.options.onChange) {
                let lastContent = this.options.initialCode;
                setInterval(() => {
                    if (this.view) {
                        const current = this.view.state.doc.toString();
                        if (current !== lastContent) {
                            lastContent = current;
                            this.options.onChange(current);
                        }
                    }
                }, 500);
            }

        } catch (error) {
            console.warn('CodeMirror failed to load, using fallback textarea:', error);
            this._createFallback();
        }
    }

    /**
     * Create fallback textarea editor.
     * @returns {void}
     */
    _createFallback() {
        const textarea = document.createElement('textarea');
        textarea.className = 'editor-fallback';
        textarea.value = this.options.initialCode;
        textarea.spellcheck = false;
        textarea.style.cssText = `
      width: 100%;
      height: 100%;
      min-height: 300px;
      background: #1e1e2e;
      color: #cdd6f4;
      border: none;
      padding: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      line-height: 1.6;
      resize: none;
      outline: none;
      tab-size: 2;
    `;

        if (this.options.onChange) {
            textarea.addEventListener('input', () => {
                this.options.onChange(textarea.value);
            });
        }

        // Handle tab key
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 2;
                if (this.options.onChange) this.options.onChange(textarea.value);
            }
        });

        this.container.appendChild(textarea);
        this._fallbackTextarea = textarea;
    }

    /**
     * Get current editor code.
     * @returns {string}
     */
    getCode() {
        if (this.view) {
            return this.view.state.doc.toString();
        }
        if (this._fallbackTextarea) {
            return this._fallbackTextarea.value;
        }
        return '';
    }

    /**
     * Set editor code.
     * @param {string} code
     * @returns {void}
     */
    setCode(code) {
        if (this.view) {
            this.view.dispatch({
                changes: {
                    from: 0,
                    to: this.view.state.doc.length,
                    insert: code
                }
            });
        }
        if (this._fallbackTextarea) {
            this._fallbackTextarea.value = code;
        }
    }

    /**
     * Destroy the editor.
     * @returns {void}
     */
    destroy() {
        if (this.view) {
            this.view.destroy();
            this.view = null;
        }
        editorView = null;
    }
}

/**
 * Update the live preview iframe with the given code.
 * @param {string|HTMLIFrameElement} iframeSelector
 * @param {string} code
 * @returns {void}
 */
export function updatePreview(iframeSelector, code) {
    const iframe = typeof iframeSelector === 'string'
        ? document.querySelector(iframeSelector)
        : iframeSelector;

    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(code);
    doc.close();
}
