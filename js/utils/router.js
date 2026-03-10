// ============================================
// ProCode EduPulse — Client-Side Hash Router
// ============================================

export class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.beforeHooks = [];
        this.afterHooks = [];

        window.addEventListener('hashchange', () => this._handleRoute());
        window.addEventListener('load', () => this._handleRoute());
    }

    on(path, handler) {
        this.routes[path] = handler;
        return this;
    }

    before(hook) {
        this.beforeHooks.push(hook);
        return this;
    }

    after(hook) {
        this.afterHooks.push(hook);
        return this;
    }

    navigate(path) {
        window.location.hash = path;
    }

    _parseHash() {
        const hash = window.location.hash.slice(1) || '/';
        return hash;
    }

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

    getCurrentParams() {
        const path = this._parseHash();
        const match = this._matchRoute(path);
        return match ? match.params : {};
    }
}
