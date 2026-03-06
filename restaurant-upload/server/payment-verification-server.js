const http = require('http');
const fsSync = require('fs');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

function loadEnvFile() {
    const envFilePath = path.join(__dirname, '.env');

    try {
        const raw = fsSync.readFileSync(envFilePath, 'utf8');
        const lines = raw.split(/\r?\n/);

        for (const line of lines) {
            const trimmed = String(line || '').trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            const separatorIndex = trimmed.indexOf('=');
            if (separatorIndex <= 0) continue;

            const key = trimmed.slice(0, separatorIndex).trim();
            let value = trimmed.slice(separatorIndex + 1).trim();

            if (!key) continue;
            if (
                (value.startsWith('"') && value.endsWith('"'))
                || (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }

            if (process.env[key] === undefined) {
                process.env[key] = value;
            }
        }
    } catch (error) {
        if (error?.code !== 'ENOENT') {
            console.warn(`[CONFIG] Could not load ${envFilePath}: ${error.message || 'Unknown error'}`);
        }
    }
}

loadEnvFile();

const PORT = Number(process.env.PORT || 8787);
const HOST = String(process.env.HOST || '').trim();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const RESTAURANT_WHATSAPP_NUMBER = process.env.RESTAURANT_WHATSAPP_NUMBER || '';
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v20.0';
const ORDER_DB_FILE = path.join(__dirname, 'orders-db.json');
const USER_DB_FILE = path.join(__dirname, 'users-db.json');
const STATE_BACKEND = String(process.env.STATE_BACKEND || 'file').trim().toLowerCase();
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const SUPABASE_SCHEMA = String(process.env.SUPABASE_SCHEMA || 'public').trim();
const SUPABASE_STATE_TABLE = String(process.env.SUPABASE_STATE_TABLE || 'app_state').trim();
const RESTAURANT_DASHBOARD_TOKEN = process.env.RESTAURANT_DASHBOARD_TOKEN || 'dev-restaurant-token';
const RESTAURANT_PORTAL_URL = process.env.RESTAURANT_PORTAL_URL || '';
const RESTAURANT_INVITE_CODE = String(process.env.RESTAURANT_INVITE_CODE || '').trim();
const RESTAURANT_STAFF_EMAILS = String(process.env.RESTAURANT_STAFF_EMAILS || '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
const CONFIRMATION_TIMEOUT_MINUTES = Number(process.env.ORDER_CONFIRMATION_TIMEOUT_MINUTES || 10);
const PASSWORD_RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 15);
const PASSWORD_RESET_MAX_ATTEMPTS = Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS || 5);
const PASSWORD_RESET_EMAIL_PROVIDER = String(process.env.PASSWORD_RESET_EMAIL_PROVIDER || 'resend').trim().toLowerCase();
const PASSWORD_RESET_EMAIL_API_KEY = String(process.env.PASSWORD_RESET_EMAIL_API_KEY || '').trim();
const PASSWORD_RESET_EMAIL_FROM = String(process.env.PASSWORD_RESET_EMAIL_FROM || '').trim();
const PASSWORD_RESET_EMAIL_REPLY_TO = String(process.env.PASSWORD_RESET_EMAIL_REPLY_TO || '').trim();
const PASSWORD_RESET_EMAIL_SUBJECT = String(process.env.PASSWORD_RESET_EMAIL_SUBJECT || 'Your password reset code').trim();
const PASSWORD_RESET_EMAIL_BRAND = String(process.env.PASSWORD_RESET_EMAIL_BRAND || 'My Testing Restaurant').trim();
const DEV_MODE = process.env.NODE_ENV !== 'production';

const ORDER_STATUSES = {
    pending: 'pending_restaurant_confirmation',
    confirmed: 'confirmed',
    preparing: 'preparing',
    ready: 'ready_for_dispatch',
    outForDelivery: 'out_for_delivery',
    delivered: 'delivered',
    rejected: 'rejected',
    cancelled: 'cancelled'
};

const ORDER_STATUS_TRANSITIONS = {
    [ORDER_STATUSES.pending]: [ORDER_STATUSES.confirmed, ORDER_STATUSES.rejected, ORDER_STATUSES.cancelled],
    [ORDER_STATUSES.confirmed]: [ORDER_STATUSES.preparing, ORDER_STATUSES.cancelled],
    [ORDER_STATUSES.preparing]: [ORDER_STATUSES.ready, ORDER_STATUSES.cancelled],
    [ORDER_STATUSES.ready]: [ORDER_STATUSES.outForDelivery, ORDER_STATUSES.cancelled],
    [ORDER_STATUSES.outForDelivery]: [ORDER_STATUSES.delivered],
    [ORDER_STATUSES.delivered]: [],
    [ORDER_STATUSES.rejected]: [],
    [ORDER_STATUSES.cancelled]: []
};

let orderDbWriteQueue = Promise.resolve();
let userDbWriteQueue = Promise.resolve();

function isSupabaseStateBackend() {
    return STATE_BACKEND === 'supabase' || STATE_BACKEND === 'postgres' || STATE_BACKEND === 'postgrest';
}

function isSupabaseStateConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_STATE_TABLE);
}

function normalizeStatePayload(value, type) {
    if (type === 'orders') {
        return {
            version: Number(value?.version || 1),
            orders: Array.isArray(value?.orders) ? value.orders : []
        };
    }

    return {
        version: Number(value?.version || 1),
        users: Array.isArray(value?.users) ? value.users : []
    };
}

function getSupabaseRestUrl(pathSuffix = '') {
    const baseUrl = SUPABASE_URL.replace(/\/+$/, '');
    const normalizedSuffix = String(pathSuffix || '').replace(/^\/+/, '');
    if (!normalizedSuffix) {
        return `${baseUrl}/rest/v1`;
    }
    return `${baseUrl}/rest/v1/${normalizedSuffix}`;
}

