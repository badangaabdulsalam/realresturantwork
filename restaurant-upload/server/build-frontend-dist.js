const fs = require('fs/promises');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const FRONTEND_FILES = [
    'index.html',
    'menu.html',
    'cart.html',
    'checkout.html',
    'account.html',
    'restaurant.html',
    'css/styles.css',
    'js/app.js',
    'js/runtime-config.js'
];

function normalizeUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
}

function buildRuntimeConfigContent() {
    const orderApiBaseUrl = normalizeUrl(process.env.FRONTEND_ORDER_API_BASE_URL);
    const paymentVerifyEndpoint = String(process.env.FRONTEND_PAYMENT_VERIFY_ENDPOINT || '').trim();
    const paystackPublicKey = String(process.env.FRONTEND_PAYSTACK_PUBLIC_KEY || '').trim();
    const restaurantDashboardToken = String(process.env.FRONTEND_RESTAURANT_DASHBOARD_TOKEN || '').trim();
    const restaurantStaffEmails = String(process.env.FRONTEND_RESTAURANT_STAFF_EMAILS || '').trim();
    const restaurantInviteCode = String(process.env.FRONTEND_RESTAURANT_INVITE_CODE || '').trim();

    const effectiveVerifyEndpoint = paymentVerifyEndpoint || (orderApiBaseUrl ? `${orderApiBaseUrl}/verify-payment` : '');

    return [
        '(function applyRuntimeConfig(windowObject) {',
        '    if (!windowObject) return;',
        `    windowObject.ORDER_API_BASE_URL = windowObject.ORDER_API_BASE_URL || ${JSON.stringify(orderApiBaseUrl)};`,
        `    windowObject.PAYMENT_VERIFY_ENDPOINT = windowObject.PAYMENT_VERIFY_ENDPOINT || ${JSON.stringify(effectiveVerifyEndpoint)};`,
        `    windowObject.PAYSTACK_PUBLIC_KEY = windowObject.PAYSTACK_PUBLIC_KEY || ${JSON.stringify(paystackPublicKey)};`,
        `    windowObject.RESTAURANT_DASHBOARD_TOKEN = windowObject.RESTAURANT_DASHBOARD_TOKEN || ${JSON.stringify(restaurantDashboardToken)};`,
        `    windowObject.RESTAURANT_STAFF_EMAILS = windowObject.RESTAURANT_STAFF_EMAILS || ${JSON.stringify(restaurantStaffEmails)};`,
        `    windowObject.RESTAURANT_INVITE_CODE = windowObject.RESTAURANT_INVITE_CODE || ${JSON.stringify(restaurantInviteCode)};`,
        '})(window);',
        ''
    ].join('\n');
}

async function copyFrontendFiles() {
    await fs.rm(DIST_DIR, { recursive: true, force: true });

    for (const relativePath of FRONTEND_FILES) {
        const sourcePath = path.join(ROOT_DIR, relativePath);
        const destinationPath = path.join(DIST_DIR, relativePath);
        await fs.mkdir(path.dirname(destinationPath), { recursive: true });
        await fs.copyFile(sourcePath, destinationPath);
    }

    const runtimeConfigPath = path.join(DIST_DIR, 'js', 'runtime-config.js');
    await fs.writeFile(runtimeConfigPath, buildRuntimeConfigContent(), 'utf8');
}

copyFrontendFiles()
    .then(() => {
        console.log(`Frontend dist generated at ${DIST_DIR}`);
    })
    .catch(error => {
        console.error(error?.message || error);
        process.exit(1);
    });
