import {setGlobalOptions} from "firebase-functions/v2";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import express, {Request, Response, NextFunction} from "express";
import * as admin from "firebase-admin";

setGlobalOptions({maxInstances: 10});

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();
const app = express();
app.use(express.json());

const SUPER_ADMIN_EMAILS = new Set([
	"mahmoudsruby@gmail.com",
	"mahmoudabdelrauf84@gmail.com",
]);

type AuthedRequest = Request & {
	user?: admin.auth.DecodedIdToken;
};

async function requireSuperAdmin(
	req: AuthedRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const authHeader = req.headers.authorization || "";
		const match = authHeader.match(/^Bearer\s+(.+)$/i);
		if (!match) {
			res.status(401).json({error: "Missing bearer token"});
			return;
		}

		const decoded = await admin.auth().verifyIdToken(match[1]);
		req.user = decoded;

		const email = String(decoded.email || "").toLowerCase();
		if (!SUPER_ADMIN_EMAILS.has(email)) {
			res.status(403).json({error: "Super admin access required"});
			return;
		}

		next();
	} catch (error) {
		logger.error("Auth verification failed", error as Error);
		res.status(401).json({error: "Invalid or expired token"});
	}
}

app.get("/health", (_req, res) => {
	res.json({ok: true, service: "admin-backend", timestamp: Date.now()});
});

app.get("/admin/health", requireSuperAdmin, (req: AuthedRequest, res) => {
	res.json({
		ok: true,
		role: "super-admin",
		email: req.user?.email || null,
	});
});

app.post("/admin/users/:uid/role", requireSuperAdmin, async (req, res) => {
	const uid = req.params.uid;
	const role = String(req.body?.role || "").toLowerCase();

	if (!uid || !["student", "instructor", "admin"].includes(role)) {
		res.status(400).json({error: "Invalid uid or role"});
		return;
	}

	const updates: Record<string, unknown> = {
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	};

	if (role === "student") {
		updates.isAdmin = false;
		updates.isInstructor = false;
	}
	if (role === "instructor") {
		updates.isInstructor = true;
	}
	if (role === "admin") {
		updates.isAdmin = true;
	}

	await db.collection("users").doc(uid).set(updates, {merge: true});
	res.json({ok: true, uid, role});
});

app.post("/admin/users/:uid/status", requireSuperAdmin, async (req, res) => {
	const uid = req.params.uid;
	const status = String(req.body?.status || "").toLowerCase();
	const reason = String(req.body?.reason || "");
	const days = Number(req.body?.days || 7);

	if (!uid || !["active", "suspended", "banned"].includes(status)) {
		res.status(400).json({error: "Invalid uid or status"});
		return;
	}

	const updates: Record<string, unknown> = {
		status,
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	};

	if (status === "suspended") {
		const until = new Date();
		until.setDate(until.getDate() + Math.max(1, days));
		updates.suspendedUntil = until.toISOString();
		updates.suspensionReason = reason;
	}

	if (status === "banned") {
		updates.bannedReason = reason;
		updates.bannedAt = admin.firestore.FieldValue.serverTimestamp();
	}

	if (status === "active") {
		updates.suspendedUntil = null;
		updates.bannedAt = null;
		updates.suspensionReason = null;
		updates.bannedReason = null;
	}

	await db.collection("users").doc(uid).set(updates, {merge: true});
	res.json({ok: true, uid, status});
});

app.post("/admin/settings", requireSuperAdmin, async (req, res) => {
	const payload = req.body || {};
	if (typeof payload !== "object" || Array.isArray(payload)) {
		res.status(400).json({error: "Invalid settings payload"});
		return;
	}

	await db.collection("system").doc("settings").set(
		{
			...payload,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{merge: true},
	);

	res.json({ok: true});
});

export const api = onRequest({cors: true}, app);