function getSupabaseHeaders({ profileType = 'accept', prefer = '' } = {}) {
    const headers = {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
    };

    if (SUPABASE_SCHEMA) {
        if (profileType === 'content') {
            headers['Content-Profile'] = SUPABASE_SCHEMA;
        } else {
            headers['Accept-Profile'] = SUPABASE_SCHEMA;
        }
    }

    if (prefer) {
        headers.Prefer = prefer;
    }

    return headers;
}

async function parseJsonResponse(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

function buildSupabaseErrorMessage(defaultMessage, response, responseData) {
    const detail = responseData?.message || responseData?.details || responseData?.hint || responseData?.error || '';
    if (detail) {
        return `${defaultMessage}: ${detail}`;
    }
    return `${defaultMessage} (HTTP ${response.status})`;
}

async function readSupabaseState(stateKey) {
    const query = `select=value&key=eq.${encodeURIComponent(stateKey)}&limit=1`;
    const response = await fetch(`${getSupabaseRestUrl(SUPABASE_STATE_TABLE)}?${query}`, {
        method: 'GET',
        headers: getSupabaseHeaders({ profileType: 'accept' })
    });

    const responseData = await parseJsonResponse(response);
    if (!response.ok) {
        throw new Error(buildSupabaseErrorMessage('Failed to read state from Supabase', response, responseData));
    }

    if (!Array.isArray(responseData) || responseData.length === 0) {
        return undefined;
    }

    return responseData[0]?.value;
}

async function writeSupabaseState(stateKey, stateValue) {
    const response = await fetch(`${getSupabaseRestUrl(SUPABASE_STATE_TABLE)}?on_conflict=key`, {
        method: 'POST',
        headers: getSupabaseHeaders({
            profileType: 'content',
            prefer: 'resolution=merge-duplicates,return=minimal'
        }),
        body: JSON.stringify([
            {
                key: stateKey,
                value: stateValue
            }
        ])
    });

    const responseData = await parseJsonResponse(response);
    if (!response.ok) {
        throw new Error(buildSupabaseErrorMessage('Failed to write state to Supabase', response, responseData));
    }
}

function ensureSupabaseStateConfig() {
    if (!isSupabaseStateConfigured()) {
        throw new Error(
            'STATE_BACKEND is set to supabase but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.'
        );
    }
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Restaurant-Token'
    });
    res.end(JSON.stringify(payload));
}

function parseRoute(req) {
    const fullUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = fullUrl.pathname.replace(/\/+$/, '') || '/';
    return { fullUrl, pathname };
}

function getOrderIdFromPath(pathname) {
    const match = pathname.match(/^\/orders\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : '';
}

function getOrderStatusPathParams(pathname) {
    const match = pathname.match(/^\/orders\/([^/]+)\/status$/);
    if (!match) return null;
    return { orderId: decodeURIComponent(match[1]) };
}

function normalizeOrderStatus(value) {
    const status = String(value || '').trim().toLowerCase();
    if (status === 'pending') return ORDER_STATUSES.pending;
    if (status === 'ready') return ORDER_STATUSES.ready;
    if (status === 'out') return ORDER_STATUSES.outForDelivery;
    if (status === 'on_the_way') return ORDER_STATUSES.outForDelivery;
    if (Object.values(ORDER_STATUSES).includes(status)) return status;
    return '';
}

function isTerminalStatus(status) {
    return [ORDER_STATUSES.delivered, ORDER_STATUSES.rejected, ORDER_STATUSES.cancelled].includes(status);
}

function getAllowedNextStatuses(currentStatus) {
    return ORDER_STATUS_TRANSITIONS[currentStatus] || [];
}

function canTransitionStatus(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) return true;
    return getAllowedNextStatuses(currentStatus).includes(nextStatus);
}

function hasRestaurantAccess(req, urlObj) {
    const tokenFromHeader = String(req.headers['x-restaurant-token'] || '').trim();
    const tokenFromQuery = String(urlObj.searchParams.get('adminToken') || '').trim();
    const provided = tokenFromHeader || tokenFromQuery;
    return Boolean(RESTAURANT_DASHBOARD_TOKEN) && provided === RESTAURANT_DASHBOARD_TOKEN;
}

async function ensureOrderDbFile() {
    try {
        await fs.access(ORDER_DB_FILE);
    } catch {
        await fs.writeFile(
            ORDER_DB_FILE,
            JSON.stringify({ version: 1, orders: [] }, null, 2),
            'utf8'
        );
    }
}

async function readOrderDb() {
    if (isSupabaseStateBackend()) {
        ensureSupabaseStateConfig();
        const remoteValue = await readSupabaseState('orders');
        const normalized = normalizeStatePayload(remoteValue, 'orders');

        if (!remoteValue || typeof remoteValue !== 'object' || !Array.isArray(remoteValue.orders)) {
            await writeSupabaseState('orders', normalized);
        }

        return normalized;
    }

    await ensureOrderDbFile();
    const raw = await fs.readFile(ORDER_DB_FILE, 'utf8');

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.orders)) {
            return { version: 1, orders: [] };
        }
        return parsed;
    } catch {
        return { version: 1, orders: [] };
    }
}

