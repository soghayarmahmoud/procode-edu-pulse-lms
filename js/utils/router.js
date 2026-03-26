// ============================================
// ProCode EduPulse — Client-Side Hash Router
// ============================================

/**
 * Simple hash-based router.
 */
export class Router {
    /**
     * Create a new Router instance.
     */
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.beforeHooks = [];
        this.afterHooks = [];

        // Listen for future hash changes
        window.addEventListener('hashchange', () => this._handleRoute());
    }

    /**
     * Manually trigger initial route resolution.
     * Should be called after all routes and hooks are defined.
     */
    /**
     * Resolve the current route.
     * @returns {Promise<void>}
     */
    async resolve() {
        await this._handleRoute();
    }

    /**
     * Register a route handler.
     * @param {string} path
     * @param {Function} handler
     * @returns {Router}
     */
    on(path, handler) {
        this.routes[path] = handler;
        return this;
    }

    /**
     * Register a before hook.
     * @param {Function} hook
     * @returns {Router}
     */
    before(hook) {
        this.beforeHooks.push(hook);
        return this;
    }

    /**
     * Register an after hook.
     * @param {Function} hook
     * @returns {Router}
     */
    after(hook) {
        this.afterHooks.push(hook);
        return this;
    }

    /**
     * Navigate to a path.
     * @param {string} path
     * @returns {void}
     */
    navigate(path) {
        window.location.hash = path;
    }

    /**
     * Parse current hash path.
     * @returns {string}
     */
    _parseHash() {
        const hash = window.location.hash.slice(1) || '/';
        return hash;
    }

    /**
     * Match a path to a route.
     * @param {string} path
     * @returns {{handler: Function, params: object}|null}
     */
    _matchRoute(path) {
        // Try exact match first
        if (this.routes[path]) {
            return { handler: this.routes[path], params: {} };
        }

        // Try parameterized routes
        for (const [pattern, handler] of Object.entries(this.routes)) {
            const paramNames = [];
            const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
                paramNames.push(name);
                return '([^/]+)';
            });

            const regex = new RegExp(`^${regexStr}$`);
            const match = path.match(regex);

            if (match) {
                const params = {};
                paramNames.forEach((name, i) => {
                    params[name] = decodeURIComponent(match[i + 1]);
                });
                return { handler, params };
            }
        }

        return null;
    }

    /**
     * Resolve and render matched route.
     * @returns {Promise<void>}
     */
    async _handleRoute() {
        const path = this._parseHash();

        // Run before hooks
        for (const hook of this.beforeHooks) {
            const result = await hook(path, this.currentRoute);
            if (result === false) return;
        }

        const match = this._matchRoute(path);

        if (match) {
            this.currentRoute = path;
            await match.handler(match.params);
        } else if (this.routes['*']) {
            this.currentRoute = path;
            await this.routes['*']({ path });
        }

        // Run after hooks
        for (const hook of this.afterHooks) {
            await hook(path);
        }
    }

    /**
     * Get params for current route.
     * @returns {object}
     */
    getCurrentParams() {
        const path = this._parseHash();
        const match = this._matchRoute(path);
        return match ? match.params : {};
    }
}
