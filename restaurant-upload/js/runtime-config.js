(function applyRuntimeConfig(windowObject) {
    if (!windowObject) return;

    // Default local file keeps values empty. Deployed builds can overwrite these values.
    windowObject.ORDER_API_BASE_URL = windowObject.ORDER_API_BASE_URL || '';
    windowObject.PAYMENT_VERIFY_ENDPOINT = windowObject.PAYMENT_VERIFY_ENDPOINT || '';
    windowObject.PAYSTACK_PUBLIC_KEY = windowObject.PAYSTACK_PUBLIC_KEY || '';
    windowObject.RESTAURANT_DASHBOARD_TOKEN = windowObject.RESTAURANT_DASHBOARD_TOKEN || '';
    windowObject.RESTAURANT_STAFF_EMAILS = windowObject.RESTAURANT_STAFF_EMAILS || '';
    windowObject.RESTAURANT_INVITE_CODE = windowObject.RESTAURANT_INVITE_CODE || '';
})(window);