async function writeOrderDb(data) {
    if (isSupabaseStateBackend()) {
        ensureSupabaseStateConfig();
        await writeSupabaseState('orders', normalizeStatePayload(data, 'orders'));
        return;
    }

    await fs.writeFile(ORDER_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function queueOrderDbWrite(task) {
    const operation = orderDbWriteQueue.then(task);
    orderDbWriteQueue = operation.then(() => undefined, () => undefined);
    return operation;
}

function queueUserDbWrite(task) {
    const operation = userDbWriteQueue.then(task);
    userDbWriteQueue = operation.then(() => undefined, () => undefined);
    return operation;
}

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function createPasswordHash(password, salt) {
    return crypto.scryptSync(String(password || ''), String(salt || ''), 64).toString('hex');
}

function buildPasswordRecord(password) {
    const passwordSalt = crypto.randomBytes(16).toString('hex');
    const passwordHash = createPasswordHash(password, passwordSalt);
    return { passwordSalt, passwordHash };
}

function verifyPassword(password, user) {
    if (!user?.passwordHash || !user?.passwordSalt) return false;

    const expected = Buffer.from(String(user.passwordHash), 'hex');
    const actual = Buffer.from(createPasswordHash(password, user.passwordSalt), 'hex');
    if (expected.length === 0 || actual.length === 0 || expected.length !== actual.length) {
        return false;
    }

    return crypto.timingSafeEqual(expected, actual);
}

async function ensureUserDbFile() {
    try {
        await fs.access(USER_DB_FILE);
    } catch {
        await fs.writeFile(
            USER_DB_FILE,
            JSON.stringify({ version: 1, users: [] }, null, 2),
            'utf8'
        );
    }
}

async function readUserDb() {
    if (isSupabaseStateBackend()) {
        ensureSupabaseStateConfig();
        const remoteValue = await readSupabaseState('users');
        const normalized = normalizeStatePayload(remoteValue, 'users');

        if (!remoteValue || typeof remoteValue !== 'object' || !Array.isArray(remoteValue.users)) {
            await writeSupabaseState('users', normalized);
        }

        return normalized;
    }

    await ensureUserDbFile();
    const raw = await fs.readFile(USER_DB_FILE, 'utf8');

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.users)) {
            return { version: 1, users: [] };
        }
        return parsed;
    } catch {
        return { version: 1, users: [] };
    }
}

async function writeUserDb(data) {
    if (isSupabaseStateBackend()) {
        ensureSupabaseStateConfig();
        await writeSupabaseState('users', normalizeStatePayload(data, 'users'));
        return;
    }

    await fs.writeFile(USER_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function toPublicUser(user) {
    return {
        id: String(user?.id || ''),
        name: String(user?.name || 'Customer'),
        email: normalizeEmail(user?.email),
        phone: String(user?.phone || ''),
        role: String(user?.role || 'customer'),
        isRestaurantStaff: user?.isRestaurantStaff === true,
        created: String(user?.created || ''),
        createdAt: String(user?.createdAt || ''),
        orders: Array.isArray(user?.orders) ? user.orders : [],
        addresses: Array.isArray(user?.addresses) ? user.addresses : [],
        preferences: {
            newsletter: Boolean(user?.preferences?.newsletter),
            promotions: Boolean(user?.preferences?.promotions)
        }
    };
}

function shouldGrantRestaurantStaff(email, providedRestaurantCode) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return false;

    if (RESTAURANT_STAFF_EMAILS.includes(normalizedEmail)) {
        return true;
    }

    const inviteCode = String(providedRestaurantCode || '').trim();
    if (!inviteCode) {
        return false;
    }

    if (!RESTAURANT_INVITE_CODE) {
        return false;
    }

    return inviteCode.toLowerCase() === RESTAURANT_INVITE_CODE.toLowerCase();
}

async function registerUser(payload) {
    const name = sanitizeText(payload.name, '').trim();
    const email = normalizeEmail(payload.email);
    const phone = String(payload.phone || '').trim();
    const password = String(payload.password || '');
    const restaurantCode = String(payload.restaurantCode || '').trim();

    if (!name || !email || !password) {
        return { ok: false, statusCode: 400, message: 'Name, email, and password are required.' };
    }

    if (password.length < 6) {
        return { ok: false, statusCode: 400, message: 'Password must be at least 6 characters.' };
    }

    if (restaurantCode && RESTAURANT_INVITE_CODE && restaurantCode.toLowerCase() !== RESTAURANT_INVITE_CODE.toLowerCase()) {
        return { ok: false, statusCode: 403, message: 'Invalid restaurant invite code.' };
    }

    if (restaurantCode && !RESTAURANT_INVITE_CODE) {
        return { ok: false, statusCode: 403, message: 'Restaurant staff invite code is not configured on the server.' };
    }

    return queueUserDbWrite(async () => {
        const db = await readUserDb();
        if (db.users.some(entry => normalizeEmail(entry.email) === email)) {
            return { ok: false, statusCode: 409, message: 'Email already registered.' };
        }

        const isRestaurantStaff = shouldGrantRestaurantStaff(email, restaurantCode);
        const now = new Date();
        const passwordRecord = buildPasswordRecord(password);
        const user = {
            id: `USR-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
            name,
            email,
            phone,
            passwordHash: passwordRecord.passwordHash,
            passwordSalt: passwordRecord.passwordSalt,
            passwordUpdatedAt: now.toISOString(),
            role: isRestaurantStaff ? 'restaurant' : 'customer',
            isRestaurantStaff,
            createdAt: now.toISOString(),
            created: now.toLocaleDateString(),
            orders: [],
            addresses: [],
            preferences: {
                newsletter: true,
                promotions: true
            },
            resetPassword: null
        };

        db.users.push(user);
        await writeUserDb(db);

        return {
            ok: true,
            statusCode: 201,
            message: 'Account created successfully.',
            user: toPublicUser(user)
        };
    });
}

async function loginUser(payload) {
    const email = normalizeEmail(payload.email);
    const password = String(payload.password || '');

    if (!email || !password) {
        return { ok: false, statusCode: 400, message: 'Email and password are required.' };
    }

    return queueUserDbWrite(async () => {
        const db = await readUserDb();
        const user = db.users.find(entry => normalizeEmail(entry.email) === email);
        if (!user || !verifyPassword(password, user)) {
            return { ok: false, statusCode: 401, message: 'Invalid email or password.' };
        }

        return {
            ok: true,
            statusCode: 200,
            message: 'Login successful.',
            user: toPublicUser(user)
        };
    });
}

async function updateUserProfile(payload) {
    const email = normalizeEmail(payload.email);
    const name = sanitizeText(payload.name, '').trim();
    const phone = String(payload.phone || '').trim();

    if (!email || !name) {
        return { ok: false, statusCode: 400, message: 'Email and name are required.' };
    }

    return queueUserDbWrite(async () => {
        const db = await readUserDb();
        const user = db.users.find(entry => normalizeEmail(entry.email) === email);
        if (!user) {
            return { ok: false, statusCode: 404, message: 'User account not found.' };
        }

        user.name = name;
        user.phone = phone;
        user.updatedAt = new Date().toISOString();

        await writeUserDb(db);

        return {
            ok: true,
            statusCode: 200,
            message: 'Profile updated successfully.',
            user: toPublicUser(user)
        };
    });
}

function buildResetCodeRecord(resetCode) {
    const codeSalt = crypto.randomBytes(12).toString('hex');
    return {
        codeSalt,
        codeHash: createPasswordHash(resetCode, codeSalt),
        requestedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (Math.max(1, PASSWORD_RESET_TTL_MINUTES) * 60 * 1000)).toISOString(),
        attempts: 0,
        consumedAt: ''
    };
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isPasswordResetEmailConfigured() {
    if (PASSWORD_RESET_EMAIL_PROVIDER === 'resend') {
        return Boolean(PASSWORD_RESET_EMAIL_API_KEY && PASSWORD_RESET_EMAIL_FROM);
    }

    return false;
}

function buildPasswordResetEmailContent(resetCode) {
    const expiresInMinutes = Math.max(1, PASSWORD_RESET_TTL_MINUTES);
    const safeBrand = escapeHtml(PASSWORD_RESET_EMAIL_BRAND);
    const safeCode = escapeHtml(resetCode);
    const subject = PASSWORD_RESET_EMAIL_SUBJECT || 'Your password reset code';
    const text = [
        `${PASSWORD_RESET_EMAIL_BRAND} password reset`,
        '',
        `Your reset code is: ${resetCode}`,
        `This code expires in ${expiresInMinutes} minutes.`,
        'If you did not request this, you can ignore this email.'
    ].join('\n');
    const html = [
        '<div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#111827">',
        `<p>Hello,</p>`,
        `<p>You requested a password reset for <strong>${safeBrand}</strong>.</p>`,
        `<p>Your reset code is <strong style="font-size:1.1rem;letter-spacing:0.06em">${safeCode}</strong>.</p>`,
        `<p>This code expires in <strong>${expiresInMinutes} minutes</strong>.</p>`,
        '<p>If you did not request this reset, you can ignore this email.</p>',
        '</div>'
    ].join('');

    return {
        subject,
        text,
        html
    };
}

async function sendPasswordResetEmail(email, resetCode) {
    const recipient = normalizeEmail(email);
    if (!recipient) {
        throw new Error('Missing recipient email for password reset.');
    }

    if (typeof fetch !== 'function') {
        throw new Error('Node runtime does not support fetch. Use Node.js 18 or newer.');
    }

    if (PASSWORD_RESET_EMAIL_PROVIDER !== 'resend') {
        throw new Error('Unsupported PASSWORD_RESET_EMAIL_PROVIDER. Use "resend".');
    }

    if (!PASSWORD_RESET_EMAIL_API_KEY || !PASSWORD_RESET_EMAIL_FROM) {
        throw new Error('Password reset email is not configured. Set PASSWORD_RESET_EMAIL_API_KEY and PASSWORD_RESET_EMAIL_FROM.');
    }

    const content = buildPasswordResetEmailContent(resetCode);
    const payload = {
        from: PASSWORD_RESET_EMAIL_FROM,
        to: [recipient],
        subject: content.subject,
        text: content.text,
        html: content.html
    };

    if (PASSWORD_RESET_EMAIL_REPLY_TO) {
        payload.reply_to = PASSWORD_RESET_EMAIL_REPLY_TO;
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PASSWORD_RESET_EMAIL_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    let data = {};
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        const providerMessage = data?.message || data?.error?.message || data?.error || '';
        throw new Error(String(providerMessage || `Resend API request failed (${response.status}).`));
    }

    return {
        provider: 'resend',
        messageId: String(data?.id || '')
    };
}

async function requestPasswordReset(payload) {
    const email = normalizeEmail(payload.email);
    if (!email) {
        return { ok: false, statusCode: 400, message: 'Email is required.' };
    }

    return queueUserDbWrite(async () => {
        const db = await readUserDb();
        const user = db.users.find(entry => normalizeEmail(entry.email) === email);
        const response = {
            ok: true,
            statusCode: 200,
            message: 'If an account exists for this email, a reset code has been sent.'
        };

        if (!user) {
            return response;
        }

        const resetCode = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
        user.resetPassword = buildResetCodeRecord(resetCode);
        await writeUserDb(db);

        try {
            const sentResult = await sendPasswordResetEmail(email, resetCode);
            response.emailSent = true;
            response.emailProvider = sentResult.provider;
            response.emailMessageId = sentResult.messageId;
        } catch (error) {
            if (DEV_MODE) {
                response.emailWarning = error.message || 'Reset email delivery failed.';
                console.warn(`[AUTH DEV] Password reset email failed for ${email}: ${response.emailWarning}`);
            } else {
                // In production, clear issued reset token when email dispatch fails.
                user.resetPassword = null;
                await writeUserDb(db);
                return {
                    ok: false,
                    statusCode: 500,
                    message: 'Unable to send reset email right now. Please try again shortly.'
                };
            }
        }

        if (DEV_MODE) {
            console.log(`[AUTH DEV] Password reset code for ${email}: ${resetCode}`);
            response.devResetCode = resetCode;
        }

        return response;
    });
}

async function resetPasswordWithCode(payload) {
    const email = normalizeEmail(payload.email);
    const resetCode = String(payload.code || '').trim();
    const newPassword = String(payload.newPassword || '');

    if (!email || !resetCode || !newPassword) {
        return { ok: false, statusCode: 400, message: 'Email, reset code, and new password are required.' };
    }

    if (newPassword.length < 6) {
        return { ok: false, statusCode: 400, message: 'Password must be at least 6 characters.' };
    }

    return queueUserDbWrite(async () => {
        const db = await readUserDb();
        const user = db.users.find(entry => normalizeEmail(entry.email) === email);
        if (!user || !user.resetPassword) {
            return { ok: false, statusCode: 400, message: 'Invalid or expired reset request.' };
        }

        const reset = user.resetPassword;
        const expiresAtMs = Date.parse(reset.expiresAt || '');
        if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs || reset.consumedAt) {
            user.resetPassword = null;
            await writeUserDb(db);
            return { ok: false, statusCode: 400, message: 'Invalid or expired reset request.' };
        }

        if (Number(reset.attempts || 0) >= Math.max(1, PASSWORD_RESET_MAX_ATTEMPTS)) {
            user.resetPassword = null;
            await writeUserDb(db);
            return { ok: false, statusCode: 429, message: 'Too many incorrect reset attempts. Request a new code.' };
        }

        const expected = Buffer.from(String(reset.codeHash || ''), 'hex');
        const actual = Buffer.from(createPasswordHash(resetCode, reset.codeSalt || ''), 'hex');
        const isMatch = expected.length > 0 && actual.length > 0 && expected.length === actual.length
            && crypto.timingSafeEqual(expected, actual);

        if (!isMatch) {
            reset.attempts = Number(reset.attempts || 0) + 1;
            await writeUserDb(db);
            return { ok: false, statusCode: 400, message: 'Invalid reset code.' };
        }

        const nextPassword = buildPasswordRecord(newPassword);
        user.passwordHash = nextPassword.passwordHash;
        user.passwordSalt = nextPassword.passwordSalt;
        user.passwordUpdatedAt = new Date().toISOString();
        user.resetPassword = null;
        await writeUserDb(db);

        return {
            ok: true,
            statusCode: 200,
            message: 'Password reset successful.'
        };
    });
}

function buildOrderStatusHistoryEntry(status, actor, note = '') {
    return {
        status,
        actor,
        note: String(note || '').trim(),
        at: new Date().toISOString()
    };
}

function autoCancelStalePendingOrder(order) {
    if (!order || order.status !== ORDER_STATUSES.pending) return false;

    const createdAtMs = Date.parse(order.createdAt || '');
    if (!Number.isFinite(createdAtMs)) return false;

    const timeoutMs = Math.max(1, CONFIRMATION_TIMEOUT_MINUTES) * 60 * 1000;
    if ((Date.now() - createdAtMs) < timeoutMs) return false;

    order.status = ORDER_STATUSES.cancelled;
    order.updatedAt = new Date().toISOString();
    order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    order.statusHistory.push(
        buildOrderStatusHistoryEntry(
            ORDER_STATUSES.cancelled,
            'system',
            `Auto-cancelled after ${Math.max(1, CONFIRMATION_TIMEOUT_MINUTES)} minutes without restaurant confirmation.`
        )
    );
    return true;
}

async function listOrders({ statusFilter } = {}) {
    return queueOrderDbWrite(async () => {
        const db = await readOrderDb();
        let hasMutations = false;

        db.orders.forEach(order => {
            if (autoCancelStalePendingOrder(order)) {
                hasMutations = true;
            }
        });

        if (hasMutations) {
            await writeOrderDb(db);
        }

        const normalizedFilter = normalizeOrderStatus(statusFilter);
        const orders = normalizedFilter
            ? db.orders.filter(order => order.status === normalizedFilter)
            : db.orders;

        return orders.sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''));
    });
}

async function findOrderById(orderId) {
    return queueOrderDbWrite(async () => {
        const db = await readOrderDb();
        const order = db.orders.find(entry => entry.id === orderId);
        if (!order) return null;

        if (autoCancelStalePendingOrder(order)) {
            await writeOrderDb(db);
        }

        return order;
    });
}

async function createOrderRecord(payload) {
    const nowIso = new Date().toISOString();
    const createdOrder = {
        id: String(payload.id || `ORD-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`),
        createdAt: nowIso,
        updatedAt: nowIso,
        customer: sanitizeText(payload.customer),
        email: sanitizeText(payload.email, ''),
        phone: sanitizeText(payload.phone),
        address: sanitizeText(payload.address),
        landmark: sanitizeText(payload.landmark, ''),
        district: sanitizeText(payload.district, ''),
        subDistrict: sanitizeText(payload.subDistrict || payload.subdistrict, ''),
        city: sanitizeText(payload.city),
        zip: sanitizeText(payload.zip, ''),
        items: Array.isArray(payload.items) ? payload.items : [],
        subtotal: Number(payload.subtotal || 0),
        tax: Number(payload.tax || 0),
        delivery: Number(payload.delivery || 0),
        total: Number(payload.total || 0),
        paymentMethod: sanitizeText(payload.paymentMethod, 'Unknown'),
        paymentReference: sanitizeText(payload.paymentReference, ''),
        paymentProvider: sanitizeText(payload.paymentProvider, ''),
        paymentVerifiedAt: sanitizeText(payload.paymentVerifiedAt, ''),
        transferReference: sanitizeText(payload.transferReference, ''),
        transferSender: sanitizeText(payload.transferSender, ''),
        instructions: sanitizeText(payload.instructions, ''),
        status: ORDER_STATUSES.pending,
        statusHistory: [
            buildOrderStatusHistoryEntry(ORDER_STATUSES.pending, 'customer', 'Order placed and waiting for restaurant confirmation.')
        ],
        restaurantNotified: null,
        restaurantNotificationError: '',
        restaurantMessageId: ''
    };

    if (!createdOrder.customer || !createdOrder.phone || !createdOrder.address || !createdOrder.district || !createdOrder.subDistrict || !createdOrder.city) {
        throw new Error('Missing required delivery fields.');
    }

    if (!Array.isArray(createdOrder.items) || createdOrder.items.length === 0) {
        throw new Error('Order items cannot be empty.');
    }

    if (createdOrder.total <= 0) {
        throw new Error('Order total must be greater than zero.');
    }

    const savedOrder = await queueOrderDbWrite(async () => {
        const db = await readOrderDb();
        db.orders.unshift(createdOrder);
        await writeOrderDb(db);
        return createdOrder;
    });

    return savedOrder;
}

async function updateOrderStatus(orderId, nextStatus, actor, note = '') {
    const normalizedNext = normalizeOrderStatus(nextStatus);
    if (!normalizedNext) {
        return { ok: false, statusCode: 400, message: 'Invalid order status value.' };
    }

    return queueOrderDbWrite(async () => {
        const db = await readOrderDb();
        const order = db.orders.find(entry => entry.id === orderId);
        if (!order) {
            return { ok: false, statusCode: 404, message: 'Order not found.' };
        }

        autoCancelStalePendingOrder(order);

        if (!canTransitionStatus(order.status, normalizedNext)) {
            return {
                ok: false,
                statusCode: 400,
                message: `Cannot move order from ${order.status} to ${normalizedNext}.`,
                allowedStatuses: getAllowedNextStatuses(order.status)
            };
        }

        if (order.status !== normalizedNext) {
            order.status = normalizedNext;
            order.updatedAt = new Date().toISOString();
            order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
            order.statusHistory.push(buildOrderStatusHistoryEntry(normalizedNext, actor, note));
            await writeOrderDb(db);
        }

        return {
            ok: true,
            statusCode: 200,
            message: 'Order status updated.',
            order
        };
    });
}

async function updateOrderRestaurantNotification(orderId, notificationResult, error) {
    return queueOrderDbWrite(async () => {
        const db = await readOrderDb();
        const order = db.orders.find(entry => entry.id === orderId);
        if (!order) return null;

        if (error) {
            order.restaurantNotified = false;
            order.restaurantNotificationError = String(error.message || 'Notification failed.');
            order.restaurantMessageId = '';
        } else {
            order.restaurantNotified = true;
            order.restaurantNotificationError = '';
            order.restaurantMessageId = notificationResult?.messageId || '';
        }

        order.updatedAt = new Date().toISOString();
        await writeOrderDb(db);
        return order;
    });
}

function getRestaurantDashboardHint(orderId) {
    if (!RESTAURANT_PORTAL_URL) {
        return 'Open the restaurant dashboard and update this order status.';
    }

    const separator = RESTAURANT_PORTAL_URL.includes('?') ? '&' : '?';
    return `${RESTAURANT_PORTAL_URL}${separator}orderId=${encodeURIComponent(orderId)}`;
}

function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', chunk => {
            raw += chunk;
            if (raw.length > 1_000_000) {
                reject(new Error('Request body too large.'));
                req.destroy();
            }
        });

        req.on('end', () => {
            if (!raw) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(raw));
            } catch (error) {
                reject(new Error('Invalid JSON body.'));
            }
        });

        req.on('error', reject);
    });
}

function formatPhoneForWhatsApp(rawNumber) {
    const digits = String(rawNumber || '').replace(/\D/g, '');
    if (digits.startsWith('234')) return digits;
    if (digits.startsWith('0')) return `234${digits.slice(1)}`;
    return digits;
}

function sanitizeText(value, fallback = 'N/A') {
    const text = String(value || '').trim();
    return text || fallback;
}

function buildRestaurantOrderMessage(payload) {
    const items = Array.isArray(payload.items) ? payload.items : [];
    const itemSummary = items.length > 0
        ? items
            .map(item => `${sanitizeText(item?.name, 'Item')} x${Number(item?.quantity || 0)}`)
            .join(', ')
        : 'No item details provided';

    const amount = Number(payload.total || 0).toFixed(2);

    return [
        `NEW ORDER ${sanitizeText(payload.orderId || payload.id, 'UNKNOWN')}`,
        `Current Status: ${ORDER_STATUSES.pending}`,
        `Customer: ${sanitizeText(payload.customer)}`,
        `Phone: ${sanitizeText(payload.phone)}`,
        `Email: ${sanitizeText(payload.email, 'Not provided')}`,
        `Address: ${sanitizeText(payload.address)}`,
        `Landmark: ${sanitizeText(payload.landmark, 'Not provided')}`,
        `Subdistrict: ${sanitizeText(payload.subDistrict || payload.subdistrict, 'Not provided')}`,
        `District: ${sanitizeText(payload.district, 'Not provided')}`,
        `City: ${sanitizeText(payload.city, 'Not provided')}`,
        `Area/Postal: ${sanitizeText(payload.zip, 'Not provided')}`,
        `Payment: ${sanitizeText(payload.paymentMethod, 'Unknown')}`,
        `Payment Ref: ${sanitizeText(payload.paymentReference, 'N/A')}`,
        `Items: ${itemSummary}`,
        `Total: NGN ${amount}`,
        `Instructions: ${sanitizeText(payload.instructions, 'None')}`,
        `Restaurant Action: ${getRestaurantDashboardHint(sanitizeText(payload.orderId || payload.id, 'UNKNOWN'))}`
    ].join('\n');
}

async function sendWhatsAppMessageToRestaurant(messageText) {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !RESTAURANT_WHATSAPP_NUMBER) {
        throw new Error(
            'WhatsApp notification is not configured. Set WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and RESTAURANT_WHATSAPP_NUMBER.'
        );
    }

    const recipient = formatPhoneForWhatsApp(RESTAURANT_WHATSAPP_NUMBER);
    if (!recipient) {
        throw new Error('Invalid RESTAURANT_WHATSAPP_NUMBER format.');
    }

    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${encodeURIComponent(WHATSAPP_PHONE_NUMBER_ID)}/messages`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: recipient,
            type: 'text',
            text: {
                body: String(messageText || '')
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error?.message || `WhatsApp API request failed (${response.status}).`);
    }

    return {
        provider: 'whatsapp-cloud-api',
        messageId: data?.messages?.[0]?.id || ''
    };
}

async function notifyRestaurant(payload) {
    const orderId = String(payload.orderId || payload.id || '').trim();
    if (!orderId) {
        return {
            ok: false,
            message: 'Missing order id for restaurant notification.'
        };
    }

    const message = buildRestaurantOrderMessage(payload);
    const sentResult = await sendWhatsAppMessageToRestaurant(message);
    return {
        ok: true,
        message: 'Restaurant notified successfully.',
        orderId,
        ...sentResult
    };
}

async function verifyPaystackTransaction(reference) {
    if (!PAYSTACK_SECRET_KEY) {
        throw new Error('PAYSTACK_SECRET_KEY is not set on the verification server.');
    }

    const url = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    if (!response.ok || !data?.status) {
        throw new Error(data?.message || `Paystack verify failed (${response.status}).`);
    }

    return data.data;
}

function amountsMatch(expectedAmount, paidAmount) {
    return Math.abs(Number(expectedAmount || 0) - Number(paidAmount || 0)) <= 0.01;
}

async function verifyPaymentPayload(payload) {
    const method = (payload.method || '').toLowerCase();
    const reference = String(payload.reference || '').trim();
    const expectedAmount = Number(payload.amount || 0);

    if (!reference) {
        return {
            verified: false,
            message: 'Missing transaction reference.'
        };
    }

    if (!['card', 'bank-transfer'].includes(method)) {
        return {
            verified: false,
            message: 'Unsupported payment method for verification.'
        };
    }

    const transaction = await verifyPaystackTransaction(reference);
    const paidAmount = Number(transaction.amount || 0) / 100;
    const paidCurrency = transaction.currency || 'NGN';

    if (transaction.status !== 'success') {
        return {
            verified: false,
            message: `Transaction status is ${transaction.status}.`
        };
    }

    if (paidCurrency !== 'NGN') {
        return {
            verified: false,
            message: `Unexpected currency (${paidCurrency}).`
        };
    }

    if (!amountsMatch(expectedAmount, paidAmount)) {
        return {
            verified: false,
            message: `Paid amount ${paidAmount.toFixed(2)} does not match expected ${expectedAmount.toFixed(2)}.`
        };
    }

    const paidChannel = transaction.channel || '';
    if (method === 'card' && paidChannel !== 'card') {
        return {
            verified: false,
            message: `Expected card transaction but got ${paidChannel || 'unknown channel'}.`
        };
    }

    // Paystack may report transfer as bank_transfer or dedicated_nuban for virtual account flows.
    if (method === 'bank-transfer' && !['bank_transfer', 'dedicated_nuban'].includes(paidChannel)) {
        return {
            verified: false,
            message: `Expected bank transfer transaction but got ${paidChannel || 'unknown channel'}.`
        };
    }

    return {
        verified: true,
        message: 'Payment verified successfully.',
        reference: transaction.reference,
        provider: 'paystack',
        channel: paidChannel,
        amount: paidAmount
    };
}

async function warmupStateBackend() {
    if (!isSupabaseStateBackend()) {
        return;
    }

    ensureSupabaseStateConfig();
    await Promise.all([readOrderDb(), readUserDb()]);
}

const server = http.createServer(async (req, res) => {
    const { fullUrl, pathname } = parseRoute(req);

    if (req.method === 'OPTIONS') {
        sendJson(res, 204, {});
        return;
    }

    try {
        if (req.method === 'GET' && pathname === '/health') {
            sendJson(res, 200, {
                ok: true,
                service: 'order-payment-auth-api',
                stateBackend: isSupabaseStateBackend() ? 'supabase' : 'file',
                supabaseConfigured: isSupabaseStateConfigured(),
                now: new Date().toISOString()
            });
            return;
        }

        if (req.method === 'POST' && pathname === '/auth/register') {
            const payload = await parseRequestBody(req);
            const result = await registerUser(payload);
            sendJson(res, result.statusCode, result);
            return;
        }

        if (req.method === 'POST' && pathname === '/auth/login') {
            const payload = await parseRequestBody(req);
            const result = await loginUser(payload);
            sendJson(res, result.statusCode, result);
            return;
        }

        if (req.method === 'POST' && pathname === '/auth/update-profile') {
            const payload = await parseRequestBody(req);
            const result = await updateUserProfile(payload);
            sendJson(res, result.statusCode, result);
            return;
        }

        if (req.method === 'POST' && pathname === '/auth/request-password-reset') {
            const payload = await parseRequestBody(req);
            const result = await requestPasswordReset(payload);
            sendJson(res, result.statusCode, result);
            return;
        }

        if (req.method === 'POST' && pathname === '/auth/reset-password') {
            const payload = await parseRequestBody(req);
            const result = await resetPasswordWithCode(payload);
            sendJson(res, result.statusCode, result);
            return;
        }

        if (req.method === 'POST' && pathname === '/verify-payment') {
            const payload = await parseRequestBody(req);
            const result = await verifyPaymentPayload(payload);
            sendJson(res, result.verified ? 200 : 400, result);
            return;
        }

        if (req.method === 'POST' && pathname === '/notify-restaurant') {
            const payload = await parseRequestBody(req);
            const notificationResult = await notifyRestaurant(payload);
            sendJson(res, notificationResult.ok ? 200 : 400, notificationResult);
            return;
        }

        if (req.method === 'POST' && pathname === '/orders') {
            const payload = await parseRequestBody(req);
            const order = await createOrderRecord(payload);

            try {
                const notificationResult = await notifyRestaurant(order);
                const updated = await updateOrderRestaurantNotification(order.id, notificationResult, null);
                sendJson(res, 201, {
                    ok: true,
                    message: 'Order created and restaurant notified.',
                    order: updated || order,
                    restaurantNotification: notificationResult
                });
                return;
            } catch (notificationError) {
                const updated = await updateOrderRestaurantNotification(order.id, null, notificationError);
                sendJson(res, 201, {
                    ok: true,
                    message: 'Order created but restaurant notification failed.',
                    order: updated || order,
                    restaurantNotification: {
                        ok: false,
                        message: notificationError.message || 'Restaurant notification failed.'
                    }
                });
                return;
            }
        }

        if (req.method === 'GET' && pathname === '/orders') {
            if (!hasRestaurantAccess(req, fullUrl)) {
                sendJson(res, 401, {
                    ok: false,
                    message: 'Unauthorized restaurant request.'
                });
                return;
            }

            const statusFilter = fullUrl.searchParams.get('status') || '';
            const orders = await listOrders({ statusFilter });
            sendJson(res, 200, {
                ok: true,
                count: orders.length,
                orders
            });
            return;
        }

        if (req.method === 'GET') {
            const orderId = getOrderIdFromPath(pathname);
            if (orderId) {
                const order = await findOrderById(orderId);
                if (!order) {
                    sendJson(res, 404, {
                        ok: false,
                        message: 'Order not found.'
                    });
                    return;
                }

                sendJson(res, 200, {
                    ok: true,
                    order
                });
                return;
            }
        }

        if (req.method === 'PATCH') {
            const params = getOrderStatusPathParams(pathname);
            if (params?.orderId) {
                if (!hasRestaurantAccess(req, fullUrl)) {
                    sendJson(res, 401, {
                        ok: false,
                        message: 'Unauthorized restaurant request.'
                    });
                    return;
                }

                const payload = await parseRequestBody(req);
                const result = await updateOrderStatus(
                    params.orderId,
                    payload.status,
                    'restaurant',
                    sanitizeText(payload.note, '')
                );

                sendJson(res, result.statusCode, result);
                return;
            }
        }

        sendJson(res, 404, {
            ok: false,
            message: 'Route not found.'
        });
    } catch (error) {
        sendJson(res, 500, {
            ok: false,
            message: error.message || 'Verification server error.'
        });
    }
});

function onServerStarted() {
    const announceHost = HOST || '0.0.0.0/::';
    console.log(`Order + payment server running on http://${announceHost}:${PORT}`);
    console.log(`Local loopback: http://localhost:${PORT}`);
    console.log(`State backend mode: ${isSupabaseStateBackend() ? 'supabase' : 'file'}`);
    console.log('GET health check at /health');
    console.log('POST register users at /auth/register');
    console.log('POST login users at /auth/login');
    console.log('POST update profile at /auth/update-profile');
    console.log('POST request reset code at /auth/request-password-reset');
    console.log('POST reset password at /auth/reset-password');
    console.log('POST payment checks to /verify-payment');
    console.log('POST order alerts to /notify-restaurant');
    console.log('POST new orders to /orders');
    console.log('GET customer order by id from /orders/:id');
    console.log('GET restaurant orders from /orders?adminToken=...');
    console.log('PATCH restaurant status via /orders/:id/status');
    if (isPasswordResetEmailConfigured()) {
        console.log(`Password reset email configured via ${PASSWORD_RESET_EMAIL_PROVIDER}.`);
    } else {
        console.log('NOTICE: Password reset email not configured. Set PASSWORD_RESET_EMAIL_API_KEY and PASSWORD_RESET_EMAIL_FROM.');
    }
    if (DEV_MODE) {
        console.log('DEV MODE: Password reset codes are logged to console and included in API responses.');
    }
    if (RESTAURANT_DASHBOARD_TOKEN === 'dev-restaurant-token') {
        console.log('WARNING: Using default RESTAURANT_DASHBOARD_TOKEN. Set a strong token in environment variables.');
    }
    if (!RESTAURANT_INVITE_CODE) {
        console.log('NOTICE: RESTAURANT_INVITE_CODE is not set. Restaurant code registration is disabled unless email is in RESTAURANT_STAFF_EMAILS.');
    }

    if (isSupabaseStateBackend()) {
        if (!isSupabaseStateConfigured()) {
            console.log('ERROR: Supabase backend mode requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
        }

        warmupStateBackend()
            .then(() => {
                console.log('Supabase state backend ready.');
            })
            .catch(error => {
                console.log(`ERROR: Supabase state backend check failed: ${error.message || 'Unknown error'}`);
            });
    }
}

if (HOST) {
    server.listen(PORT, HOST, onServerStarted);
} else {
    server.listen(PORT, onServerStarted);
}
