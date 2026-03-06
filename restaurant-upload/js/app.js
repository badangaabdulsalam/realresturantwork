// ==================== 
// MENU DATA
// ====================

const DEFAULT_MENU_DATA = [
    // Appetizers
    {
        id: 1,
        name: "Chicken Wings",
        category: "appetizers",
        price: 8.99,
        description: "Crispy chicken wings with sauce",
        calories: 320,
        emoji: "🍗"
    },
    {
        id: 2,
        name: "Garlic Bread",
        category: "appetizers",
        price: 4.99,
        description: "Toasted bread with garlic and butter",
        calories: 280,
        emoji: "🥖"
    },
    {
        id: 3,
        name: "Cheese Dip",
        category: "appetizers",
        price: 5.99,
        description: "Creamy cheese dip with tortilla chips",
        calories: 350,
        emoji: "🧀"
    },
    
    // Main Courses
    {
        id: 4,
        name: "Burger",
        category: "main",
        price: 12.99,
        description: "Juicy beef burger with lettuce and tomato",
        calories: 520,
        emoji: "🍔"
    },
    {
        id: 5,
        name: "Pizza",
        category: "main",
        price: 14.99,
        description: "Pepperoni pizza with mozzarella cheese",
        calories: 680,
        emoji: "🍕"
    },
    {
        id: 6,
        name: "Pasta Carbonara",
        category: "main",
        price: 13.99,
        description: "Creamy pasta with bacon and parmesan",
        calories: 620,
        emoji: "🍝"
    },
    {
        id: 7,
        name: "Grilled Salmon",
        category: "main",
        price: 16.99,
        description: "Fresh salmon fillet with lemon butter",
        calories: 450,
        emoji: "🐟"
    },
    {
        id: 8,
        name: "Chicken Steak",
        category: "main",
        price: 15.99,
        description: "Tender chicken breast with herbs",
        calories: 380,
        emoji: "🍗"
    },
    
    // Sides
    {
        id: 9,
        name: "French Fries",
        category: "sides",
        price: 4.99,
        description: "Crispy golden french fries",
        calories: 420,
        emoji: "🍟"
    },
    {
        id: 10,
        name: "Caesar Salad",
        category: "sides",
        price: 6.99,
        description: "Fresh romaine lettuce with caesar dressing",
        calories: 280,
        emoji: "🥗"
    },
    {
        id: 11,
        name: "Onion Rings",
        category: "sides",
        price: 5.99,
        description: "Crispy fried onion rings",
        calories: 380,
        emoji: "🧅"
    },
    
    // Desserts
    {
        id: 12,
        name: "Chocolate Cake",
        category: "desserts",
        price: 5.99,
        description: "Rich and moist chocolate cake",
        calories: 450,
        emoji: "🍰"
    },
    {
        id: 13,
        name: "Ice Cream",
        category: "desserts",
        price: 4.99,
        description: "Vanilla ice cream with toppings",
        calories: 320,
        emoji: "🍦"
    },
    {
        id: 14,
        name: "Cheesecake",
        category: "desserts",
        price: 6.99,
        description: "Creamy New York style cheesecake",
        calories: 520,
        emoji: "🍪"
    },
    
    // Beverages
    {
        id: 15,
        name: "Coca Cola",
        category: "beverages",
        price: 2.99,
        description: "Classic cola drink",
        calories: 140,
        emoji: "🥤"
    },
    {
        id: 16,
        name: "Iced Tea",
        category: "beverages",
        price: 2.49,
        description: "Refreshing iced tea",
        calories: 0,
        emoji: "🧋"
    },
    {
        id: 17,
        name: "Orange Juice",
        category: "beverages",
        price: 3.99,
        description: "Fresh squeezed orange juice",
        calories: 110,
        emoji: "🧃"
    }
];

function getDefaultMenuDataSnapshot() {
    return DEFAULT_MENU_DATA.map(item => ({ ...item }));
}

function normalizeMenuCategory(value) {
    const allowedCategories = ['appetizers', 'main', 'sides', 'desserts', 'beverages'];
    const normalized = String(value || '').trim().toLowerCase();
    return allowedCategories.includes(normalized) ? normalized : 'main';
}

function normalizeMenuImage(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    const isHttpImage = /^https?:\/\/.+/i.test(raw);
    const isRelativeImage = /^(\.\/|\.\.\/|\/).+/i.test(raw);
    const isDataImage = /^data:image\/.+;base64,/i.test(raw);

    return (isHttpImage || isRelativeImage || isDataImage) ? raw : '';
}

function normalizeMenuItemRecord(rawItem, fallbackId) {
    const normalizedId = Number.isFinite(Number(rawItem?.id))
        ? Math.max(1, Math.floor(Number(rawItem.id)))
        : Math.max(1, Math.floor(Number(fallbackId) || 1));
    const name = String(rawItem?.name || '').trim();
    if (!name) return null;

    const description = String(rawItem?.description || '').trim() || `Delicious ${name}`;
    const emoji = String(rawItem?.emoji || '').trim() || '🍽️';
    const image = normalizeMenuImage(rawItem?.image);
    const price = Number(rawItem?.price || 0);
    const calories = Number(rawItem?.calories || 0);

    return {
        id: normalizedId,
        name,
        category: normalizeMenuCategory(rawItem?.category),
        price: Number.isFinite(price) && price > 0 ? Number(price.toFixed(2)) : 1,
        description,
        calories: Number.isFinite(calories) && calories >= 0 ? Math.round(calories) : 0,
        emoji,
        image
    };
}

function loadMenuDataFromStorage() {
    const fallback = getDefaultMenuDataSnapshot();

    try {
        const stored = localStorage.getItem('restaurant_menu_data');
        if (!stored) {
            return fallback;
        }

        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
            return fallback;
        }

        const normalized = parsed
            .map((item, index) => normalizeMenuItemRecord(item, index + 1))
            .filter(Boolean);

        return normalized.length > 0 ? normalized : fallback;
    } catch (error) {
        return fallback;
    }
}

let menuData = loadMenuDataFromStorage();

function persistMenuData() {
    try {
        localStorage.setItem('restaurant_menu_data', JSON.stringify(menuData));
    } catch (error) {
        // Ignore storage quota/privacy mode errors and keep in-memory menu data.
    }
}

const menuViewState = {
    category: 'all',
    search: '',
    sort: 'default'
};

const RESTAURANT_NOTIFICATION_NUMBER = '09039918242';
const DEFAULT_BACKEND_PORT = 8787;
const LOCAL_FALLBACK_API_BASE_URL = `http://localhost:${DEFAULT_BACKEND_PORT}`;

function isLikelyIpv4Host(hostname) {
    return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(String(hostname || '').trim());
}

function buildLanApiBaseUrl(protocol, hostname) {
    const safeProtocol = protocol === 'https:' ? 'https:' : 'http:';
    return `${safeProtocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
}

function getDefaultOrderApiBaseUrl() {
    const protocol = String(window.location.protocol || '').toLowerCase();
    const hostname = String(window.location.hostname || '').toLowerCase();
    const origin = String(window.location.origin || '').trim();
    const isHttpPage = protocol === 'http:' || protocol === 'https:';

    if (!isHttpPage || !origin) {
        return LOCAL_FALLBACK_API_BASE_URL;
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return LOCAL_FALLBACK_API_BASE_URL;
    }

    // For phone/LAN testing (e.g. 192.168.x.x), backend typically stays on port 8787.
    if (isLikelyIpv4Host(hostname)) {
        return buildLanApiBaseUrl(protocol, hostname);
    }

    // Prefer same-origin API in deployed environments.
    return origin;
}

const DEFAULT_ORDER_API_BASE_URL = getDefaultOrderApiBaseUrl();
const DEFAULT_PAYMENT_VERIFY_ENDPOINT = `${DEFAULT_ORDER_API_BASE_URL}/verify-payment`;

const PAYMENT_GATEWAY_CONFIG = {
    paystackPublicKey: window.PAYSTACK_PUBLIC_KEY || localStorage.getItem('paystack_public_key') || 'pk_test_181be3ffacea2b55d625a96894bb9a1a283861ed',
    verificationEndpoint: window.PAYMENT_VERIFY_ENDPOINT || localStorage.getItem('payment_verify_endpoint') || DEFAULT_PAYMENT_VERIFY_ENDPOINT
};
const ORDER_WORKFLOW_CONFIG = {
    baseUrl: window.ORDER_API_BASE_URL || localStorage.getItem('order_api_base_url') || DEFAULT_ORDER_API_BASE_URL,
    restaurantToken: window.RESTAURANT_DASHBOARD_TOKEN || localStorage.getItem('restaurant_dashboard_token') || ''
};
const RESTAURANT_ACCESS_CONFIG = {
    // Comma-separated list, e.g. "owner@example.com,manager@example.com"
    staffEmails: window.RESTAURANT_STAFF_EMAILS || localStorage.getItem('restaurant_staff_emails') || '',
    inviteCode: window.RESTAURANT_INVITE_CODE || localStorage.getItem('restaurant_invite_code') || ''
};

const DEFAULT_RESTAURANT_ADMIN = {
    username: 'abdulsalam',
    email: 'abdulsalam@restaurant.local',
    password: 'abdulsalam',
    name: 'Abdulsalam Restaurant Admin'
};

const DEFAULT_RESTAURANT_DASHBOARD_TOKEN = 'dev-restaurant-token';

const ORDER_STATUS_STEPS = [
    'pending_restaurant_confirmation',
    'confirmed',
    'preparing',
    'ready_for_dispatch',
    'out_for_delivery',
    'delivered'
];

const ORDER_STATUS_LABELS = {
    pending_restaurant_confirmation: 'Pending Restaurant Confirmation',
    confirmed: 'Confirmed by Restaurant',
    preparing: 'Preparing Order',
    ready_for_dispatch: 'Ready for Dispatch',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    rejected: 'Rejected by Restaurant',
    cancelled: 'Cancelled'
};

const ABUJA_LOCATION_SUGGESTIONS = {
    Asokoro: ['Asokoro Main', 'Aso Drive', 'Yakubu Gowon Crescent', 'Ty Danjuma Street'],
    Garki: ['Area 1', 'Area 2', 'Area 3', 'Area 7', 'Area 8', 'Area 10', 'Area 11'],
    Gwarinpa: ['1st Avenue', '2nd Avenue', '3rd Avenue', '4th Avenue', '5th Avenue', '6th Avenue', '7th Avenue'],
    Guzape: ['Guzape I', 'Guzape II', 'Diplomatic Zone'],
    Jabi: ['Jabi Lake Area', 'Jabi Park Axis', 'Jabi Motor Park Area'],
    Karmo: ['Karmo Village', 'Idu-Karmo Axis', 'Karmo District Centre'],
    Kubwa: ['Byazhin', 'Dutse Alhaji', 'PW', 'Arab Road', 'Pipeline'],
    Lokogoma: ['Phase 1', 'Phase 2', 'Cadastral Zone C09', 'Cadastral Zone C10'],
    Lugbe: ['Trademore', 'Federal Housing', 'Airport Road Corridor'],
    Maitama: ['Maitama Extension', 'Ibb Way', 'Gana Street', 'Colorado Close'],
    Utako: ['Utako District Centre', 'NCC Area', 'NITEL Area', 'Utako Market Axis'],
    Wuse: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6', 'Wuse Market Area']
};

const paymentVerificationState = {
    required: false,
    confirmed: false,
    method: 'cash',
    reference: '',
    provider: '',
    verifiedAt: 0,
    amount: 0
};

let orderStatusPollTimer = null;
let orderStatusPollInFlight = false;
let restaurantDashboardRefreshTimer = null;
let restaurantDashboardUsingLocalCache = false;
let restaurantDashboardLatestOrders = [];
let restaurantDashboardFetchedOrders = [];
let restaurantDashboardDistrictFilter = 'all';

const LOCAL_RESTAURANT_ORDER_CACHE_KEY = 'restaurant_orders_local_cache';
const CHECKOUT_SELECTED_ADDRESS_KEY = 'checkout_selected_address';
const CHECKOUT_DRAFT_KEY = 'checkout_delivery_draft';

const SCROLL_REVEAL_SELECTORS = [
    '.page-header',
    '.info-card',
    '.feature',
    '.highlight-card',
    '.menu-item',
    '.cart-item',
    '.checkout-form',
    '.order-summary',
    '.profile-section-box',
    '.auth-form',
    '.restaurant-order-card',
    '.restaurant-menu-item',
    '.saved-address-card'
].join(',');

let scrollRevealObserver = null;
let keyboardShortcutsBound = false;
let mobileNavDrawerInitialized = false;
let menuRenderRequestCounter = 0;
let connectivityIndicatorInitialized = false;
let internalPageTransitionsBound = false;
let mobileQuickDockInitialized = false;
let mobileQuickDockSignature = '';
let mobileGestureEnhancementsInitialized = false;
let sectionParallaxInitialized = false;
let themeFxToggleInitialized = false;
let sectionParallaxTicking = false;
let lastGestureRefreshAt = 0;

// ==================== 
// LOCAL STORAGE FUNCTIONS
// ====================

function getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function getUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

function saveSelectedCheckoutAddress(address) {
    if (!address) return;

    const normalized = {
        name: String(address.name || 'Address').trim() || 'Address',
        street: String(address.street || '').trim(),
        district: String(address.district || '').trim(),
        subDistrict: String(address.subDistrict || address.subdistrict || '').trim(),
        city: String(address.city || '').trim(),
        zip: String(address.zip || '').trim()
    };

    if (!normalized.street || !normalized.district || !normalized.subDistrict || !normalized.city) return;

    try {
        localStorage.setItem(CHECKOUT_SELECTED_ADDRESS_KEY, JSON.stringify(normalized));
    } catch (error) {
        // Ignore storage quota/privacy mode errors and keep regular checkout flow.
    }
}

function getSelectedCheckoutAddress() {
    try {
        const raw = localStorage.getItem(CHECKOUT_SELECTED_ADDRESS_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        const street = String(parsed?.street || '').trim();
        const district = String(parsed?.district || '').trim();
        const subDistrict = String(parsed?.subDistrict || parsed?.subdistrict || '').trim();
        const city = String(parsed?.city || '').trim();
        if (!street || !district || !subDistrict || !city) return null;

        return {
            name: String(parsed?.name || 'Address').trim() || 'Address',
            street,
            district,
            subDistrict,
            city,
            zip: String(parsed?.zip || '').trim()
        };
    } catch (error) {
        return null;
    }
}

function applySelectedCheckoutAddressToCheckoutForm() {
    const address = getSelectedCheckoutAddress();
    if (!address) return false;

    const addressInput = document.getElementById('address');
    const districtInput = document.getElementById('district');
    const subDistrictInput = document.getElementById('subdistrict');
    const cityInput = document.getElementById('city');
    const zipInput = document.getElementById('zip');
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');

    if (addressInput && !String(addressInput.value || '').trim()) {
        addressInput.value = address.street;
    }

    if (cityInput && !String(cityInput.value || '').trim()) {
        cityInput.value = address.city;
    }

    if (districtInput && !String(districtInput.value || '').trim()) {
        districtInput.value = address.district;
    }

    if (subDistrictInput && !String(subDistrictInput.value || '').trim()) {
        subDistrictInput.value = address.subDistrict;
    }

    if (zipInput && !String(zipInput.value || '').trim() && address.zip) {
        zipInput.value = address.zip;
    }

    const currentUser = getCurrentUser();
    const currentUserData = currentUser ? getUserData(currentUser) : null;
    if (currentUserData) {
        if (fullnameInput && !String(fullnameInput.value || '').trim()) {
            fullnameInput.value = String(currentUserData.name || '').trim();
        }

        if (emailInput && !String(emailInput.value || '').trim()) {
            emailInput.value = String(currentUserData.email || '').trim();
        }
    }

    return true;
}

function normalizeLocationLookupKey(value) {
    return String(value || '').trim().toLowerCase();
}

function getAbujaDistrictList() {
    return Object.keys(ABUJA_LOCATION_SUGGESTIONS).sort((a, b) => a.localeCompare(b));
}

function getAbujaDistrictMatch(value) {
    const target = normalizeLocationLookupKey(value);
    if (!target) return '';

    return getAbujaDistrictList().find(district => normalizeLocationLookupKey(district) === target) || '';
}

function getSubdistrictSuggestionsForDistrict(districtValue) {
    const matchedDistrict = getAbujaDistrictMatch(districtValue);
    if (matchedDistrict) {
        return [...ABUJA_LOCATION_SUGGESTIONS[matchedDistrict]];
    }

    // Fall back to all known subdistricts when district is not selected.
    return Array.from(new Set(Object.values(ABUJA_LOCATION_SUGGESTIONS).flat())).sort((a, b) => a.localeCompare(b));
}

function populateLocationDatalist(listId, values) {
    const listEl = document.getElementById(listId);
    if (!listEl) return;

    listEl.innerHTML = '';
    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        listEl.appendChild(option);
    });
}

function bindDistrictSubdistrictAutocomplete({
    districtInputId,
    subdistrictInputId,
    districtListId,
    subdistrictListId,
    cityInputId
}) {
    const districtInput = document.getElementById(districtInputId);
    const subdistrictInput = document.getElementById(subdistrictInputId);
    if (!districtInput || !subdistrictInput) return;

    const cityInput = cityInputId ? document.getElementById(cityInputId) : null;
    const districtOptions = getAbujaDistrictList();
    populateLocationDatalist(districtListId, districtOptions);

    const refreshSubdistrictOptions = () => {
        populateLocationDatalist(subdistrictListId, getSubdistrictSuggestionsForDistrict(districtInput.value));

        if (cityInput && !String(cityInput.value || '').trim()) {
            cityInput.value = 'Abuja';
        }
    };

    if (!districtInput.dataset.autocompleteBound) {
        districtInput.dataset.autocompleteBound = '1';
        districtInput.addEventListener('input', refreshSubdistrictOptions);
        districtInput.addEventListener('change', refreshSubdistrictOptions);
    }

    if (!subdistrictInput.dataset.autocompleteBound) {
        subdistrictInput.dataset.autocompleteBound = '1';
        subdistrictInput.addEventListener('focus', refreshSubdistrictOptions);
    }

    refreshSubdistrictOptions();
}

function initAddressAutocomplete() {
    bindDistrictSubdistrictAutocomplete({
        districtInputId: 'district',
        subdistrictInputId: 'subdistrict',
        districtListId: 'checkout-district-list',
        subdistrictListId: 'checkout-subdistrict-list',
        cityInputId: 'city'
    });

    bindDistrictSubdistrictAutocomplete({
        districtInputId: 'address-district',
        subdistrictInputId: 'address-subdistrict',
        districtListId: 'address-district-list',
        subdistrictListId: 'address-subdistrict-list',
        cityInputId: 'address-city'
    });
}

function getCurrentPageKey() {
    const path = String(window.location.pathname || '').toLowerCase();
    const file = path.split('/').pop() || 'index.html';

    if (file === 'index.html' || file === '') return 'index';
    if (file === 'menu.html') return 'menu';
    if (file === 'cart.html') return 'cart';
    if (file === 'checkout.html') return 'checkout';
    if (file === 'account.html') return 'account';
    if (file === 'restaurant.html') return 'restaurant';
    return 'general';
}

function initPageEnhancementProfile() {
    const pageKey = getCurrentPageKey();
    document.body.dataset.page = pageKey;

    const pageTargets = {
        index: ['.hero-kicker', '.hero-content h2', '.hero-content p', '.hero-actions', '.hero-stats', '.highlight-card', '.info-card', '.feature'],
        menu: ['.page-header h1', '.page-header p', '.menu-tools', '.filter-buttons', '.menu-item'],
        cart: ['.page-header h1', '.cart-items', '.cart-summary', '.cart-item'],
        checkout: ['.page-header h1', '.checkout-form .form-section', '.order-summary'],
        account: ['.page-header h1', '.auth-form', '.profile-section-box', '.saved-address-card'],
        restaurant: ['.page-header h1', '.restaurant-toolbar', '.restaurant-summary-row', '.restaurant-order-card', '.restaurant-menu-item'],
        general: ['.page-header h1', '.page-header p']
    };

    const selectors = pageTargets[pageKey] || pageTargets.general;
    const elements = document.querySelectorAll(selectors.join(','));
    elements.forEach((element, index) => {
        if (!(element instanceof HTMLElement)) return;
        if (element.dataset.pageMotionBound === '1') return;

        element.dataset.pageMotionBound = '1';
        element.classList.add('page-motion-target');
        element.style.setProperty('--page-motion-delay', `${Math.min(index, 8) * 70}ms`);
    });
}

function closeMobileNavDrawer() {
    const overlay = document.getElementById('nav-drawer-overlay');
    const toggle = document.getElementById('mobile-nav-toggle');
    document.body.classList.remove('mobile-nav-open');
    if (overlay) overlay.classList.remove('active');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function openMobileNavDrawer() {
    const overlay = document.getElementById('nav-drawer-overlay');
    const toggle = document.getElementById('mobile-nav-toggle');
    document.body.classList.add('mobile-nav-open');
    if (overlay) overlay.classList.add('active');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
}

function initMobileNavDrawer() {
    const navbarContainer = document.querySelector('.navbar-container');
    const navMenu = navbarContainer?.querySelector('.nav-menu');
    if (!navbarContainer || !navMenu) return;
    if (mobileNavDrawerInitialized) return;

    mobileNavDrawerInitialized = true;

    if (!navMenu.id) {
        navMenu.id = 'site-nav-menu';
    }

    const toggleButton = document.createElement('button');
    toggleButton.id = 'mobile-nav-toggle';
    toggleButton.className = 'nav-toggle';
    toggleButton.type = 'button';
    toggleButton.setAttribute('aria-label', 'Toggle site navigation');
    toggleButton.setAttribute('aria-controls', navMenu.id);
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.innerHTML = '<span></span><span></span><span></span>';
    navbarContainer.insertBefore(toggleButton, navMenu);

    let overlay = document.getElementById('nav-drawer-overlay');
    if (!overlay) {
        overlay = document.createElement('button');
        overlay.id = 'nav-drawer-overlay';
        overlay.type = 'button';
        overlay.setAttribute('aria-label', 'Close navigation menu');
        document.body.appendChild(overlay);
    }

    const isMobileLayout = () => window.matchMedia('(max-width: 900px)').matches;

    const syncDrawerMode = () => {
        const mobileMode = isMobileLayout();
        toggleButton.classList.toggle('is-visible', mobileMode);
        if (!mobileMode) {
            closeMobileNavDrawer();
        }
    };

    toggleButton.addEventListener('click', () => {
        if (!isMobileLayout()) return;

        if (document.body.classList.contains('mobile-nav-open')) {
            closeMobileNavDrawer();
        } else {
            openMobileNavDrawer();
        }
    });

    overlay.addEventListener('click', closeMobileNavDrawer);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeMobileNavDrawer();
        }
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (isMobileLayout()) {
                closeMobileNavDrawer();
            }
        });
    });

    window.addEventListener('resize', syncDrawerMode);
    syncDrawerMode();
}

function initNavbarScrollState() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const applyState = () => {
        navbar.classList.toggle('navbar-scrolled', window.scrollY > 14);
    };

    applyState();
    window.addEventListener('scroll', applyState, { passive: true });
}

function ensureScrollProgressBar() {
    let progress = document.getElementById('app-scroll-progress');
    if (!progress) {
        progress = document.createElement('div');
        progress.id = 'app-scroll-progress';
        document.body.appendChild(progress);
    }
    return progress;
}

function updateScrollProgressBar() {
    const progress = ensureScrollProgressBar();
    const maxScrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const ratio = Math.max(0, Math.min(1, window.scrollY / maxScrollable));
    progress.style.transform = `scaleX(${ratio})`;
}

function initScrollProgressBar() {
    ensureScrollProgressBar();
    updateScrollProgressBar();
    window.addEventListener('scroll', updateScrollProgressBar, { passive: true });
    window.addEventListener('resize', updateScrollProgressBar);
}

function initBackToTopButton() {
    let button = document.getElementById('app-back-to-top');
    if (!button) {
        button = document.createElement('button');
        button.id = 'app-back-to-top';
        button.type = 'button';
        button.setAttribute('aria-label', 'Back to top');
        button.textContent = 'Top';
        document.body.appendChild(button);
    }

    const syncVisibility = () => {
        button.classList.toggle('active', window.scrollY > 420);
    };

    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    syncVisibility();
    window.addEventListener('scroll', syncVisibility, { passive: true });
}

function queueScrollRevealTargets(root = document) {
    if (!scrollRevealObserver) return;

    const rootElement = root instanceof Element ? root : document;

    if (rootElement.matches && rootElement.matches(SCROLL_REVEAL_SELECTORS)) {
        if (!rootElement.classList.contains('reveal-target-initialized')) {
            rootElement.classList.add('reveal-element', 'reveal-target-initialized');
            scrollRevealObserver.observe(rootElement);
        }
    }

    rootElement.querySelectorAll(SCROLL_REVEAL_SELECTORS).forEach(element => {
        if (element.classList.contains('reveal-target-initialized')) return;
        element.classList.add('reveal-element', 'reveal-target-initialized');
        scrollRevealObserver.observe(element);
    });
}

function initScrollReveal() {
    if (typeof window.IntersectionObserver === 'undefined') return;

    if (scrollRevealObserver) {
        scrollRevealObserver.disconnect();
    }

    scrollRevealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    queueScrollRevealTargets(document);
}

function animateCounterValue(element, targetValue, prefix, suffix) {
    const durationMs = 900;
    const startTime = performance.now();

    const tick = (now) => {
        const progress = Math.min((now - startTime) / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(targetValue * eased);
        element.textContent = `${prefix}${currentValue.toLocaleString()}${suffix}`;

        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    };

    requestAnimationFrame(tick);
}

function initHeroStatCounters() {
    const statValues = document.querySelectorAll('.hero-stat strong');
    if (!statValues.length) return;

    statValues.forEach(element => {
        if (element.dataset.counterReady) return;
        element.dataset.counterReady = '1';

        const rawText = String(element.textContent || '').trim();
        const numberPart = rawText.replace(/[^0-9]/g, '');
        if (!numberPart) return;

        const numberMatch = rawText.match(/[0-9][0-9,]*/);
        const numericText = numberMatch ? numberMatch[0] : numberPart;
        const numericIndex = rawText.indexOf(numericText);
        const prefix = numericIndex > 0 ? rawText.slice(0, numericIndex) : '';
        const suffix = numericIndex >= 0 ? rawText.slice(numericIndex + numericText.length) : '';
        const target = Number(numberPart);
        if (!Number.isFinite(target)) return;

        const startAnimation = () => {
            if (element.dataset.counterStarted) return;
            element.dataset.counterStarted = '1';
            animateCounterValue(element, target, prefix, suffix);
        };

        if (typeof window.IntersectionObserver === 'undefined') {
            startAnimation();
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                startAnimation();
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.4 });

        observer.observe(element);
    });
}

function isTypingContext(target) {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

function initKeyboardShortcuts() {
    if (keyboardShortcutsBound) return;
    keyboardShortcutsBound = true;

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeItemModal();
            return;
        }

        if (event.key === '/' && !isTypingContext(event.target)) {
            const menuSearchInput = document.getElementById('menu-search');
            if (!menuSearchInput) return;
            event.preventDefault();
            menuSearchInput.focus();
            menuSearchInput.select?.();
        }
    });
}

function createConnectivityIndicatorElement() {
    let indicator = document.getElementById('app-connectivity-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'app-connectivity-indicator';
        indicator.className = 'connectivity-indicator online';
        indicator.innerHTML = '<span class="connectivity-dot" aria-hidden="true"></span><span class="connectivity-text">Online</span>';
        document.body.appendChild(indicator);
    }

    return indicator;
}

function updateConnectivityIndicator(showToast = false) {
    const indicator = createConnectivityIndicatorElement();
    const isOnline = navigator.onLine !== false;

    indicator.classList.toggle('online', isOnline);
    indicator.classList.toggle('offline', !isOnline);

    const text = indicator.querySelector('.connectivity-text');
    if (text) {
        text.textContent = isOnline ? 'Online' : 'Offline';
    }

    if (showToast) {
        showNotification(isOnline ? 'Connection restored.' : 'You are offline. Some features may use local cache.');
    }
}

function initConnectivityIndicator() {
    if (connectivityIndicatorInitialized) return;
    connectivityIndicatorInitialized = true;

    updateConnectivityIndicator(false);

    window.addEventListener('online', () => updateConnectivityIndicator(true));
    window.addEventListener('offline', () => updateConnectivityIndicator(true));
}

function isInternalHtmlNavigation(anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) return false;
    const href = String(anchor.getAttribute('href') || '').trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return false;
    if (anchor.target && anchor.target !== '_self') return false;
    if (anchor.hasAttribute('download')) return false;

    let parsed;
    try {
        parsed = new URL(anchor.href, window.location.href);
    } catch (error) {
        return false;
    }

    if (parsed.origin !== window.location.origin) return false;
    const path = String(parsed.pathname || '').toLowerCase();
    return path.endsWith('.html');
}

function initInternalPageTransitions() {
    if (internalPageTransitionsBound) return;
    internalPageTransitionsBound = true;

    document.addEventListener('click', event => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const anchor = target.closest('a[href]');
        if (!(anchor instanceof HTMLAnchorElement)) return;
        if (!isInternalHtmlNavigation(anchor)) return;
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;

        const destination = anchor.href;
        if (!destination || destination === window.location.href) return;

        event.preventDefault();
        document.body.classList.add('app-transitioning');
        window.setTimeout(() => {
            window.location.href = destination;
        }, 160);
    });
}

function createGestureRefreshHint() {
    let hint = document.getElementById('app-gesture-refresh-hint');
    if (!hint) {
        hint = document.createElement('div');
        hint.id = 'app-gesture-refresh-hint';
        hint.className = 'gesture-refresh-hint';
        hint.textContent = 'Refreshing...';
        document.body.appendChild(hint);
    }

    return hint;
}

function showGestureRefreshHint(message = 'Refreshing...') {
    const hint = createGestureRefreshHint();
    hint.textContent = message;
    hint.classList.remove('active');
    void hint.offsetWidth;
    hint.classList.add('active');

    clearTimeout(showGestureRefreshHint._timer);
    showGestureRefreshHint._timer = setTimeout(() => {
        hint.classList.remove('active');
    }, 820);
}

async function runPageGestureRefresh() {
    const pageKey = getCurrentPageKey();

    if (pageKey === 'menu' && document.getElementById('menu-grid')) {
        displayMenu(menuViewState.category, { showSkeleton: true });
        showGestureRefreshHint('Menu refreshed');
        return;
    }

    if (pageKey === 'cart' && document.getElementById('cart-items-container')) {
        displayCart();
        calculateTotals();
        showGestureRefreshHint('Cart refreshed');
        return;
    }

    if (pageKey === 'checkout' && document.getElementById('summary-items')) {
        displayCheckoutSummary();
        updateCartCount();
        showGestureRefreshHint('Checkout refreshed');
        return;
    }

    if (pageKey === 'account' && document.getElementById('profile-section')) {
        updateAccountUI();
        showGestureRefreshHint('Account refreshed');
        return;
    }

    if (pageKey === 'restaurant' && document.getElementById('restaurant-orders-list')) {
        try {
            await refreshRestaurantDashboardOrders({ showSkeleton: true, silent: false });
            showGestureRefreshHint('Orders refreshed');
        } catch (error) {
            showGestureRefreshHint('Refresh failed');
        }
        return;
    }

    updateCartCount();
    showGestureRefreshHint('Page refreshed');
}

function initMobileGestureEnhancements() {
    if (mobileGestureEnhancementsInitialized) return;
    mobileGestureEnhancementsInitialized = true;

    const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!supportsTouch) return;

    const gestureState = {
        tracking: false,
        triggered: false,
        startX: 0,
        startY: 0,
        startScrollY: 0
    };

    const isMobileLayout = () => window.matchMedia('(max-width: 900px)').matches;

    document.addEventListener('touchstart', event => {
        if (!event.touches || event.touches.length !== 1) {
            gestureState.tracking = false;
            return;
        }

        const touch = event.touches[0];
        gestureState.tracking = true;
        gestureState.triggered = false;
        gestureState.startX = touch.clientX;
        gestureState.startY = touch.clientY;
        gestureState.startScrollY = window.scrollY;
    }, { passive: true });

    document.addEventListener('touchmove', event => {
        if (!gestureState.tracking || gestureState.triggered) return;
        if (!event.touches || event.touches.length !== 1) return;

        const touch = event.touches[0];
        const deltaX = touch.clientX - gestureState.startX;
        const deltaY = touch.clientY - gestureState.startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        const canHandleDrawer = isMobileLayout();

        if (canHandleDrawer && absDeltaX > 84 && absDeltaY < 64) {
            if (deltaX > 0 && gestureState.startX <= 34 && !document.body.classList.contains('mobile-nav-open')) {
                openMobileNavDrawer();
                gestureState.triggered = true;
                showGestureRefreshHint('Menu opened');
                return;
            }

            if (deltaX < 0 && document.body.classList.contains('mobile-nav-open')) {
                closeMobileNavDrawer();
                gestureState.triggered = true;
                showGestureRefreshHint('Menu closed');
                return;
            }
        }

        if (
            deltaY > 122
            && absDeltaX < 66
            && gestureState.startY <= 110
            && gestureState.startScrollY <= 14
        ) {
            const now = Date.now();
            if (now - lastGestureRefreshAt < 1400) {
                gestureState.triggered = true;
                return;
            }

            lastGestureRefreshAt = now;
            gestureState.triggered = true;
            runPageGestureRefresh();
        }
    }, { passive: true });

    document.addEventListener('touchend', () => {
        gestureState.tracking = false;
    }, { passive: true });

    document.addEventListener('touchcancel', () => {
        gestureState.tracking = false;
    }, { passive: true });
}

function getMobileQuickDockItems() {
    const items = [
        { key: 'index', href: 'index.html', label: 'Home' },
        { key: 'menu', href: 'menu.html', label: 'Menu' },
        { key: 'cart', href: 'cart.html', label: 'Cart' },
        { key: 'account', href: 'account.html', label: getCurrentUser() ? 'Account' : 'Login' }
    ];

    if (currentUserCanAccessRestaurantDashboard()) {
        items.push({ key: 'restaurant', href: 'restaurant.html', label: 'Dashboard' });
    }

    return items;
}

function syncMobileQuickDockState() {
    const dock = document.getElementById('app-mobile-dock');
    if (!dock) return;

    const pageKey = getCurrentPageKey();
    dock.querySelectorAll('[data-dock-key]').forEach(link => {
        const linkKey = String(link.getAttribute('data-dock-key') || '');
        link.classList.toggle('active', linkKey === pageKey);
    });

    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
    const countEl = dock.querySelector('#app-mobile-dock-cart-count');
    if (countEl) {
        const previous = Number(countEl.dataset.prevCount || 0);
        countEl.textContent = String(count);
        countEl.classList.toggle('hidden', count <= 0);

        if (count > previous) {
            countEl.classList.remove('cart-badge-bump');
            void countEl.offsetWidth;
            countEl.classList.add('cart-badge-bump');
        }

        countEl.dataset.prevCount = String(count);
    }

    const accountLink = dock.querySelector('[data-dock-key="account"]');
    if (accountLink) {
        accountLink.textContent = getCurrentUser() ? 'Account' : 'Login';
    }
}

function initMobileQuickDock() {
    let dock = document.getElementById('app-mobile-dock');
    if (!dock) {
        dock = document.createElement('nav');
        dock.id = 'app-mobile-dock';
        dock.className = 'mobile-quick-dock';
        dock.setAttribute('aria-label', 'Quick mobile navigation');
        document.body.appendChild(dock);
    }

    const items = getMobileQuickDockItems();
    const signature = items.map(item => item.key).join('|');

    if (!mobileQuickDockInitialized || mobileQuickDockSignature !== signature) {
        mobileQuickDockInitialized = true;
        mobileQuickDockSignature = signature;

        dock.innerHTML = items.map(item => {
            const cartBadge = item.key === 'cart'
                ? '<span id="app-mobile-dock-cart-count" class="mobile-dock-count hidden">0</span>'
                : '';
            return `<a href="${item.href}" class="mobile-dock-link" data-dock-key="${item.key}">${item.label}${cartBadge}</a>`;
        }).join('');
    }

    document.body.classList.add('has-mobile-dock');
    syncMobileQuickDockState();
}

function getThemeFxMode() {
    const stored = String(localStorage.getItem('site_theme_fx_mode') || '').trim().toLowerCase();
    if (stored === 'party' || stored === 'premium') {
        return stored;
    }
    return 'default';
}

function applyThemeFxMode(mode) {
    const normalized = String(mode || '').trim().toLowerCase();
    const safeMode = normalized === 'party' || normalized === 'premium' ? normalized : 'default';

    if (safeMode === 'default') {
        document.body.removeAttribute('data-theme-mode');
        localStorage.removeItem('site_theme_fx_mode');
    } else {
        document.body.dataset.themeMode = safeMode;
        localStorage.setItem('site_theme_fx_mode', safeMode);
    }

    const toggle = document.getElementById('app-theme-fx-toggle');
    if (toggle) {
        toggle.querySelectorAll('[data-theme-mode-option]').forEach(button => {
            const option = String(button.getAttribute('data-theme-mode-option') || '').trim().toLowerCase();
            button.classList.toggle('active', option === safeMode);
            button.setAttribute('aria-pressed', option === safeMode ? 'true' : 'false');
        });
    }
}

function initThemeFxToggle() {
    if (themeFxToggleInitialized) return;
    themeFxToggleInitialized = true;

    let toggle = document.getElementById('app-theme-fx-toggle');
    if (!toggle) {
        toggle = document.createElement('div');
        toggle.id = 'app-theme-fx-toggle';
        toggle.className = 'theme-fx-toggle';
        toggle.innerHTML = [
            '<strong class="theme-fx-title">Visual Mode</strong>',
            '<div class="theme-fx-actions">',
            '<button type="button" class="theme-fx-btn" data-theme-mode-option="default" aria-pressed="true">Classic</button>',
            '<button type="button" class="theme-fx-btn" data-theme-mode-option="party" aria-pressed="false">Party</button>',
            '<button type="button" class="theme-fx-btn" data-theme-mode-option="premium" aria-pressed="false">Premium</button>',
            '</div>'
        ].join('');
        document.body.appendChild(toggle);
    }

    if (!toggle.dataset.bound) {
        toggle.dataset.bound = '1';
        toggle.addEventListener('click', event => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const button = target.closest('[data-theme-mode-option]');
            if (!(button instanceof HTMLElement)) return;

            const mode = button.getAttribute('data-theme-mode-option') || 'default';
            applyThemeFxMode(mode);
        });
    }

    applyThemeFxMode(getThemeFxMode());
}

function initSectionParallaxEntrances() {
    if (sectionParallaxInitialized) return;
    sectionParallaxInitialized = true;

    const sections = Array.from(document.querySelectorAll('section, .page-header'));
    if (!sections.length) return;

    const staggerSelector = [
        '.highlight-card',
        '.info-card',
        '.feature',
        '.menu-item',
        '.cart-item',
        '.checkout-form',
        '.order-summary',
        '.auth-form',
        '.profile-section-box',
        '.restaurant-order-card',
        '.restaurant-menu-item',
        '.form-section',
        '.page-header h1',
        '.page-header p'
    ].join(',');

    sections.forEach((section, sectionIndex) => {
        if (!(section instanceof HTMLElement)) return;

        section.classList.add('section-parallax-target');
        section.style.setProperty('--section-index', String(sectionIndex));

        const staggerItems = section.querySelectorAll(staggerSelector);
        staggerItems.forEach((item, itemIndex) => {
            if (!(item instanceof HTMLElement)) return;
            if (item.dataset.sectionStaggerBound === '1') return;

            item.dataset.sectionStaggerBound = '1';
            item.classList.add('section-stagger-item');
            item.style.setProperty('--stagger-delay', `${Math.min(itemIndex, 12) * 65}ms`);
        });
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion && typeof window.IntersectionObserver !== 'undefined') {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in-view');
            });
        }, {
            threshold: 0.14,
            rootMargin: '0px 0px -30px 0px'
        });

        sections.forEach(section => {
            observer.observe(section);
        });
    } else {
        sections.forEach(section => section.classList.add('in-view'));
    }

    const updateParallax = () => {
        sections.forEach(section => {
            if (!(section instanceof HTMLElement)) return;
            const rect = section.getBoundingClientRect();
            const viewportCenter = window.innerHeight * 0.5;
            const sectionCenter = rect.top + (rect.height * 0.5);
            const distanceRatio = (sectionCenter - viewportCenter) / Math.max(window.innerHeight, 1);
            const clamped = Math.max(-0.8, Math.min(0.8, distanceRatio));
            const offset = clamped * 22;
            section.style.setProperty('--parallax-offset', `${offset.toFixed(2)}px`);
        });

        sectionParallaxTicking = false;
    };

    const requestParallaxUpdate = () => {
        if (sectionParallaxTicking) return;
        sectionParallaxTicking = true;
        window.requestAnimationFrame(updateParallax);
    };

    if (!prefersReducedMotion) {
        window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
        window.addEventListener('resize', requestParallaxUpdate);
        requestParallaxUpdate();
    }
}

function initEnhancedSiteExperience() {
    document.body.classList.add('app-ready');
    initPageEnhancementProfile();
    initThemeFxToggle();
    initMobileNavDrawer();
    initMobileGestureEnhancements();
    initMobileQuickDock();
    initSectionParallaxEntrances();
    initConnectivityIndicator();
    initInternalPageTransitions();
    initNavbarScrollState();
    initScrollProgressBar();
    initBackToTopButton();
    initScrollReveal();
    initHeroStatCounters();
    initKeyboardShortcuts();
}

function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('currentUser', user);
    } else {
        localStorage.removeItem('currentUser');
    }
}

function getUserData(email) {
    const normalizedEmail = normalizeEmail(email);
    const users = getUsers();
    return users.find(u => normalizeEmail(u.email) === normalizedEmail);
}

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeLoginIdentifier(value) {
    return String(value || '').trim().toLowerCase();
}

function isDefaultRestaurantAdminLogin(identifier, password) {
    const normalizedIdentifier = normalizeLoginIdentifier(identifier);
    const normalizedPassword = String(password || '').trim();

    return normalizedPassword === DEFAULT_RESTAURANT_ADMIN.password
        && (
            normalizedIdentifier === DEFAULT_RESTAURANT_ADMIN.username
            || normalizedIdentifier === normalizeEmail(DEFAULT_RESTAURANT_ADMIN.email)
        );
}

function ensureDefaultRestaurantAdminUser(passwordHint) {
    const users = getUsers();
    const normalizedAdminEmail = normalizeEmail(DEFAULT_RESTAURANT_ADMIN.email);
    const existingIndex = users.findIndex(entry => normalizeEmail(entry?.email) === normalizedAdminEmail);
    const createdDate = new Date().toLocaleDateString();

    const adminUser = {
        ...(existingIndex >= 0 ? users[existingIndex] : {}),
        name: DEFAULT_RESTAURANT_ADMIN.name,
        email: normalizedAdminEmail,
        password: String(passwordHint || DEFAULT_RESTAURANT_ADMIN.password),
        role: 'restaurant',
        isRestaurantStaff: true,
        created: existingIndex >= 0 ? users[existingIndex].created || createdDate : createdDate,
        orders: Array.isArray(users[existingIndex]?.orders) ? users[existingIndex].orders : [],
        addresses: Array.isArray(users[existingIndex]?.addresses) ? users[existingIndex].addresses : [],
        preferences: {
            newsletter: users[existingIndex]?.preferences?.newsletter !== false,
            promotions: users[existingIndex]?.preferences?.promotions !== false
        }
    };

    if (existingIndex >= 0) {
        users[existingIndex] = adminUser;
    } else {
        users.push(adminUser);
    }

    saveUsers(users);
    return adminUser;
}

function ensureRestaurantDashboardTokenForPrivilegedUser() {
    const existingToken = String(localStorage.getItem('restaurant_dashboard_token') || ORDER_WORKFLOW_CONFIG.restaurantToken || '').trim();
    if (existingToken) {
        ORDER_WORKFLOW_CONFIG.restaurantToken = existingToken;
        return existingToken;
    }

    if (!currentUserCanAccessRestaurantDashboard()) {
        return '';
    }

    ORDER_WORKFLOW_CONFIG.restaurantToken = DEFAULT_RESTAURANT_DASHBOARD_TOKEN;
    localStorage.setItem('restaurant_dashboard_token', DEFAULT_RESTAURANT_DASHBOARD_TOKEN);
    return DEFAULT_RESTAURANT_DASHBOARD_TOKEN;
}

function getRestaurantStaffEmails() {
    return String(RESTAURANT_ACCESS_CONFIG.staffEmails || '')
        .split(',')
        .map(value => value.trim().toLowerCase())
        .filter(Boolean);
}

function getRestaurantInviteCode() {
    return String(RESTAURANT_ACCESS_CONFIG.inviteCode || '').trim();
}

async function postAuthJson(path, payload) {
    const response = await fetch(buildOrderApiUrl(path), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload || {})
    });

    let result = {};
    try {
        result = await response.json();
    } catch (error) {
        result = {};
    }

    if (!response.ok || !result?.ok) {
        throw new Error(result?.message || `Request failed (${response.status}).`);
    }

    return result;
}

function toClientUser(serverUser) {
    return {
        name: String(serverUser?.name || 'Customer').trim(),
        email: normalizeEmail(serverUser?.email),
        phone: String(serverUser?.phone || '').trim(),
        role: String(serverUser?.role || 'customer').trim().toLowerCase(),
        isRestaurantStaff: serverUser?.isRestaurantStaff === true,
        created: String(serverUser?.created || new Date().toLocaleDateString()),
        orders: Array.isArray(serverUser?.orders) ? serverUser.orders : [],
        addresses: Array.isArray(serverUser?.addresses) ? serverUser.addresses : [],
        preferences: {
            newsletter: serverUser?.preferences?.newsletter !== false,
            promotions: serverUser?.preferences?.promotions !== false
        }
    };
}

function upsertLocalUserFromServer(serverUser, passwordHint = '') {
    const normalizedEmail = normalizeEmail(serverUser?.email);
    if (!normalizedEmail) return null;

    const users = getUsers();
    const existingIndex = users.findIndex(entry => normalizeEmail(entry.email) === normalizedEmail);
    const existingUser = existingIndex >= 0 ? users[existingIndex] : null;
    const clientUser = toClientUser(serverUser);

    const mergedUser = {
        ...existingUser,
        ...clientUser,
        email: normalizedEmail,
        phone: String(clientUser?.phone || existingUser?.phone || '').trim(),
        password: existingUser?.password || String(passwordHint || '')
    };

    if (existingIndex >= 0) {
        users[existingIndex] = mergedUser;
    } else {
        users.push(mergedUser);
    }

    saveUsers(users);
    return mergedUser;
}

function updateLocalPasswordCache(email, nextPassword) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !nextPassword) return;

    const users = getUsers();
    const userIndex = users.findIndex(entry => normalizeEmail(entry.email) === normalizedEmail);
    if (userIndex < 0) return;

    users[userIndex].password = String(nextPassword);
    saveUsers(users);
}

function currentUserCanAccessRestaurantDashboard() {
    const currentUser = String(getCurrentUser() || '').trim();
    if (!currentUser) return false;

    const normalizedCurrentUser = normalizeEmail(currentUser);
    const users = getUsers();
    const user = users.find(entry => normalizeEmail(entry?.email) === normalizedCurrentUser);
    if (user?.isRestaurantStaff === true) return true;

    const normalizedRole = String(user?.role || '').trim().toLowerCase();
    if (normalizedRole === 'restaurant' || normalizedRole === 'admin' || normalizedRole === 'staff') {
        return true;
    }

    const staffEmails = getRestaurantStaffEmails();
    return staffEmails.includes(normalizedCurrentUser);
}

function updateRestaurantNavVisibility() {
    const links = document.querySelectorAll('a[href="restaurant.html"]');
    const canAccess = currentUserCanAccessRestaurantDashboard();

    links.forEach(link => {
        const navItem = link.closest('li');
        if (navItem) {
            navItem.style.display = canAccess ? '' : 'none';
        }
        link.tabIndex = canAccess ? 0 : -1;
        link.setAttribute('aria-hidden', canAccess ? 'false' : 'true');
    });
}

function getMenuVisualMarkup(item, wrapperClassName, imageClassName) {
    const wrapperClass = String(wrapperClassName || 'menu-item-image');
    const imageClass = String(imageClassName || 'menu-item-photo');
    const normalizedImage = normalizeMenuImage(item?.image);

    if (normalizedImage) {
        return [
            `<div class="${wrapperClass} has-photo">`,
            `<img src="${escapeHtml(normalizedImage)}" alt="${escapeHtml(item?.name || 'Menu item')}" class="${imageClass}" loading="lazy">`,
            '</div>'
        ].join('');
    }

    return `<div class="${wrapperClass}">${escapeHtml(item?.emoji || '🍽️')}</div>`;
}

function renderMenuVisualIntoElement(element, item, imageClassName = 'menu-modal-photo') {
    if (!(element instanceof HTMLElement)) return;

    const normalizedImage = normalizeMenuImage(item?.image);
    if (!normalizedImage) {
        element.classList.remove('has-photo');
        element.textContent = String(item?.emoji || '🍽️');
        return;
    }

    element.classList.add('has-photo');
    element.innerHTML = `<img src="${escapeHtml(normalizedImage)}" alt="${escapeHtml(item?.name || 'Menu item')}" class="${imageClassName}" loading="lazy">`;
}

function enforceRestaurantPageAccess() {
    const currentPage = (window.location.pathname || '').toLowerCase();
    const isRestaurantPage = currentPage.endsWith('/restaurant.html') || currentPage.endsWith('restaurant.html');

    if (!isRestaurantPage) return;

    if (!currentUserCanAccessRestaurantDashboard()) {
        alert('Restaurant dashboard access is only available to restaurant staff accounts.');
        window.location.href = 'index.html';
    }
}

// ==================== 
// MENU FUNCTIONS
// ====================

function renderMenuLoadingSkeleton(cardCount = 6) {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;

    const safeCount = Math.max(3, Math.min(10, Number(cardCount) || 6));
    const cards = Array.from({ length: safeCount }).map(() => {
        return [
            '<div class="menu-item menu-item-skeleton" aria-hidden="true">',
            '<div class="menu-item-image skeleton-shimmer"></div>',
            '<div class="menu-item-content">',
            '<div class="skeleton-line skeleton-shimmer" style="width: 70%;"></div>',
            '<div class="skeleton-line skeleton-shimmer" style="width: 95%;"></div>',
            '<div class="skeleton-line skeleton-shimmer" style="width: 85%;"></div>',
            '<div class="menu-item-footer">',
            '<span class="skeleton-line skeleton-shimmer" style="width: 35%; height: 16px;"></span>',
            '<span class="skeleton-line skeleton-shimmer" style="width: 26%; height: 34px; border-radius: 8px;"></span>',
            '</div>',
            '</div>',
            '</div>'
        ].join('');
    }).join('');

    menuGrid.innerHTML = cards;
}

function renderMenuItems(menuGrid, items) {
    if (!menuGrid) return;

    if (items.length === 0) {
        menuGrid.innerHTML = '<div class="empty-cart"><p>No menu item found for your search. Try another keyword.</p></div>';
        return;
    }

    menuGrid.innerHTML = items.map(item => {
        return [
            `<div class="menu-item" onclick="openItemModal(${item.id})">`,
            getMenuVisualMarkup(item, 'menu-item-image', 'menu-item-photo'),
            '<div class="menu-item-content">',
            `<div class="menu-item-name">${item.name}</div>`,
            `<div class="menu-item-description">${item.description}</div>`,
            '<div class="menu-item-footer">',
            `<span class="menu-item-price">₦${item.price.toFixed(2)}</span>`,
            `<button class="menu-item-btn" onclick="event.stopPropagation(); addToCart(${item.id}, 1)">Add</button>`,
            '</div>',
            '</div>',
            '</div>'
        ].join('');
    }).join('');

    queueScrollRevealTargets(menuGrid);
}

function displayMenu(category = menuViewState.category, options = {}) {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;

    const normalizedOptions = options && typeof options === 'object' ? options : {};
    const shouldUseSkeleton = normalizedOptions.showSkeleton === true || menuGrid.dataset.initialized !== '1';
    const renderRequestId = ++menuRenderRequestCounter;

    menuViewState.category = category;
    
    let items = category === 'all'
        ? [...menuData]
        : menuData.filter(item => item.category === category);

    const searchTerm = menuViewState.search.trim().toLowerCase();
    if (searchTerm) {
        items = items.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
    }

    switch (menuViewState.sort) {
        case 'price-asc':
            items.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            items.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            items.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            break;
    }

    const renderItems = () => {
        if (renderRequestId !== menuRenderRequestCounter) return;
        renderMenuItems(menuGrid, items);
        menuGrid.dataset.initialized = '1';
    };

    if (shouldUseSkeleton) {
        renderMenuLoadingSkeleton(Math.min(Math.max(items.length, 4), 8));
        window.setTimeout(renderItems, 160);
        return;
    }

    renderItems();
}

function filterMenu(category, clickedButton = null) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    displayMenu(category);
}

function handleMenuSearch(searchValue) {
    menuViewState.search = searchValue || '';
    displayMenu(menuViewState.category);
}

function handleMenuSort(sortValue) {
    menuViewState.sort = sortValue || 'default';
    displayMenu(menuViewState.category);
}

function openItemModal(itemId) {
    const item = menuData.find(m => m.id === itemId);
    if (!item) return;
    
    document.getElementById('modal-name').textContent = item.name;
    document.getElementById('modal-description').textContent = item.description;
    document.getElementById('modal-price').textContent = item.price.toFixed(2);
    document.getElementById('modal-calories').textContent = item.calories;
    const modalImage = document.getElementById('modal-image');
    if (modalImage) {
        renderMenuVisualIntoElement(modalImage, item, 'menu-modal-photo');
    }
    document.getElementById('quantity').value = 1;
    
    // Store current item ID for add to cart
    document.getElementById('modal-name').dataset.itemId = itemId;
    
    const modal = document.getElementById('item-modal');
    modal.classList.add('active');
}

function closeItemModal() {
    const modal = document.getElementById('item-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

window.addEventListener('click', function(event) {
    const modal = document.getElementById('item-modal');
    if (modal && event.target === modal) {
        modal.classList.remove('active');
    }
});

// ==================== 
// CART FUNCTIONS
// ====================

function addToCart(itemId, quantity = null) {
    // Modal add button calls addToCart() with no args, so recover selected item id.
    if (itemId === undefined || itemId === null) {
        const modalName = document.getElementById('modal-name');
        const fallbackId = parseInt(modalName?.dataset?.itemId || '', 10);
        itemId = Number.isFinite(fallbackId) ? fallbackId : null;
    }

    const item = menuData.find(m => m.id === itemId);
    if (!item) return;
    
    // If quantity is null, get from modal input
    if (quantity === null) {
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            quantity = parseInt(quantityInput.value) || 1;
        } else {
            quantity = 1;
        }
    }

    quantity = Number.isFinite(Number(quantity)) ? Math.floor(Number(quantity)) : 1;
    if (quantity < 1) quantity = 1;
    
    let cart = getCart();
    const existingItem = cart.find(c => c.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: itemId,
            name: item.name,
            price: item.price,
            quantity: quantity,
            emoji: item.emoji,
            image: normalizeMenuImage(item.image)
        });
    }
    
    saveCart(cart);
    updateCartCount();
    closeItemModal();
    showNotification(`${item.name} added to cart!`);
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('#cart-count');
    const previousCount = Number(updateCartCount._lastCount || 0);

    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';

        if (count > previousCount) {
            badge.classList.remove('cart-badge-bump');
            void badge.offsetWidth;
            badge.classList.add('cart-badge-bump');
        }
    });

    updateCartCount._lastCount = count;
    syncMobileQuickDockState();
}

function displayCart() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    
    const cart = getCart();
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart"><p>Your cart is empty</p><a href="menu.html" class="btn btn-primary">Continue Shopping</a></div>';
        return;
    }
    
    container.innerHTML = '';
    
    cart.forEach(item => {
        const html = `
            <div class="cart-item">
                ${getMenuVisualMarkup(item, 'cart-item-image', 'cart-item-photo')}
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₦${item.price.toFixed(2)} each</div>
                    <div class="cart-item-actions">
                        <button onclick="updateCartItem(${item.id}, -1)">-</button>
                        <span style="padding: 4px 8px; background-color: #f0f0f0; border-radius: 3px;">${item.quantity}</span>
                        <button onclick="updateCartItem(${item.id}, 1)">+</button>
                        <button onclick="removeFromCart(${item.id})" style="background-color: #ffcccc; color: #c00;">Remove</button>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: bold; color: var(--primary-color);">₦${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });

    queueScrollRevealTargets(container);
}

function updateCartItem(itemId, change) {
    let cart = getCart();
    const item = cart.find(c => c.id === itemId);
    
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(itemId);
            return;
        }
        saveCart(cart);
        updateCartCount();
        displayCart();
        calculateTotals();
    }
}

function removeFromCart(itemId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== itemId);
    saveCart(cart);
    updateCartCount();
    displayCart();
    calculateTotals();
}

function calculateTotals() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const delivery = subtotal > 0 ? 5 : 0;
    const total = subtotal + tax + delivery;
    
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const deliveryEl = document.getElementById('delivery');
    const totalEl = document.getElementById('total');
    
    // Currency sign is already in the HTML wrappers, so set plain numeric text only.
    if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
    if (taxEl) taxEl.textContent = tax.toFixed(2);
    if (deliveryEl) deliveryEl.textContent = delivery.toFixed(2);
    if (totalEl) totalEl.textContent = total.toFixed(2);
    
    return { subtotal, tax, delivery, total };
}

function proceedToCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    window.location.href = 'checkout.html';
}

// ==================== 
// CHECKOUT FUNCTIONS
// ====================

function displayCheckoutSummary() {
    const cart = getCart();
    const summaryContainer = document.getElementById('summary-items');
    
    if (!summaryContainer) return;
    
    summaryContainer.innerHTML = '';
    
    cart.forEach(item => {
        const html = `
            <div class="summary-item-checkout">
                <span>${item.name} x${item.quantity}</span>
                <span>₦${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `;
        summaryContainer.innerHTML += html;
    });

    queueScrollRevealTargets(summaryContainer);
    
    updateCheckoutTotals();
}

function updateCheckoutTotals() {
    const { subtotal, tax, delivery, total } = calculateTotals();
    
    const subtotalEl = document.getElementById('summary-subtotal');
    const taxEl = document.getElementById('summary-tax');
    const deliveryEl = document.getElementById('summary-delivery');
    const totalEl = document.getElementById('summary-total');
    
    if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
    if (taxEl) taxEl.textContent = tax.toFixed(2);
    if (deliveryEl) deliveryEl.textContent = delivery.toFixed(2);
    if (totalEl) totalEl.textContent = total.toFixed(2);
}

function getSelectedPaymentMethod() {
    const selected = document.querySelector('input[name="payment"]:checked');
    return selected ? selected.value : 'cash';
}

function setPaymentStatus(message, state = 'pending') {
    const statusEl = document.getElementById('payment-status');
    if (!statusEl) return;

    statusEl.className = `payment-status ${state}`;
    statusEl.textContent = message;
}

function resetPaymentVerificationState(paymentMethod) {
    paymentVerificationState.required = paymentMethod === 'card' || paymentMethod === 'bank-transfer';
    paymentVerificationState.confirmed = false;
    paymentVerificationState.method = paymentMethod;
    paymentVerificationState.reference = '';
    paymentVerificationState.provider = '';
    paymentVerificationState.verifiedAt = 0;
    paymentVerificationState.amount = 0;
}

function setPaymentVerificationSuccess({ method, reference, provider, amount }) {
    paymentVerificationState.required = method === 'card' || method === 'bank-transfer';
    paymentVerificationState.confirmed = true;
    paymentVerificationState.method = method;
    paymentVerificationState.reference = reference || '';
    paymentVerificationState.provider = provider || '';
    paymentVerificationState.verifiedAt = Date.now();
    paymentVerificationState.amount = Number(amount || 0);

    const methodLabel = method === 'card' ? 'Card payment' : 'Bank transfer';
    setPaymentStatus(`${methodLabel} verified successfully. You can place your order now.`, 'success');
    updatePlaceOrderButtonState();
}

function updatePlaceOrderButtonState() {
    const placeOrderButton = document.getElementById('place-order-btn');
    if (!placeOrderButton) return;

    const paymentMethod = getSelectedPaymentMethod();
    const needsVerification = paymentMethod === 'card' || paymentMethod === 'bank-transfer';
    const isVerified = paymentVerificationState.confirmed && paymentVerificationState.method === paymentMethod;

    placeOrderButton.disabled = needsVerification && !isVerified;
    placeOrderButton.title = needsVerification && !isVerified
        ? 'Confirm payment first before placing order'
        : '';
}

function getCheckoutDraft() {
    try {
        const raw = localStorage.getItem(CHECKOUT_DRAFT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
        return null;
    }
}

function persistCheckoutDraft() {
    const deliveryForm = document.getElementById('delivery-form');
    if (!deliveryForm) return;

    const draft = {
        fullname: document.getElementById('fullname')?.value.trim() || '',
        email: document.getElementById('email')?.value.trim() || '',
        phone: document.getElementById('phone')?.value.trim() || '',
        address: document.getElementById('address')?.value.trim() || '',
        landmark: document.getElementById('landmark')?.value.trim() || '',
        district: document.getElementById('district')?.value.trim() || '',
        subdistrict: document.getElementById('subdistrict')?.value.trim() || '',
        city: document.getElementById('city')?.value.trim() || '',
        zip: document.getElementById('zip')?.value.trim() || '',
        instructions: document.getElementById('instructions')?.value.trim() || '',
        savedAt: Date.now()
    };

    try {
        localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
        // Ignore quota/privacy mode issues; checkout remains functional.
    }
}

function restoreCheckoutDraft() {
    const draft = getCheckoutDraft();
    if (!draft) return;

    const map = [
        ['fullname', draft.fullname],
        ['email', draft.email],
        ['phone', draft.phone],
        ['address', draft.address],
        ['landmark', draft.landmark],
        ['district', draft.district],
        ['subdistrict', draft.subdistrict],
        ['city', draft.city],
        ['zip', draft.zip],
        ['instructions', draft.instructions]
    ];

    map.forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (!input) return;
        if (!String(input.value || '').trim() && String(value || '').trim()) {
            input.value = String(value);
        }
    });
}

function clearCheckoutDraft() {
    localStorage.removeItem(CHECKOUT_DRAFT_KEY);
}

function initCheckoutDraftAutosave() {
    const deliveryForm = document.getElementById('delivery-form');
    if (!deliveryForm || deliveryForm.dataset.draftBound) return;

    deliveryForm.dataset.draftBound = '1';
    deliveryForm.addEventListener('input', persistCheckoutDraft);

    const instructionsInput = document.getElementById('instructions');
    if (instructionsInput) {
        instructionsInput.addEventListener('input', persistCheckoutDraft);
    }
}

function collectCheckoutCustomerData() {
    const fullname = document.getElementById('fullname')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const phone = document.getElementById('phone')?.value.trim() || '';
    const address = document.getElementById('address')?.value.trim() || '';
    const landmark = document.getElementById('landmark')?.value.trim() || '';
    const district = document.getElementById('district')?.value.trim() || '';
    const subDistrict = document.getElementById('subdistrict')?.value.trim() || '';
    const city = document.getElementById('city')?.value.trim() || '';
    const zip = document.getElementById('zip')?.value.trim() || '';
    const instructions = document.getElementById('instructions')?.value.trim() || '';
    const transferReference = document.getElementById('transfer-reference')?.value.trim() || '';
    const transferSender = document.getElementById('transfer-sender')?.value.trim() || '';

    return {
        fullname,
        email,
        phone,
        address,
        landmark,
        district,
        subDistrict,
        city,
        zip,
        instructions,
        transferReference,
        transferSender
    };
}

function validateCheckoutInputs(paymentMethod, customerData, options = {}) {
    const allowMissingTransferReference = Boolean(options.allowMissingTransferReference);

    if (!customerData.fullname || !customerData.phone || !customerData.address || !customerData.district || !customerData.subDistrict || !customerData.city) {
        alert('Please fill in all delivery information');
        return false;
    }

    const cart = getCart();
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return false;
    }

    if (paymentMethod === 'bank-transfer') {
        if (!allowMissingTransferReference && !customerData.transferReference) {
            alert('Please enter your bank transfer reference');
            return false;
        }

        if (!allowMissingTransferReference && customerData.transferReference.length < 5) {
            alert('Transfer reference looks too short. Please check and try again.');
            return false;
        }
    }

    if (paymentMethod === 'card' && !customerData.email) {
        alert('Email is required for card payment verification.');
        return false;
    }

    if (paymentMethod !== 'cash' && paymentMethod !== 'bank-transfer' && paymentMethod !== 'card') {
        alert('Please select a valid payment method');
        return false;
    }

    return true;
}

function setPaymentActionBusy(buttonId, isBusy, busyText) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (!button.dataset.defaultText) {
        button.dataset.defaultText = button.textContent;
    }

    button.disabled = isBusy;
    button.textContent = isBusy ? busyText : button.dataset.defaultText;
}

function getPaymentVerificationEndpoint() {
    return PAYMENT_GATEWAY_CONFIG.verificationEndpoint;
}

function getOrderApiBaseUrl() {
    return String(ORDER_WORKFLOW_CONFIG.baseUrl || '').replace(/\/+$/, '');
}

function buildOrderApiUrl(path) {
    const baseUrl = getOrderApiBaseUrl();
    if (!baseUrl) {
        throw new Error('Order workflow API base URL is not configured. Set window.ORDER_API_BASE_URL or localStorage key order_api_base_url.');
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
}

function normalizeOrderStatusValue(status) {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'pending') return 'pending_restaurant_confirmation';
    if (normalized === 'ready') return 'ready_for_dispatch';
    if (normalized === 'out' || normalized === 'on_the_way') return 'out_for_delivery';
    if (ORDER_STATUS_LABELS[normalized]) return normalized;
    return 'pending_restaurant_confirmation';
}

function getOrderStatusLabel(status) {
    return ORDER_STATUS_LABELS[normalizeOrderStatusValue(status)] || 'Pending Restaurant Confirmation';
}

function isTerminalOrderStatus(status) {
    const normalized = normalizeOrderStatusValue(status);
    return normalized === 'delivered' || normalized === 'rejected' || normalized === 'cancelled';
}

function isLikelyConnectivityError(error) {
    const message = String(error?.message || '').toLowerCase();
    if (!message) return false;

    return (
        message.includes('failed to fetch') ||
        message.includes('networkerror') ||
        message.includes('network request failed') ||
        message.includes('load failed') ||
        message.includes('could not connect') ||
        message.includes('err_connection')
    );
}

function buildLocalOfflineOrder(payload) {
    const nowIso = new Date().toISOString();
    return {
        id: `OFFLINE-${Date.now()}`,
        createdAt: nowIso,
        updatedAt: nowIso,
        customer: payload.customer || 'Guest',
        email: payload.email || '',
        phone: payload.phone || '',
        address: payload.address || '',
        landmark: payload.landmark || '',
        district: payload.district || '',
        subDistrict: payload.subDistrict || '',
        city: payload.city || '',
        zip: payload.zip || '',
        items: Array.isArray(payload.items) ? payload.items : [],
        subtotal: Number(payload.subtotal || 0),
        tax: Number(payload.tax || 0),
        delivery: Number(payload.delivery || 0),
        total: Number(payload.total || 0),
        paymentMethod: payload.paymentMethod || 'Cash on Delivery',
        paymentReference: payload.paymentReference || '',
        paymentProvider: payload.paymentProvider || '',
        paymentVerifiedAt: payload.paymentVerifiedAt || '',
        transferReference: payload.transferReference || '',
        transferSender: payload.transferSender || '',
        instructions: payload.instructions || '',
        status: 'pending_restaurant_confirmation',
        statusHistory: [
            {
                status: 'pending_restaurant_confirmation',
                actor: 'customer',
                note: 'Order saved locally while server connection is unavailable.',
                at: nowIso
            }
        ],
        restaurantNotified: false,
        restaurantNotificationError: 'Server unreachable during checkout.',
        restaurantMessageId: '',
        isLocalOnly: true
    };
}

function normalizeOrderForRestaurantCache(rawOrder) {
    if (!rawOrder || !rawOrder.id) return null;

    const createdAt = String(rawOrder.createdAt || new Date().toISOString());
    const updatedAt = String(rawOrder.updatedAt || createdAt);
    const normalizedStatus = normalizeOrderStatusValue(rawOrder.status);

    return {
        ...rawOrder,
        id: String(rawOrder.id),
        createdAt,
        updatedAt,
        status: normalizedStatus,
        items: Array.isArray(rawOrder.items) ? rawOrder.items : [],
        total: Number(rawOrder.total || 0),
        isLocalOnly: rawOrder.isLocalOnly === true
    };
}

function sortOrdersByNewest(orders) {
    return [...orders].sort((a, b) => Date.parse(b?.createdAt || '') - Date.parse(a?.createdAt || ''));
}

function applyRestaurantOrderStatusFilter(orders, statusFilter) {
    const normalizedFilter = normalizeOrderStatusValue(statusFilter);
    if (!statusFilter || statusFilter === 'all') {
        return sortOrdersByNewest(orders);
    }

    return sortOrdersByNewest(orders.filter(order => normalizeOrderStatusValue(order.status) === normalizedFilter));
}

function getLocalRestaurantOrderCache() {
    try {
        const raw = localStorage.getItem(LOCAL_RESTAURANT_ORDER_CACHE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map(entry => normalizeOrderForRestaurantCache(entry))
            .filter(Boolean);
    } catch (error) {
        return [];
    }
}

function saveLocalRestaurantOrderCache(orders) {
    const normalized = (Array.isArray(orders) ? orders : [])
        .map(entry => normalizeOrderForRestaurantCache(entry))
        .filter(Boolean);

    try {
        localStorage.setItem(LOCAL_RESTAURANT_ORDER_CACHE_KEY, JSON.stringify(sortOrdersByNewest(normalized)));
    } catch (error) {
        // Ignore storage quota/privacy mode errors and keep in-memory rendering.
    }
}

function upsertLocalRestaurantOrderCache(order) {
    const normalized = normalizeOrderForRestaurantCache(order);
    if (!normalized) return;

    const cache = getLocalRestaurantOrderCache();
    const index = cache.findIndex(entry => entry.id === normalized.id);
    if (index >= 0) {
        cache[index] = {
            ...cache[index],
            ...normalized,
            isLocalOnly: normalized.isLocalOnly === true || cache[index].isLocalOnly === true
        };
    } else {
        cache.push(normalized);
    }

    saveLocalRestaurantOrderCache(cache);
}

function mergeRestaurantOrderSets(primaryOrders, secondaryOrders) {
    const mergedById = new Map();
    [...(secondaryOrders || []), ...(primaryOrders || [])]
        .map(entry => normalizeOrderForRestaurantCache(entry))
        .filter(Boolean)
        .forEach(order => {
            const existing = mergedById.get(order.id);
            if (!existing) {
                mergedById.set(order.id, order);
                return;
            }

            mergedById.set(order.id, {
                ...existing,
                ...order,
                isLocalOnly: order.isLocalOnly === true && existing.isLocalOnly === true
            });
        });

    return sortOrdersByNewest(Array.from(mergedById.values()));
}

function updateLocalRestaurantOrderStatus(orderId, nextStatus) {
    const cache = getLocalRestaurantOrderCache();
    const index = cache.findIndex(order => String(order.id) === String(orderId));
    if (index < 0) return false;

    const currentOrder = cache[index];
    const allowedNextStatuses = getRestaurantNextStatuses(currentOrder.status);
    if (!allowedNextStatuses.includes(nextStatus)) {
        return false;
    }

    cache[index] = {
        ...currentOrder,
        status: normalizeOrderStatusValue(nextStatus),
        updatedAt: new Date().toISOString(),
        isLocalOnly: true,
        statusHistory: [
            ...(Array.isArray(currentOrder.statusHistory) ? currentOrder.statusHistory : []),
            {
                status: normalizeOrderStatusValue(nextStatus),
                actor: 'restaurant',
                note: `Updated locally while server was unreachable (${nextStatus}).`,
                at: new Date().toISOString()
            }
        ]
    };

    saveLocalRestaurantOrderCache(cache);
    return true;
}

async function createOrderOnServer(payload) {
    try {
        const response = await fetch(buildOrderApiUrl('/orders'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok || !result?.ok || !result?.order) {
            throw new Error(result?.message || `Order creation failed (${response.status}).`);
        }

        result.order.status = normalizeOrderStatusValue(result.order.status);
        return result;
    } catch (error) {
        if (!isLikelyConnectivityError(error)) {
            throw error;
        }

        return {
            ok: true,
            offlineMode: true,
            message: 'Order saved locally because the order server is currently offline.',
            order: buildLocalOfflineOrder(payload)
        };
    }
}

async function fetchOrderById(orderId) {
    const response = await fetch(buildOrderApiUrl(`/orders/${encodeURIComponent(orderId)}`), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const result = await response.json();
    if (!response.ok || !result?.ok || !result?.order) {
        throw new Error(result?.message || `Order lookup failed (${response.status}).`);
    }

    result.order.status = normalizeOrderStatusValue(result.order.status);
    return result.order;
}

async function verifyPaymentWithServer(payload) {
    const endpoint = getPaymentVerificationEndpoint();
    if (!endpoint) {
        throw new Error('Payment verification endpoint is not configured. Set window.PAYMENT_VERIFY_ENDPOINT or localStorage key payment_verify_endpoint.');
    }

    let response;
    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        if (isLikelyConnectivityError(error)) {
            throw new Error('Cannot reach payment verification server. Start the backend on port 8787 or set PAYMENT_VERIFY_ENDPOINT to a reachable API URL.');
        }
        throw error;
    }

    if (!response.ok) {
        throw new Error(`Verification request failed (${response.status}).`);
    }

    const result = await response.json();
    if (!result || result.verified !== true) {
        throw new Error(result?.message || 'Payment could not be verified yet.');
    }

    return result;
}

async function startCardPaymentFlow() {
    const paymentMethod = getSelectedPaymentMethod();
    if (paymentMethod !== 'card') {
        alert('Please select Card Payment first.');
        return;
    }

    const customer = collectCheckoutCustomerData();
    if (!validateCheckoutInputs(paymentMethod, customer)) {
        return;
    }

    const paystackKey = PAYMENT_GATEWAY_CONFIG.paystackPublicKey;
    if (!paystackKey) {
        setPaymentStatus('Card payment is not configured. Add PAYSTACK_PUBLIC_KEY first.', 'error');
        return;
    }

    if (typeof window.PaystackPop === 'undefined') {
        setPaymentStatus('Card payment gateway failed to load. Check your internet connection and try again.', 'error');
        return;
    }

    const { total } = calculateTotals();
    setPaymentActionBusy('card-pay-btn', true, 'Opening secure card checkout...');
    setPaymentStatus('Waiting for secure card payment...', 'pending');

    try {
        const amountKobo = Math.round(total * 100);
        const reference = `CARD-${Date.now()}`;

        await new Promise((resolve, reject) => {
            const handler = window.PaystackPop.setup({
                key: paystackKey,
                email: customer.email,
                amount: amountKobo,
                currency: 'NGN',
                ref: reference,
                channels: ['card'],
                metadata: {
                    custom_fields: [
                        {
                            display_name: 'Customer Name',
                            variable_name: 'customer_name',
                            value: customer.fullname
                        },
                        {
                            display_name: 'Customer Phone',
                            variable_name: 'customer_phone',
                            value: customer.phone
                        }
                    ]
                },
                callback: async function(response) {
                    try {
                        setPaymentStatus('Card charged. Verifying payment, please wait...', 'pending');
                        const verificationResult = await verifyPaymentWithServer({
                            method: 'card',
                            provider: 'paystack',
                            reference: response.reference,
                            amount: total,
                            currency: 'NGN',
                            customerEmail: customer.email
                        });

                        setPaymentVerificationSuccess({
                            method: 'card',
                            reference: verificationResult.reference || response.reference,
                            provider: 'paystack',
                            amount: total
                        });
                        showNotification('Card payment verified successfully.');
                        resolve();
                    } catch (error) {
                        setPaymentStatus(`Card payment verification failed: ${error.message}`, 'error');
                        reject(error);
                    }
                },
                onClose: function() {
                    reject(new Error('Card payment was cancelled.'));
                }
            });

            handler.openIframe();
        });
    } catch (error) {
        if (error?.message) {
            showNotification(error.message);
        }
    } finally {
        setPaymentActionBusy('card-pay-btn', false, 'Opening secure card checkout...');
        updatePlaceOrderButtonState();
    }
}

async function confirmBankTransferPayment() {
    const paymentMethod = getSelectedPaymentMethod();
    if (paymentMethod !== 'bank-transfer') {
        alert('Please select Bank Transfer first.');
        return;
    }

    const customer = collectCheckoutCustomerData();
    if (!validateCheckoutInputs(paymentMethod, customer, { allowMissingTransferReference: true })) {
        return;
    }

    const { total } = calculateTotals();
    setPaymentActionBusy('verify-transfer-btn', true, 'Verifying transfer...');
    setPaymentStatus('Preparing bank transfer verification...', 'pending');

    try {
        let reference = customer.transferReference;

        if (!reference) {
            const paystackKey = PAYMENT_GATEWAY_CONFIG.paystackPublicKey;
            if (!paystackKey) {
                throw new Error('No transfer reference found. Add one manually or configure PAYSTACK_PUBLIC_KEY to launch secure bank transfer flow.');
            }

            if (!customer.email) {
                throw new Error('Email is required to launch secure bank transfer flow.');
            }

            if (typeof window.PaystackPop === 'undefined') {
                throw new Error('Payment gateway failed to load. Check your internet connection and try again.');
            }

            setPaymentStatus('Launching secure bank transfer checkout...', 'pending');

            reference = await new Promise((resolve, reject) => {
                const generatedRef = `BANK-${Date.now()}`;
                const handler = window.PaystackPop.setup({
                    key: paystackKey,
                    email: customer.email,
                    amount: Math.round(total * 100),
                    currency: 'NGN',
                    ref: generatedRef,
                    channels: ['bank_transfer'],
                    metadata: {
                        custom_fields: [
                            {
                                display_name: 'Customer Name',
                                variable_name: 'customer_name',
                                value: customer.fullname
                            },
                            {
                                display_name: 'Customer Phone',
                                variable_name: 'customer_phone',
                                value: customer.phone
                            }
                        ]
                    },
                    callback: function(response) {
                        resolve(response.reference);
                    },
                    onClose: function() {
                        reject(new Error('Bank transfer payment was cancelled before completion.'));
                    }
                });

                handler.openIframe();
            });

            const transferReferenceInput = document.getElementById('transfer-reference');
            if (transferReferenceInput) {
                transferReferenceInput.value = reference;
            }
        }

        if (reference.length < 5) {
            throw new Error('Transfer reference looks too short.');
        }

        setPaymentStatus('Checking transfer confirmation, please wait...', 'pending');
        const verificationResult = await verifyPaymentWithServer({
            method: 'bank-transfer',
            provider: 'paystack',
            reference,
            senderName: customer.transferSender,
            amount: total,
            currency: 'NGN',
            customerPhone: customer.phone
        });

        setPaymentVerificationSuccess({
            method: 'bank-transfer',
            reference: verificationResult.reference || reference,
            provider: verificationResult.provider || 'paystack',
            amount: total
        });
        showNotification('Bank transfer verified successfully.');
    } catch (error) {
        setPaymentStatus(`Transfer verification failed: ${error.message}`, 'error');
        showNotification('Transfer is not verified yet. Please check reference and try again.');
    } finally {
        setPaymentActionBusy('verify-transfer-btn', false, 'Verifying transfer...');
        updatePlaceOrderButtonState();
    }
}

function updatePaymentMethodUI() {
    const paymentMethod = getSelectedPaymentMethod();
    const cashDetails = document.getElementById('cash-details');
    const cardDetails = document.getElementById('card-details');
    const bankTransferForm = document.getElementById('payment-form');
    const transferReference = document.getElementById('transfer-reference');

    if (cashDetails) {
        cashDetails.style.display = paymentMethod === 'cash' ? 'block' : 'none';
    }

    if (cardDetails) {
        cardDetails.style.display = paymentMethod === 'card' ? 'block' : 'none';
    }

    if (bankTransferForm) {
        bankTransferForm.style.display = paymentMethod === 'bank-transfer' ? 'block' : 'none';
    }

    if (transferReference) {
        transferReference.required = paymentMethod === 'bank-transfer';
    }

    const methodChanged = paymentVerificationState.method !== paymentMethod;
    if (methodChanged) {
        resetPaymentVerificationState(paymentMethod);
    }

    if (paymentMethod === 'cash') {
        setPaymentStatus('Cash on Delivery selected. You can place your order directly.', 'success');
    } else if (paymentVerificationState.confirmed && paymentVerificationState.method === paymentMethod) {
        const methodLabel = paymentMethod === 'card' ? 'Card payment' : 'Bank transfer';
        setPaymentStatus(`${methodLabel} verified successfully. You can place your order now.`, 'success');
    } else if (paymentMethod === 'card') {
        setPaymentStatus('Card payment selected. Click "Pay with Card & Verify" to continue.', 'pending');
    } else {
        setPaymentStatus('Bank transfer selected. Enter transfer details, then click "Confirm Transfer Payment".', 'pending');
    }

    document.querySelectorAll('.payment-method').forEach(label => {
        const radio = label.querySelector('input[name="payment"]');
        label.classList.toggle('active', Boolean(radio && radio.checked));
    });

    updatePlaceOrderButtonState();
}

function initCheckoutInteractions() {
    initAddressAutocomplete();
    initCheckoutDraftAutosave();

    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    paymentOptions.forEach(option => {
        option.addEventListener('change', updatePaymentMethodUI);
    });

    const transferReference = document.getElementById('transfer-reference');
    const transferSender = document.getElementById('transfer-sender');
    [transferReference, transferSender].forEach(input => {
        if (!input) return;
        input.addEventListener('input', () => {
            if (getSelectedPaymentMethod() === 'bank-transfer') {
                resetPaymentVerificationState('bank-transfer');
                setPaymentStatus('Transfer details changed. Please confirm transfer payment again.', 'pending');
                updatePlaceOrderButtonState();
            }
        });
    });

    if (paymentOptions.length > 0) {
        resetPaymentVerificationState(getSelectedPaymentMethod());
        updatePaymentMethodUI();
    }

    restoreCheckoutDraft();
    applySelectedCheckoutAddressToCheckoutForm();

    const cityInput = document.getElementById('city');
    if (cityInput && !cityInput.value.trim()) {
        cityInput.value = 'Abuja';
    }

    queueScrollRevealTargets(document);

    resumeActiveDeliveryTracking();
}

function formatRestaurantNumberForWhatsApp(rawNumber) {
    const digits = (rawNumber || '').replace(/\D/g, '');
    if (digits.startsWith('234')) return digits;
    if (digits.startsWith('0')) return `234${digits.slice(1)}`;
    return digits;
}

function estimateDeliveryMinutes(cart) {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    const estimated = 20 + (totalQty * 2);
    return Math.max(20, Math.min(75, estimated));
}

function buildRestaurantContactMessage(order) {
    return [
        `Hi restaurant, I am checking on order ${order.id}.`,
        `My name: ${order.customer}`,
        `My phone: ${order.phone}`
    ].join('\n');
}

function buildRestaurantNotificationLinks(order) {
    const message = buildRestaurantContactMessage(order);
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = formatRestaurantNumberForWhatsApp(RESTAURANT_NOTIFICATION_NUMBER);

    return {
        whatsappUrl: `https://wa.me/${whatsappNumber}?text=${encodedMessage}`,
        smsUrl: `sms:${RESTAURANT_NOTIFICATION_NUMBER}?body=${encodedMessage}`
    };
}

function attachTrackerNotificationLinks(order) {
    const { whatsappUrl, smsUrl } = buildRestaurantNotificationLinks(order);
    const whatsappLink = document.getElementById('tracker-whatsapp-link');
    const smsLink = document.getElementById('tracker-sms-link');

    if (whatsappLink) {
        whatsappLink.href = whatsappUrl;
    }

    if (smsLink) {
        smsLink.href = smsUrl;
    }
}

function getActiveDeliveryOrder() {
    const raw = localStorage.getItem('activeDeliveryOrder');
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        parsed.status = normalizeOrderStatusValue(parsed.status);
        return parsed;
    } catch (error) {
        localStorage.removeItem('activeDeliveryOrder');
        return null;
    }
}

function saveActiveDeliveryOrder(order) {
    if (!order) return;
    order.status = normalizeOrderStatusValue(order.status);
    localStorage.setItem('activeDeliveryOrder', JSON.stringify(order));
}

function syncOrderInUserHistory(updatedOrder) {
    const currentUser = getCurrentUser();
    if (!currentUser || !updatedOrder) return;

    const normalizedOrder = {
        ...updatedOrder,
        status: normalizeOrderStatusValue(updatedOrder.status),
        date: updatedOrder.date || new Date(updatedOrder.createdAt || Date.now()).toLocaleDateString()
    };

    const users = getUsers();
    const userIndex = users.findIndex(user => user.email === currentUser);
    if (userIndex < 0) return;

    const user = users[userIndex];
    if (!Array.isArray(user.orders)) {
        user.orders = [];
    }

    const existingIndex = user.orders.findIndex(order => order.id === updatedOrder.id);
    if (existingIndex >= 0) {
        user.orders[existingIndex] = {
            ...user.orders[existingIndex],
            ...normalizedOrder
        };
    } else {
        user.orders.unshift(normalizedOrder);
    }

    users[userIndex] = user;
    saveUsers(users);
}

function getOrderStepMeta(orderStatus) {
    const normalized = normalizeOrderStatusValue(orderStatus);
    const stepIndex = ORDER_STATUS_STEPS.indexOf(normalized);
    return {
        normalized,
        stepIndex,
        hasOrderedStep: stepIndex >= 0
    };
}

function renderDeliveryTracker(order) {
    const tracker = document.getElementById('delivery-tracker');
    if (!tracker || !order) return;

    const statusEl = document.getElementById('tracker-status');
    const timeEl = document.getElementById('tracker-time');
    const noteEl = document.getElementById('tracker-note');
    const stepsEl = document.getElementById('tracker-steps');
    const progressEl = document.getElementById('tracker-progress-fill');
    const statusMeta = getOrderStepMeta(order.status);
    const statusLabel = getOrderStatusLabel(statusMeta.normalized);

    if (statusEl) {
        statusEl.textContent = `Current status: ${statusLabel}`;
    }

    if (timeEl) {
        const updatedAt = order.updatedAt || order.createdAt || '';
        const formattedUpdatedAt = updatedAt
            ? new Date(updatedAt).toLocaleString()
            : 'Unknown';
        timeEl.textContent = `Last updated: ${formattedUpdatedAt}`;
    }

    if (noteEl) {
        if (statusMeta.normalized === 'pending_restaurant_confirmation') {
            noteEl.textContent = 'Restaurant needs to confirm your order first.';
        } else if (statusMeta.normalized === 'rejected') {
            noteEl.textContent = 'Restaurant rejected this order. Please contact support or place a new order.';
        } else if (statusMeta.normalized === 'cancelled') {
            noteEl.textContent = 'This order is cancelled. Please place a new order.';
        } else if (statusMeta.normalized === 'delivered') {
            noteEl.textContent = 'Order completed successfully.';
        } else {
            noteEl.textContent = 'Restaurant is updating your order step by step.';
        }
    }

    if (stepsEl) {
        stepsEl.innerHTML = ORDER_STATUS_STEPS.map((step, index) => {
            let className = 'pending';
            if (statusMeta.hasOrderedStep && index < statusMeta.stepIndex) className = 'done';
            if (statusMeta.hasOrderedStep && index === statusMeta.stepIndex) className = 'active';
            return `<li class="tracker-step ${className}">${ORDER_STATUS_LABELS[step]}</li>`;
        }).join('');
    }

    if (progressEl) {
        const denominator = Math.max(ORDER_STATUS_STEPS.length - 1, 1);
        const progressValue = statusMeta.hasOrderedStep
            ? Math.max(0, Math.min(100, (statusMeta.stepIndex / denominator) * 100))
            : 0;
        progressEl.style.width = `${progressValue}%`;
    }

    tracker.style.display = 'block';
}

function startDeliveryTracking(order) {
    clearInterval(orderStatusPollTimer);
    orderStatusPollTimer = null;
    orderStatusPollInFlight = false;

    renderDeliveryTracker(order);

    if (order?.isLocalOnly) {
        return;
    }

    if (isTerminalOrderStatus(order.status)) {
        return;
    }

    // Pull latest server status immediately before starting periodic polling.
    (async () => {
        try {
            const latestOrder = await fetchOrderById(order.id);
            saveActiveDeliveryOrder(latestOrder);
            syncOrderInUserHistory(latestOrder);
            showOrderConfirmation(latestOrder);
            renderDeliveryTracker(latestOrder);
        } catch (error) {
            // Keep cached state visible if immediate refresh fails.
        }
    })();

    orderStatusPollTimer = setInterval(async () => {
        const activeOrder = getActiveDeliveryOrder();
        if (!activeOrder) {
            clearInterval(orderStatusPollTimer);
            orderStatusPollTimer = null;
            return;
        }

        if (isTerminalOrderStatus(activeOrder.status)) {
            clearInterval(orderStatusPollTimer);
            orderStatusPollTimer = null;
            return;
        }

        if (orderStatusPollInFlight) {
            return;
        }

        orderStatusPollInFlight = true;
        try {
            const latestOrder = await fetchOrderById(activeOrder.id);
            saveActiveDeliveryOrder(latestOrder);
            syncOrderInUserHistory(latestOrder);
            showOrderConfirmation(latestOrder);
            renderDeliveryTracker(latestOrder);

            if (isTerminalOrderStatus(latestOrder.status)) {
                clearInterval(orderStatusPollTimer);
                orderStatusPollTimer = null;
            }
        } catch (error) {
            const timeEl = document.getElementById('tracker-time');
            if (timeEl) {
                timeEl.textContent = `Last update check failed. Showing cached status: ${getOrderStatusLabel(activeOrder.status)}.`;
            }
        } finally {
            orderStatusPollInFlight = false;
        }
    }, 12000);
}

function showOrderConfirmation(order) {
    const confirmationBox = document.getElementById('order-confirmation');
    if (!confirmationBox) return;

    const notificationLine = order.restaurantNotified === false
        ? 'Restaurant notification: Failed (contact restaurant directly)'
        : order.restaurantNotified === true
            ? 'Restaurant notification: Sent automatically'
            : 'Restaurant notification: Sending...';

    const syncLine = order.isLocalOnly
        ? 'Order sync: Local-only mode (server offline)'
        : 'Order sync: Connected to server';

    confirmationBox.innerHTML = [
        `<strong>Order placed successfully.</strong>`,
        `Order ID: ${order.id}`,
        `Order status: ${getOrderStatusLabel(order.status)}`,
        `Payment: ${order.paymentMethod}`,
        `Total: ₦${Number(order.total || 0).toFixed(2)}`,
        notificationLine,
        syncLine
    ].join('<br>');
    confirmationBox.style.display = 'block';
}

function resumeActiveDeliveryTracking() {
    const activeOrder = getActiveDeliveryOrder();
    if (!activeOrder) return;

    attachTrackerNotificationLinks(activeOrder);
    showOrderConfirmation(activeOrder);
    startDeliveryTracking(activeOrder);
}

async function processPayment() {
    const customer = collectCheckoutCustomerData();
    const paymentMethod = getSelectedPaymentMethod();
    const cart = getCart();

    if (!validateCheckoutInputs(paymentMethod, customer)) {
        return;
    }

    if (paymentMethod === 'card' || paymentMethod === 'bank-transfer') {
        const isVerifiedForMethod = paymentVerificationState.confirmed && paymentVerificationState.method === paymentMethod;
        if (!isVerifiedForMethod) {
            alert('Payment is not verified yet. Please complete payment confirmation before placing your order.');
            updatePlaceOrderButtonState();
            return;
        }

        const { total: latestTotal } = calculateTotals();
        const paidAmount = Number(paymentVerificationState.amount || 0);
        if (Math.abs(latestTotal - paidAmount) > 0.01) {
            alert('Checkout total changed after payment verification. Please verify payment again for the current amount.');
            resetPaymentVerificationState(paymentMethod);
            updatePaymentMethodUI();
            return;
        }
    }

    setPaymentActionBusy('place-order-btn', true, 'Placing order...');

    try {
        const { subtotal, tax, delivery, total } = calculateTotals();
        const paymentLabelMap = {
            cash: 'Cash on Delivery',
            card: 'Card Payment',
            'bank-transfer': 'Bank Transfer'
        };
        const paymentLabel = paymentLabelMap[paymentMethod] || 'Cash on Delivery';

        const payload = {
            customer: customer.fullname,
            email: customer.email || '',
            phone: customer.phone,
            address: customer.address,
            landmark: customer.landmark || '',
            district: customer.district,
            subDistrict: customer.subDistrict,
            city: customer.city,
            zip: customer.zip || '',
            items: cart,
            subtotal,
            tax,
            delivery,
            total,
            paymentMethod: paymentLabel,
            paymentReference: paymentMethod === 'cash' ? '' : paymentVerificationState.reference,
            paymentProvider: paymentMethod === 'cash' ? '' : paymentVerificationState.provider,
            paymentVerifiedAt: paymentMethod === 'cash' ? '' : new Date(paymentVerificationState.verifiedAt || Date.now()).toISOString(),
            transferReference: paymentMethod === 'bank-transfer' ? customer.transferReference : '',
            transferSender: paymentMethod === 'bank-transfer' ? (customer.transferSender || 'Not provided') : '',
            instructions: customer.instructions || ''
        };

        const created = await createOrderOnServer(payload);
        const order = {
            ...created.order,
            status: normalizeOrderStatusValue(created.order.status)
        };

        upsertLocalRestaurantOrderCache(order);

        if (!order.date) {
            order.date = new Date(order.createdAt || Date.now()).toLocaleDateString();
        }

        syncOrderInUserHistory(order);

        localStorage.removeItem('cart');
        clearCheckoutDraft();
        updateCartCount();
        displayCheckoutSummary();

        saveActiveDeliveryOrder(order);
        attachTrackerNotificationLinks(order);
        showOrderConfirmation(order);
        startDeliveryTracking(order);

        resetPaymentVerificationState(getSelectedPaymentMethod());
        updatePaymentMethodUI();

        if (created.offlineMode || order.isLocalOnly) {
            showNotification('Order saved locally. Server is offline, so restaurant auto-notification is unavailable right now.');
        } else if (order.restaurantNotified) {
            showNotification('Order placed. Restaurant has been notified and will confirm shortly.');
        } else {
            showNotification('Order placed. Restaurant notification failed, please contact the restaurant directly.');
        }
    } catch (error) {
        const message = error?.message || 'Could not place order right now. Please try again.';
        showNotification(message);
        alert(message);
    } finally {
        setPaymentActionBusy('place-order-btn', false, 'Placing order...');
    }
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getRestaurantDashboardToken() {
    const tokenInput = document.getElementById('restaurant-token-input');
    const inlineToken = tokenInput?.value?.trim() || '';
    return inlineToken || ORDER_WORKFLOW_CONFIG.restaurantToken;
}

function setRestaurantDashboardMessage(message, state = 'pending') {
    const messageEl = document.getElementById('restaurant-dashboard-message');
    if (!messageEl) return;

    messageEl.className = `payment-status ${state}`;
    messageEl.textContent = message;
}

function getRestaurantNextStatuses(status) {
    const normalized = normalizeOrderStatusValue(status);
    if (normalized === 'pending_restaurant_confirmation') return ['confirmed', 'rejected'];
    if (normalized === 'confirmed') return ['preparing', 'cancelled'];
    if (normalized === 'preparing') return ['ready_for_dispatch', 'cancelled'];
    if (normalized === 'ready_for_dispatch') return ['out_for_delivery', 'cancelled'];
    if (normalized === 'out_for_delivery') return ['delivered'];
    return [];
}

async function fetchRestaurantOrders(statusFilter) {
    const token = getRestaurantDashboardToken();
    if (!token) {
        throw new Error('Restaurant token is required. Set RESTAURANT_DASHBOARD_TOKEN in localStorage or enter token in the field.');
    }

    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter);
    }

    const query = params.toString();
    const url = query ? `${buildOrderApiUrl('/orders')}?${query}` : buildOrderApiUrl('/orders');
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Restaurant-Token': token
            }
        });

        const result = await response.json();
        if (!response.ok || !result?.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized restaurant request. Check dashboard token (default local token is dev-restaurant-token).');
            }
            throw new Error(result?.message || `Could not fetch restaurant orders (${response.status}).`);
        }

        const serverOrders = Array.isArray(result.orders) ? result.orders : [];
        const cacheOrders = getLocalRestaurantOrderCache();
        const combinedOrders = mergeRestaurantOrderSets(serverOrders, cacheOrders);

        saveLocalRestaurantOrderCache(combinedOrders);
        restaurantDashboardUsingLocalCache = false;
        return applyRestaurantOrderStatusFilter(combinedOrders, statusFilter);
    } catch (error) {
        if (!isLikelyConnectivityError(error)) {
            throw error;
        }

        const localOrders = applyRestaurantOrderStatusFilter(getLocalRestaurantOrderCache(), statusFilter);
        restaurantDashboardUsingLocalCache = true;

        if (!localOrders.length) {
            throw new Error('Cannot reach order server and no local cached orders are available yet. Start backend on port 8787, then refresh.');
        }

        return localOrders;
    }
}

function renderRestaurantOrdersSkeleton(cardCount = 4) {
    const listEl = document.getElementById('restaurant-orders-list');
    if (!listEl) return;

    const safeCount = Math.max(2, Math.min(8, Number(cardCount) || 4));
    listEl.innerHTML = Array.from({ length: safeCount }).map(() => {
        return [
            '<div class="restaurant-order-card restaurant-order-skeleton" aria-hidden="true">',
            '<div class="skeleton-line skeleton-shimmer" style="width: 42%; height: 18px;"></div>',
            '<div class="skeleton-line skeleton-shimmer" style="width: 75%;"></div>',
            '<div class="skeleton-line skeleton-shimmer" style="width: 68%;"></div>',
            '<div class="skeleton-line skeleton-shimmer" style="width: 90%;"></div>',
            '<div class="skeleton-line skeleton-shimmer" style="width: 55%;"></div>',
            '</div>'
        ].join('');
    }).join('');
}

function renderRestaurantOrders(orders) {
    const listEl = document.getElementById('restaurant-orders-list');
    const countEl = document.getElementById('restaurant-order-count');
    if (!listEl) return;

    restaurantDashboardLatestOrders = Array.isArray(orders) ? [...orders] : [];

    if (countEl) {
        countEl.textContent = `${orders.length}`;
    }

    if (!orders.length) {
        listEl.innerHTML = '<div class="empty-cart"><p>No orders found for this filter.</p></div>';
        return;
    }

    listEl.innerHTML = orders.map(order => {
        const normalizedStatus = normalizeOrderStatusValue(order.status);
        const actions = getRestaurantNextStatuses(normalizedStatus);
        const encodedOrderId = encodeURIComponent(order.id || '');
        const districtValue = escapeHtml(order.district || 'N/A');
        const subdistrictValue = escapeHtml(order.subDistrict || order.subdistrict || 'N/A');
        const itemSummary = Array.isArray(order.items)
            ? order.items.map(item => `${escapeHtml(item?.name || 'Item')} x${Number(item?.quantity || 0)}`).join(', ')
            : 'No items';

        const actionButtons = actions.length
            ? actions.map(nextStatus => {
                return `<button type="button" class="btn btn-primary restaurant-action-btn" data-order-id="${encodedOrderId}" data-next-status="${escapeHtml(nextStatus)}">${escapeHtml(getOrderStatusLabel(nextStatus))}</button>`;
            }).join('')
            : '<span class="restaurant-final-status">No further action</span>';

        return [
            '<div class="restaurant-order-card">',
            `<div class="restaurant-order-head"><strong>${escapeHtml(order.id)}</strong><span class="restaurant-order-status">${escapeHtml(getOrderStatusLabel(normalizedStatus))}</span></div>`,
            `<div><strong>Customer:</strong> ${escapeHtml(order.customer)}</div>`,
            `<div><strong>Phone:</strong> ${escapeHtml(order.phone)}</div>`,
            '<div class="restaurant-location-badges">',
            `<span class="restaurant-location-badge">Subdistrict: ${subdistrictValue}</span>`,
            `<span class="restaurant-location-badge">District: ${districtValue}</span>`,
            '</div>',
            `<div><strong>Address:</strong> ${escapeHtml(order.address)}, ${escapeHtml(order.subDistrict || order.subdistrict || 'N/A')}, ${escapeHtml(order.district || 'N/A')}, ${escapeHtml(order.city)}</div>`,
            `<div><strong>Items:</strong> ${itemSummary}</div>`,
            `<div><strong>Total:</strong> ₦${Number(order.total || 0).toFixed(2)}</div>`,
            `<div><strong>Payment:</strong> ${escapeHtml(order.paymentMethod || 'Unknown')}</div>`,
            '<div class="restaurant-actions-row">',
            actionButtons,
            '</div>',
            '</div>'
        ].join('');
    }).join('');

    queueScrollRevealTargets(listEl);
}

function handleRestaurantOrderActionClick(event) {
    const target = event?.target;
    if (!(target instanceof HTMLElement)) return;

    const actionButton = target.closest('button[data-order-id][data-next-status]');
    if (!(actionButton instanceof HTMLButtonElement)) return;

    const encodedOrderId = String(actionButton.getAttribute('data-order-id') || '').trim();
    const nextStatus = String(actionButton.getAttribute('data-next-status') || '').trim();
    if (!encodedOrderId || !nextStatus) return;

    const orderId = decodeURIComponent(encodedOrderId);
    updateRestaurantOrderStatus(orderId, nextStatus);
}

function normalizeDistrictFilterValue(value) {
    return String(value || '').trim().toLowerCase();
}

function getOrderDistrictLabel(order) {
    const district = String(order?.district || '').trim();
    return district || 'Unknown';
}

function applyRestaurantDistrictFilter(orders) {
    const target = normalizeDistrictFilterValue(restaurantDashboardDistrictFilter);
    if (!target || target === 'all') {
        return [...orders];
    }

    return orders.filter(order => normalizeDistrictFilterValue(getOrderDistrictLabel(order)) === target);
}

function renderRestaurantDistrictFilters(orders) {
    const container = document.getElementById('restaurant-district-filters');
    if (!container) return;

    const districtCounts = new Map();
    (Array.isArray(orders) ? orders : []).forEach(order => {
        const label = getOrderDistrictLabel(order);
        const key = normalizeDistrictFilterValue(label);
        const existing = districtCounts.get(key);
        if (existing) {
            existing.count += 1;
        } else {
            districtCounts.set(key, { key, label, count: 1 });
        }
    });

    const districtEntries = Array.from(districtCounts.values()).sort((a, b) => a.label.localeCompare(b.label));
    const total = (Array.isArray(orders) ? orders : []).length;

    const hasSelectedDistrict = restaurantDashboardDistrictFilter === 'all'
        || districtEntries.some(entry => entry.key === restaurantDashboardDistrictFilter);
    if (!hasSelectedDistrict) {
        restaurantDashboardDistrictFilter = 'all';
    }

    const chips = [
        { key: 'all', label: `All Districts (${total})` },
        ...districtEntries.map(entry => ({ key: entry.key, label: `${entry.label} (${entry.count})` }))
    ];

    container.innerHTML = chips.map(chip => {
        const activeClass = chip.key === restaurantDashboardDistrictFilter ? 'active' : '';
        return `<button type="button" class="restaurant-district-chip ${activeClass}" data-district-filter="${escapeHtml(chip.key)}">${escapeHtml(chip.label)}</button>`;
    }).join('');

    container.querySelectorAll('[data-district-filter]').forEach(button => {
        button.addEventListener('click', () => {
            restaurantDashboardDistrictFilter = String(button.getAttribute('data-district-filter') || 'all');
            renderRestaurantDistrictFilters(restaurantDashboardFetchedOrders);
            renderRestaurantOrders(applyRestaurantDistrictFilter(restaurantDashboardFetchedOrders));
        });
    });
}

function escapeCsvCell(value) {
    const stringValue = String(value ?? '');
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
}

function downloadCsvFile(filename, csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function buildRestaurantOrdersCsv(orders) {
    const headers = [
        'Order ID',
        'Created At',
        'Status',
        'Customer',
        'Phone',
        'Email',
        'Address',
        'Subdistrict',
        'District',
        'City',
        'Area/ZIP',
        'Landmark',
        'Payment Method',
        'Total (NGN)',
        'Items'
    ];

    const rows = orders.map(order => {
        const itemsText = Array.isArray(order.items)
            ? order.items.map(item => `${item?.name || 'Item'} x${Number(item?.quantity || 0)}`).join(' | ')
            : '';

        return [
            order.id || '',
            order.createdAt || '',
            getOrderStatusLabel(order.status),
            order.customer || '',
            order.phone || '',
            order.email || '',
            order.address || '',
            order.subDistrict || order.subdistrict || '',
            order.district || '',
            order.city || '',
            order.zip || '',
            order.landmark || '',
            order.paymentMethod || '',
            Number(order.total || 0).toFixed(2),
            itemsText
        ].map(escapeCsvCell).join(',');
    });

    return [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
}

async function exportRestaurantOrdersCsv() {
    if (!currentUserCanAccessRestaurantDashboard()) {
        setRestaurantDashboardMessage('Access denied. Only restaurant staff can export orders.', 'error');
        return;
    }

    setRestaurantDashboardMessage('Preparing dispatch CSV export...', 'pending');

    let exportOrders = [];
    let usedLocalFallback = false;

    try {
        exportOrders = await fetchRestaurantOrders('all');
    } catch (error) {
        exportOrders = restaurantDashboardLatestOrders.length
            ? [...restaurantDashboardLatestOrders]
            : getLocalRestaurantOrderCache();
        usedLocalFallback = true;
    }

    if (!exportOrders.length) {
        setRestaurantDashboardMessage('No orders available to export yet.', 'error');
        return;
    }

    const csv = buildRestaurantOrdersCsv(exportOrders);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadCsvFile(`restaurant-orders-${stamp}.csv`, csv);

    if (usedLocalFallback) {
        setRestaurantDashboardMessage(`CSV exported from local cache (${exportOrders.length} orders).`, 'pending');
    } else {
        setRestaurantDashboardMessage(`CSV exported successfully (${exportOrders.length} orders).`, 'success');
    }
}

async function refreshRestaurantDashboardOrders(options = {}) {
    const normalizedOptions = options && typeof options === 'object' ? options : {};
    const showSkeleton = normalizedOptions.showSkeleton !== false;
    const silent = normalizedOptions.silent === true;
    const filterEl = document.getElementById('restaurant-status-filter');
    const filterValue = filterEl?.value || 'pending_restaurant_confirmation';

    if (!silent) {
        setRestaurantDashboardMessage('Loading restaurant orders...', 'pending');
    }
    if (showSkeleton) {
        renderRestaurantOrdersSkeleton(4);
    }

    try {
        const orders = await fetchRestaurantOrders(filterValue);
        restaurantDashboardFetchedOrders = Array.isArray(orders) ? [...orders] : [];
        renderRestaurantDistrictFilters(restaurantDashboardFetchedOrders);
        const visibleOrders = applyRestaurantDistrictFilter(restaurantDashboardFetchedOrders);
        renderRestaurantOrders(visibleOrders);
        if (restaurantDashboardUsingLocalCache) {
            setRestaurantDashboardMessage(`Server offline. Showing ${visibleOrders.length} order(s) for selected district filter.`, 'pending');
        } else {
            setRestaurantDashboardMessage(`Loaded ${visibleOrders.length} order(s) for selected district filter.`, 'success');
        }
    } catch (error) {
        if (restaurantDashboardLatestOrders.length) {
            renderRestaurantDistrictFilters(restaurantDashboardLatestOrders);
            renderRestaurantOrders(applyRestaurantDistrictFilter(restaurantDashboardLatestOrders));
        }
        setRestaurantDashboardMessage(error.message || 'Failed to load orders.', 'error');
    }
}

async function updateRestaurantOrderStatus(orderId, nextStatus) {
    const token = getRestaurantDashboardToken();
    if (!token) {
        setRestaurantDashboardMessage('Restaurant token is missing.', 'error');
        return;
    }

    setRestaurantDashboardMessage(`Updating ${orderId} to ${getOrderStatusLabel(nextStatus)}...`, 'pending');
    try {
        const response = await fetch(buildOrderApiUrl(`/orders/${encodeURIComponent(orderId)}/status`), {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-Restaurant-Token': token
            },
            body: JSON.stringify({
                status: nextStatus,
                note: `Updated from restaurant dashboard to ${nextStatus}`
            })
        });

        const result = await response.json();
        if (!response.ok || !result?.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized restaurant request. Check dashboard token (default local token is dev-restaurant-token).');
            }
            throw new Error(result?.message || `Status update failed (${response.status}).`);
        }

        showNotification(`Order ${orderId} moved to ${getOrderStatusLabel(nextStatus)}.`);
        upsertLocalRestaurantOrderCache(result.order);
        await refreshRestaurantDashboardOrders();
    } catch (error) {
        if (isLikelyConnectivityError(error)) {
            const updatedLocally = updateLocalRestaurantOrderStatus(orderId, nextStatus);
            if (updatedLocally) {
                showNotification(`Server offline. Order ${orderId} updated locally to ${getOrderStatusLabel(nextStatus)}.`);
                await refreshRestaurantDashboardOrders();
                return;
            }
        }

        setRestaurantDashboardMessage(error.message || 'Failed to update order status.', 'error');
    }
}

function getNextMenuItemId() {
    return menuData.reduce((maxId, item) => {
        const itemId = Number(item?.id || 0);
        return Number.isFinite(itemId) ? Math.max(maxId, itemId) : maxId;
    }, 0) + 1;
}

function setRestaurantMenuImagePreview(imageValue, fallbackEmoji = '🍽️', itemName = 'Menu item') {
    const previewEl = document.getElementById('restaurant-menu-image-preview');
    if (!previewEl) return;

    const normalizedImage = normalizeMenuImage(imageValue);
    if (normalizedImage) {
        previewEl.classList.add('has-image');
        previewEl.innerHTML = `<img src="${escapeHtml(normalizedImage)}" alt="${escapeHtml(itemName)}" class="restaurant-menu-image-preview-photo" loading="lazy">`;
        return;
    }

    previewEl.classList.remove('has-image');
    previewEl.textContent = String(fallbackEmoji || '🍽️');
}

function getRestaurantMenuImageValue() {
    const imageUrlInput = document.getElementById('restaurant-menu-image-url');
    const imageDataInput = document.getElementById('restaurant-menu-image-data');
    const imageFromUpload = normalizeMenuImage(imageDataInput?.value || '');
    if (imageFromUpload) return imageFromUpload;

    return normalizeMenuImage(imageUrlInput?.value || '');
}

function handleRestaurantMenuImageUpload(event) {
    const input = event?.target;
    if (!(input instanceof HTMLInputElement)) return;

    const file = input.files?.[0];
    const imageDataInput = document.getElementById('restaurant-menu-image-data');
    const imageUrlInput = document.getElementById('restaurant-menu-image-url');
    const emojiInput = document.getElementById('restaurant-menu-emoji');
    const nameInput = document.getElementById('restaurant-menu-name');

    if (!file) {
        if (imageDataInput) imageDataInput.value = '';
        setRestaurantMenuImagePreview(
            normalizeMenuImage(imageUrlInput?.value || ''),
            String(emojiInput?.value || '').trim() || '🍽️',
            String(nameInput?.value || 'Menu item').trim() || 'Menu item'
        );
        return;
    }

    if (!String(file.type || '').toLowerCase().startsWith('image/')) {
        showNotification('Please choose an image file only.');
        input.value = '';
        return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (Number(file.size || 0) > maxBytes) {
        showNotification('Image is too large. Use image up to 2MB.');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        const data = normalizeMenuImage(reader.result || '');
        if (!data) {
            showNotification('Could not read selected image. Try another image.');
            input.value = '';
            return;
        }

        if (imageDataInput) imageDataInput.value = data;
        if (imageUrlInput) imageUrlInput.value = '';
        setRestaurantMenuImagePreview(
            data,
            String(emojiInput?.value || '').trim() || '🍽️',
            String(nameInput?.value || 'Menu item').trim() || 'Menu item'
        );
    };

    reader.onerror = () => {
        showNotification('Failed to load image file.');
        input.value = '';
    };

    reader.readAsDataURL(file);
}

function clearRestaurantMenuImage() {
    const imageUrlInput = document.getElementById('restaurant-menu-image-url');
    const imageFileInput = document.getElementById('restaurant-menu-image-file');
    const imageDataInput = document.getElementById('restaurant-menu-image-data');
    const emojiInput = document.getElementById('restaurant-menu-emoji');
    const nameInput = document.getElementById('restaurant-menu-name');

    if (imageUrlInput) imageUrlInput.value = '';
    if (imageFileInput) imageFileInput.value = '';
    if (imageDataInput) imageDataInput.value = '';

    const fallbackEmoji = String(emojiInput?.value || '').trim() || '🍽️';
    const itemName = String(nameInput?.value || 'Menu item').trim() || 'Menu item';
    setRestaurantMenuImagePreview('', fallbackEmoji, itemName);
    showNotification('Menu image removed from the form.');
}

function resetRestaurantMenuForm() {
    const editIdInput = document.getElementById('restaurant-menu-edit-id');
    const nameInput = document.getElementById('restaurant-menu-name');
    const categoryInput = document.getElementById('restaurant-menu-category');
    const priceInput = document.getElementById('restaurant-menu-price');
    const caloriesInput = document.getElementById('restaurant-menu-calories');
    const emojiInput = document.getElementById('restaurant-menu-emoji');
    const imageUrlInput = document.getElementById('restaurant-menu-image-url');
    const imageFileInput = document.getElementById('restaurant-menu-image-file');
    const imageDataInput = document.getElementById('restaurant-menu-image-data');
    const descriptionInput = document.getElementById('restaurant-menu-description');
    const saveButton = document.getElementById('restaurant-menu-save-btn');

    if (editIdInput) editIdInput.value = '';
    if (nameInput) nameInput.value = '';
    if (categoryInput) categoryInput.value = 'main';
    if (priceInput) priceInput.value = '';
    if (caloriesInput) caloriesInput.value = '';
    if (emojiInput) emojiInput.value = '';
    if (imageUrlInput) imageUrlInput.value = '';
    if (imageFileInput) imageFileInput.value = '';
    if (imageDataInput) imageDataInput.value = '';
    if (descriptionInput) descriptionInput.value = '';
    if (saveButton) saveButton.textContent = 'Add Menu Item';
    setRestaurantMenuImagePreview('', '🍽️', 'Menu item');
}

function renderRestaurantMenuManager() {
    const listEl = document.getElementById('restaurant-menu-list');
    const countEl = document.getElementById('restaurant-menu-count');
    if (!listEl) return;

    if (!currentUserCanAccessRestaurantDashboard()) {
        listEl.innerHTML = '<div class="empty-cart"><p>Only restaurant staff can manage menu items.</p></div>';
        if (countEl) countEl.textContent = '0';
        return;
    }

    if (countEl) {
        countEl.textContent = String(menuData.length);
    }

    if (menuData.length === 0) {
        listEl.innerHTML = '<div class="empty-cart"><p>No menu items available. Add one below.</p></div>';
        return;
    }

    const sortedItems = [...menuData].sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
    listEl.innerHTML = sortedItems.map(item => {
        return [
            '<div class="restaurant-menu-item">',
            '<div class="restaurant-menu-item-head">',
            `<div class="restaurant-menu-title-block">${getMenuVisualMarkup(item, 'restaurant-menu-thumb', 'restaurant-menu-thumb-photo')}<strong>${escapeHtml(item.name)}</strong></div>`,
            `<span>${escapeHtml(item.category)}</span>`,
            '</div>',
            `<div class="restaurant-menu-item-details">Price: ₦${Number(item.price || 0).toFixed(2)} | Calories: ${Number(item.calories || 0)}</div>`,
            `<div class="restaurant-menu-item-details">${escapeHtml(item.description || '')}</div>`,
            `<button class="btn btn-secondary" type="button" onclick="startRestaurantMenuEdit(${Number(item.id || 0)})">Edit Item</button>`,
            '</div>'
        ].join('');
    }).join('');

    queueScrollRevealTargets(listEl);
}

function startRestaurantMenuEdit(itemId) {
    const item = menuData.find(entry => Number(entry?.id) === Number(itemId));
    if (!item) {
        showNotification('Menu item not found for editing.');
        return;
    }

    const editIdInput = document.getElementById('restaurant-menu-edit-id');
    const nameInput = document.getElementById('restaurant-menu-name');
    const categoryInput = document.getElementById('restaurant-menu-category');
    const priceInput = document.getElementById('restaurant-menu-price');
    const caloriesInput = document.getElementById('restaurant-menu-calories');
    const emojiInput = document.getElementById('restaurant-menu-emoji');
    const imageUrlInput = document.getElementById('restaurant-menu-image-url');
    const imageFileInput = document.getElementById('restaurant-menu-image-file');
    const imageDataInput = document.getElementById('restaurant-menu-image-data');
    const descriptionInput = document.getElementById('restaurant-menu-description');
    const saveButton = document.getElementById('restaurant-menu-save-btn');

    if (editIdInput) editIdInput.value = String(item.id);
    if (nameInput) nameInput.value = item.name;
    if (categoryInput) categoryInput.value = item.category;
    if (priceInput) priceInput.value = Number(item.price || 0).toFixed(2);
    if (caloriesInput) caloriesInput.value = String(item.calories || 0);
    if (emojiInput) emojiInput.value = item.emoji || '';
    if (imageUrlInput) imageUrlInput.value = normalizeMenuImage(item.image || '');
    if (imageFileInput) imageFileInput.value = '';
    if (imageDataInput) imageDataInput.value = '';
    if (descriptionInput) descriptionInput.value = item.description || '';
    if (saveButton) saveButton.textContent = 'Save Menu Changes';
    setRestaurantMenuImagePreview(
        normalizeMenuImage(item.image || ''),
        item.emoji || '🍽️',
        item.name || 'Menu item'
    );
}

function saveRestaurantMenuItem() {
    if (!currentUserCanAccessRestaurantDashboard()) {
        setRestaurantDashboardMessage('Only restaurant staff can update menu items.', 'error');
        return;
    }

    const editIdInput = document.getElementById('restaurant-menu-edit-id');
    const nameInput = document.getElementById('restaurant-menu-name');
    const categoryInput = document.getElementById('restaurant-menu-category');
    const priceInput = document.getElementById('restaurant-menu-price');
    const caloriesInput = document.getElementById('restaurant-menu-calories');
    const emojiInput = document.getElementById('restaurant-menu-emoji');
    const imageUrlInput = document.getElementById('restaurant-menu-image-url');
    const descriptionInput = document.getElementById('restaurant-menu-description');

    const name = String(nameInput?.value || '').trim();
    const category = normalizeMenuCategory(categoryInput?.value || 'main');
    const price = Number(priceInput?.value || 0);
    const calories = Number(caloriesInput?.value || 0);
    const emoji = String(emojiInput?.value || '').trim() || '🍽️';
    const image = getRestaurantMenuImageValue();
    const description = String(descriptionInput?.value || '').trim() || `Delicious ${name}`;
    const editingId = Number(editIdInput?.value || 0);

    if (!name) {
        showNotification('Menu item name is required.');
        return;
    }

    if (!Number.isFinite(price) || price <= 0) {
        showNotification('Enter a valid menu price greater than zero.');
        return;
    }

    if (!Number.isFinite(calories) || calories < 0) {
        showNotification('Enter valid calories (0 or more).');
        return;
    }

    const record = {
        id: editingId > 0 ? editingId : getNextMenuItemId(),
        name,
        category,
        price: Number(price.toFixed(2)),
        description,
        calories: Math.round(calories),
        emoji,
        image
    };

    if (!image && imageUrlInput && String(imageUrlInput.value || '').trim()) {
        showNotification('Image URL looks invalid. Use a valid link or upload an image.');
        return;
    }

    const existingIndex = menuData.findIndex(item => Number(item.id) === record.id);
    if (existingIndex >= 0) {
        menuData[existingIndex] = record;
        showNotification(`${record.name} updated successfully.`);
    } else {
        menuData.push(record);
        showNotification(`${record.name} added to menu.`);
    }

    persistMenuData();
    renderRestaurantMenuManager();
    resetRestaurantMenuForm();

    if (document.getElementById('menu-grid')) {
        displayMenu(menuViewState.category);
    }
}

function initRestaurantMenuManager() {
    const manager = document.getElementById('restaurant-menu-manager');
    if (!manager) return;

    if (!currentUserCanAccessRestaurantDashboard()) {
        manager.style.display = 'none';
        return;
    }

    manager.style.display = 'block';

    const saveButton = document.getElementById('restaurant-menu-save-btn');
    const clearButton = document.getElementById('restaurant-menu-clear-btn');
    const imageFileInput = document.getElementById('restaurant-menu-image-file');
    const imageUrlInput = document.getElementById('restaurant-menu-image-url');
    const removeImageButton = document.getElementById('restaurant-menu-remove-image-btn');
    const emojiInput = document.getElementById('restaurant-menu-emoji');
    const nameInput = document.getElementById('restaurant-menu-name');
    const imageDataInput = document.getElementById('restaurant-menu-image-data');

    if (saveButton && !saveButton.dataset.bound) {
        saveButton.dataset.bound = '1';
        saveButton.addEventListener('click', saveRestaurantMenuItem);
    }

    if (clearButton && !clearButton.dataset.bound) {
        clearButton.dataset.bound = '1';
        clearButton.addEventListener('click', resetRestaurantMenuForm);
    }

    if (removeImageButton && !removeImageButton.dataset.bound) {
        removeImageButton.dataset.bound = '1';
        removeImageButton.addEventListener('click', clearRestaurantMenuImage);
    }

    if (imageFileInput && !imageFileInput.dataset.bound) {
        imageFileInput.dataset.bound = '1';
        imageFileInput.addEventListener('change', handleRestaurantMenuImageUpload);
    }

    if (imageUrlInput && !imageUrlInput.dataset.bound) {
        imageUrlInput.dataset.bound = '1';
        imageUrlInput.addEventListener('input', () => {
            const normalizedUrl = normalizeMenuImage(imageUrlInput.value || '');
            if (normalizedUrl && imageDataInput) {
                imageDataInput.value = '';
            }

            const fallbackEmoji = String(emojiInput?.value || '').trim() || '🍽️';
            const itemName = String(nameInput?.value || 'Menu item').trim() || 'Menu item';
            setRestaurantMenuImagePreview(normalizedUrl, fallbackEmoji, itemName);
        });
    }

    if (emojiInput && !emojiInput.dataset.previewBound) {
        emojiInput.dataset.previewBound = '1';
        emojiInput.addEventListener('input', () => {
            if (getRestaurantMenuImageValue()) return;
            const fallbackEmoji = String(emojiInput.value || '').trim() || '🍽️';
            const itemName = String(nameInput?.value || 'Menu item').trim() || 'Menu item';
            setRestaurantMenuImagePreview('', fallbackEmoji, itemName);
        });
    }

    renderRestaurantMenuManager();
    resetRestaurantMenuForm();
}

function initRestaurantDashboard() {
    const listEl = document.getElementById('restaurant-orders-list');
    if (!listEl) return;

    if (!listEl.dataset.orderActionsBound) {
        listEl.dataset.orderActionsBound = '1';
        listEl.addEventListener('click', handleRestaurantOrderActionClick);
    }

    if (!currentUserCanAccessRestaurantDashboard()) {
        setRestaurantDashboardMessage('Access denied. Restaurant dashboard is only for staff accounts.', 'error');
        return;
    }

    ensureRestaurantDashboardTokenForPrivilegedUser();

    const tokenInput = document.getElementById('restaurant-token-input');
    if (tokenInput && ORDER_WORKFLOW_CONFIG.restaurantToken) {
        tokenInput.value = ORDER_WORKFLOW_CONFIG.restaurantToken;
    }

    initRestaurantMenuManager();

    const refreshBtn = document.getElementById('restaurant-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshRestaurantDashboardOrders);
    }

    const exportBtn = document.getElementById('restaurant-export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportRestaurantOrdersCsv);
    }

    const filterEl = document.getElementById('restaurant-status-filter');
    if (filterEl) {
        filterEl.addEventListener('change', refreshRestaurantDashboardOrders);
    }

    if (tokenInput) {
        tokenInput.addEventListener('change', () => {
            localStorage.setItem('restaurant_dashboard_token', tokenInput.value.trim());
        });
    }

    clearInterval(restaurantDashboardRefreshTimer);
    restaurantDashboardRefreshTimer = setInterval(() => {
        refreshRestaurantDashboardOrders({
            showSkeleton: false,
            silent: true
        });
    }, 20000);

    refreshRestaurantDashboardOrders();
}

// ==================== 
// AUTHENTICATION FUNCTIONS
// ====================

async function login() {
    const loginIdentifier = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    const normalizedIdentifier = normalizeLoginIdentifier(loginIdentifier);
    const normalizedEmail = normalizeEmail(loginIdentifier);
    
    if (!normalizedIdentifier || !password) {
        alert('Please enter username/email and password');
        return;
    }

    if (isDefaultRestaurantAdminLogin(normalizedIdentifier, password)) {
        const adminUser = ensureDefaultRestaurantAdminUser(password);
        setCurrentUser(adminUser.email);
        ensureRestaurantDashboardTokenForPrivilegedUser();
        updateAccountUI();
        alert('Restaurant admin login successful. Dashboard access enabled.');
        return;
    }

    try {
        const result = await postAuthJson('/auth/login', {
            email: normalizedEmail,
            password
        });

        const mergedUser = upsertLocalUserFromServer(result.user, password);
        setCurrentUser(normalizeEmail(mergedUser?.email || normalizedEmail));
        updateAccountUI();
        alert('Login successful!');
        return;
    } catch (error) {
        if (!isLikelyConnectivityError(error)) {
            alert(error.message || 'Invalid email or password');
            return;
        }

        // Fallback for local/offline development when auth API is unreachable.
        const users = getUsers();
        const user = users.find(u => normalizeEmail(u.email) === normalizedEmail && u.password === password);
        if (!user) {
            alert('Auth server unreachable and no matching local account was found.');
            return;
        }

        setCurrentUser(user.email);
        updateAccountUI();
        alert('Logged in using local offline account cache.');
    }
}

async function register() {
    const name = document.getElementById('register-name')?.value;
    const email = document.getElementById('register-email')?.value;
    const password = document.getElementById('register-password')?.value;
    const confirm = document.getElementById('register-confirm')?.value;
    const restaurantCode = document.getElementById('register-restaurant-code')?.value;
    const normalizedEmail = normalizeEmail(email);
    const inviteCodeInput = String(restaurantCode || '').trim();
    const configuredInviteCode = getRestaurantInviteCode();
    
    if (!name || !normalizedEmail || !password || !confirm) {
        alert('Please fill in all fields');
        return;
    }
    
    if (password !== confirm) {
        alert('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    const inviteCodeMatches = Boolean(configuredInviteCode)
        && inviteCodeInput.toLowerCase() === configuredInviteCode.toLowerCase();
    if (inviteCodeInput && configuredInviteCode && !inviteCodeMatches) {
        alert('Invalid restaurant invite code. Leave it blank for a regular customer account.');
        return;
    }

    try {
        const result = await postAuthJson('/auth/register', {
            name: String(name).trim(),
            email: normalizedEmail,
            password,
            restaurantCode: inviteCodeInput
        });

        const mergedUser = upsertLocalUserFromServer(result.user, password);
        setCurrentUser(normalizeEmail(mergedUser?.email || normalizedEmail));
        updateAccountUI();

        if (mergedUser?.isRestaurantStaff) {
            alert('Account created successfully with restaurant staff access.');
        } else {
            alert('Account created successfully!');
        }
        return;
    } catch (error) {
        if (!isLikelyConnectivityError(error)) {
            alert(error.message || 'Could not create account.');
            return;
        }

        // Fallback for local/offline development when auth API is unreachable.
        const users = getUsers();
        if (users.find(u => normalizeEmail(u.email) === normalizedEmail)) {
            alert('Email already registered');
            return;
        }

        const isRestaurantStaff = inviteCodeMatches || getRestaurantStaffEmails().includes(normalizedEmail);
        const newUser = {
            name: String(name).trim(),
            email: normalizedEmail,
            phone: '',
            password: password,
            role: isRestaurantStaff ? 'restaurant' : 'customer',
            isRestaurantStaff,
            created: new Date().toLocaleDateString(),
            orders: [],
            addresses: [],
            preferences: {
                newsletter: true,
                promotions: true
            }
        };

        users.push(newUser);
        saveUsers(users);
        setCurrentUser(newUser.email);
        updateAccountUI();
        alert('Account created locally because auth server is unreachable.');
    }
}

function logout() {
    setCurrentUser(null);
    updateAccountUI();
    alert('Logged out successfully!');
}

async function requestPasswordResetCode() {
    const email = document.getElementById('forgot-email')?.value;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
        alert('Please enter your account email first.');
        return;
    }

    try {
        const result = await postAuthJson('/auth/request-password-reset', {
            email: normalizedEmail
        });

        const resetCodeInput = document.getElementById('forgot-reset-code');
        if (resetCodeInput) {
            resetCodeInput.focus();
        }

        if (result?.devResetCode) {
            if (result?.emailWarning) {
                showNotification(result.emailWarning);
            }
            showNotification(`DEV reset code: ${result.devResetCode}`);
            alert(`Reset code sent. DEV code: ${result.devResetCode}`);
            return;
        }

        alert(result?.message || 'If your account exists, a reset code has been sent.');
    } catch (error) {
        if (isLikelyConnectivityError(error)) {
            alert('Cannot reach auth server. Start the backend on port 8787 or set Backend API Base URL to a reachable server.');
            return;
        }

        alert(error.message || 'Could not request password reset code.');
    }
}

async function resetPassword() {
    const email = document.getElementById('forgot-email')?.value;
    const resetCode = document.getElementById('forgot-reset-code')?.value;
    const newPassword = document.getElementById('forgot-new-password')?.value;
    const confirmPassword = document.getElementById('forgot-confirm-password')?.value;
    const normalizedEmail = normalizeEmail(email);
    const normalizedResetCode = String(resetCode || '').trim();

    if (!normalizedEmail || !normalizedResetCode || !newPassword || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    try {
        await postAuthJson('/auth/reset-password', {
            email: normalizedEmail,
            code: normalizedResetCode,
            newPassword
        });
    } catch (error) {
        if (isLikelyConnectivityError(error)) {
            alert('Cannot reach auth server. Start the backend on port 8787 or set Backend API Base URL to a reachable server.');
            return;
        }

        alert(error.message || 'Password reset failed.');
        return;
    }

    updateLocalPasswordCache(normalizedEmail, newPassword);

    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    if (loginEmailInput) loginEmailInput.value = normalizedEmail;
    if (loginPasswordInput) loginPasswordInput.value = '';

    switchToLogin();
    alert('Password reset successful. Please log in with your new password.');
}

function checkUserLogin() {
    updateAccountUI();
}

function updateAccountUI() {
    const currentUser = getCurrentUser();
    const loginSection = document.getElementById('login-section');
    const profileSection = document.getElementById('profile-section');
    const accountLink = document.getElementById('account-link');
    
    if (currentUser) {
        // User is logged in
        if (loginSection) loginSection.style.display = 'none';
        if (profileSection) {
            profileSection.style.display = 'block';
            const user = getUserData(currentUser);
            if (user) {
                const userNameEl = document.getElementById('user-name');
                const profileFullNameEl = document.getElementById('profile-fullname');
                const profileEmailEl = document.getElementById('profile-email');
                const profilePhoneEl = document.getElementById('profile-phone');
                const profileRoleEl = document.getElementById('profile-role');
                const profileRestaurantAccessEl = document.getElementById('profile-restaurant-access');
                const profileCreatedEl = document.getElementById('profile-created');
                const profileOrderCountEl = document.getElementById('profile-order-count');
                const profileAddressCountEl = document.getElementById('profile-address-count');
                const orders = Array.isArray(user.orders) ? user.orders : [];
                const addresses = Array.isArray(user.addresses) ? user.addresses : [];
                const normalizedRole = String(user.role || 'customer').trim().toLowerCase();
                const roleLabel = normalizedRole === 'restaurant'
                    ? 'Restaurant Staff'
                    : normalizedRole === 'admin'
                        ? 'Admin'
                        : normalizedRole === 'staff'
                            ? 'Staff'
                            : 'Customer';
                const hasRestaurantAccess = user.isRestaurantStaff === true
                    || normalizedRole === 'restaurant'
                    || normalizedRole === 'admin'
                    || normalizedRole === 'staff';
                
                if (userNameEl) userNameEl.textContent = user.name;
                if (profileFullNameEl) profileFullNameEl.textContent = user.name || 'N/A';
                if (profileEmailEl) profileEmailEl.textContent = user.email;
                if (profilePhoneEl) profilePhoneEl.textContent = String(user.phone || '').trim() || 'Not set';
                if (profileRoleEl) profileRoleEl.textContent = roleLabel;
                if (profileRestaurantAccessEl) profileRestaurantAccessEl.textContent = hasRestaurantAccess ? 'Enabled' : 'Customer only';
                if (profileCreatedEl) profileCreatedEl.textContent = user.created;
                if (profileOrderCountEl) profileOrderCountEl.textContent = String(orders.length);
                if (profileAddressCountEl) profileAddressCountEl.textContent = String(addresses.length);
                
                displayOrderHistory(orders);
                displaySavedAddresses(addresses);
            }
        }
        if (accountLink) accountLink.textContent = 'Account';
    } else {
        // User is not logged in
        if (loginSection) loginSection.style.display = 'block';
        if (profileSection) profileSection.style.display = 'none';
        if (accountLink) accountLink.textContent = 'Login';
    }

    updateRestaurantNavVisibility();
    updateDeploymentConfigPanelVisibility();
    initDeploymentApiConfigPanel();
    initMobileQuickDock();
    syncMobileQuickDockState();
}

function switchToRegister(evt) {
    const loginFormDiv = document.getElementById('login-form-div');
    const registerFormDiv = document.getElementById('register-form-div');
    const forgotFormDiv = document.getElementById('forgot-password-form-div');

    if (loginFormDiv) loginFormDiv.style.display = 'none';
    if (registerFormDiv) registerFormDiv.style.display = 'block';
    if (forgotFormDiv) forgotFormDiv.style.display = 'none';
    if (evt && typeof evt.preventDefault === 'function') {
        evt.preventDefault();
    }
}

function switchToLogin(evt) {
    const loginFormDiv = document.getElementById('login-form-div');
    const registerFormDiv = document.getElementById('register-form-div');
    const forgotFormDiv = document.getElementById('forgot-password-form-div');

    if (registerFormDiv) registerFormDiv.style.display = 'none';
    if (forgotFormDiv) forgotFormDiv.style.display = 'none';
    if (loginFormDiv) loginFormDiv.style.display = 'block';

    const forgotEmailInput = document.getElementById('forgot-email');
    const forgotResetCodeInput = document.getElementById('forgot-reset-code');
    const forgotNewPasswordInput = document.getElementById('forgot-new-password');
    const forgotConfirmPasswordInput = document.getElementById('forgot-confirm-password');
    if (forgotEmailInput) forgotEmailInput.value = '';
    if (forgotResetCodeInput) forgotResetCodeInput.value = '';
    if (forgotNewPasswordInput) forgotNewPasswordInput.value = '';
    if (forgotConfirmPasswordInput) forgotConfirmPasswordInput.value = '';

    if (evt && typeof evt.preventDefault === 'function') {
        evt.preventDefault();
    }
}

function switchToForgotPassword(evt) {
    const loginFormDiv = document.getElementById('login-form-div');
    const registerFormDiv = document.getElementById('register-form-div');
    const forgotFormDiv = document.getElementById('forgot-password-form-div');

    if (loginFormDiv) loginFormDiv.style.display = 'none';
    if (registerFormDiv) registerFormDiv.style.display = 'none';
    if (forgotFormDiv) forgotFormDiv.style.display = 'block';

    const loginEmail = document.getElementById('login-email')?.value;
    const forgotEmailInput = document.getElementById('forgot-email');
    if (forgotEmailInput && !forgotEmailInput.value) {
        forgotEmailInput.value = normalizeEmail(loginEmail);
    }

    if (evt && typeof evt.preventDefault === 'function') {
        evt.preventDefault();
    }
}

function editProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please log in first to edit your profile.');
        return;
    }

    const user = getUserData(currentUser);
    if (!user) {
        alert('Could not load your profile. Please log in again.');
        return;
    }

    const formEl = document.getElementById('profile-edit-form');
    const nameInput = document.getElementById('edit-profile-name');
    const phoneInput = document.getElementById('edit-profile-phone');
    const emailInput = document.getElementById('edit-profile-email');

    if (!formEl || !nameInput || !phoneInput || !emailInput) {
        alert('Profile editor is not available on this page.');
        return;
    }

    nameInput.value = String(user.name || '').trim();
    phoneInput.value = String(user.phone || '').trim();
    emailInput.value = String(user.email || '').trim();
    formEl.style.display = 'block';
    nameInput.focus();
}

function cancelProfileEdit() {
    const formEl = document.getElementById('profile-edit-form');
    if (formEl) {
        formEl.style.display = 'none';
    }
}

function applyLocalProfileUpdate(currentUser, nextName, nextPhone) {
    const users = getUsers();
    const userIndex = users.findIndex(entry => normalizeEmail(entry.email) === normalizeEmail(currentUser));
    if (userIndex < 0) {
        return false;
    }

    users[userIndex] = {
        ...users[userIndex],
        name: nextName,
        phone: nextPhone
    };

    saveUsers(users);
    return true;
}

async function saveProfileChanges() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please log in first to edit your profile.');
        return;
    }

    const nameInput = document.getElementById('edit-profile-name');
    const phoneInput = document.getElementById('edit-profile-phone');
    const nextName = String(nameInput?.value || '').trim();
    const nextPhone = String(phoneInput?.value || '').trim();

    if (!nextName) {
        showNotification('Full name is required.');
        return;
    }

    try {
        const result = await postAuthJson('/auth/update-profile', {
            email: normalizeEmail(currentUser),
            name: nextName,
            phone: nextPhone
        });

        const mergedUser = upsertLocalUserFromServer(result.user, '');
        if (!mergedUser) {
            throw new Error('Profile update succeeded but local cache update failed.');
        }

        setCurrentUser(normalizeEmail(mergedUser.email || currentUser));
        cancelProfileEdit();
        updateAccountUI();
        showNotification('Profile updated and synced to server.');
        return;
    } catch (error) {
        const message = String(error?.message || '').toLowerCase();
        const shouldFallbackToLocal = isLikelyConnectivityError(error)
            || message.includes('not found')
            || message.includes('unreachable');

        if (!shouldFallbackToLocal) {
            alert(error?.message || 'Could not update profile right now.');
            return;
        }
    }

    const savedLocally = applyLocalProfileUpdate(currentUser, nextName, nextPhone);
    if (!savedLocally) {
        alert('Could not save profile. Please log in again.');
        return;
    }

    cancelProfileEdit();
    updateAccountUI();
    showNotification('Profile saved locally (server sync unavailable).');
}

function addAddress() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please log in first to add an address.');
        return;
    }

    const formCard = document.getElementById('address-form-card');
    if (!formCard) {
        alert('Address form is not available on this page.');
        return;
    }

    const user = getUserData(currentUser);
    const nameInput = document.getElementById('address-name');
    const streetInput = document.getElementById('address-street');
    const districtInput = document.getElementById('address-district');
    const subDistrictInput = document.getElementById('address-subdistrict');
    const cityInput = document.getElementById('address-city');
    const zipInput = document.getElementById('address-zip');

    if (nameInput) nameInput.value = '';
    if (streetInput) streetInput.value = '';
    if (districtInput) districtInput.value = String(user?.addresses?.[0]?.district || '');
    if (subDistrictInput) subDistrictInput.value = String(user?.addresses?.[0]?.subDistrict || user?.addresses?.[0]?.subdistrict || '');
    if (cityInput) cityInput.value = String(user?.addresses?.[0]?.city || 'Abuja');
    if (zipInput) zipInput.value = '';

    formCard.style.display = 'block';
    if (streetInput) {
        streetInput.focus();
    }
}

function cancelAddressForm() {
    const formCard = document.getElementById('address-form-card');
    if (formCard) {
        formCard.style.display = 'none';
    }

    const nameInput = document.getElementById('address-name');
    const streetInput = document.getElementById('address-street');
    const districtInput = document.getElementById('address-district');
    const subDistrictInput = document.getElementById('address-subdistrict');
    const cityInput = document.getElementById('address-city');
    const zipInput = document.getElementById('address-zip');

    if (nameInput) nameInput.value = '';
    if (streetInput) streetInput.value = '';
    if (districtInput) districtInput.value = '';
    if (subDistrictInput) subDistrictInput.value = '';
    if (cityInput) cityInput.value = '';
    if (zipInput) zipInput.value = '';
}

function saveAddressFromForm() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please log in first to add an address.');
        return;
    }

    const user = getUserData(currentUser);
    if (!user) {
        alert('Could not find your account details. Please log in again.');
        return;
    }

    const nameInput = document.getElementById('address-name');
    const streetInput = document.getElementById('address-street');
    const districtInput = document.getElementById('address-district');
    const subDistrictInput = document.getElementById('address-subdistrict');
    const cityInput = document.getElementById('address-city');
    const zipInput = document.getElementById('address-zip');

    const name = String(nameInput?.value || '').trim() || 'Address';
    const street = String(streetInput?.value || '').trim();
    const district = String(districtInput?.value || '').trim();
    const subDistrict = String(subDistrictInput?.value || '').trim();
    const city = String(cityInput?.value || '').trim();
    const zip = String(zipInput?.value || '').trim();

    if (!street || !district || !subDistrict || !city) {
        showNotification('Street, district, subdistrict, and city are required to save an address.');
        return;
    }

    const nextAddress = {
        name,
        street,
        district,
        subDistrict,
        city,
        zip: zip || 'N/A'
    };

    const users = getUsers();
    const userIndex = users.findIndex(entry => normalizeEmail(entry.email) === normalizeEmail(currentUser));
    if (userIndex < 0) {
        alert('Could not save address right now. Please log in again.');
        return;
    }

    const targetUser = users[userIndex];
    if (!Array.isArray(targetUser.addresses)) {
        targetUser.addresses = [];
    }

    targetUser.addresses.push(nextAddress);
    users[userIndex] = targetUser;
    saveUsers(users);

    displaySavedAddresses(targetUser.addresses);
    cancelAddressForm();
    showNotification('Address added successfully.');
}

function useAddressForCheckout(index, shouldRedirect = true) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please log in first to use a saved address.');
        return;
    }

    const user = getUserData(currentUser);
    if (!user || !Array.isArray(user.addresses)) {
        alert('No saved addresses found for your account.');
        return;
    }

    const address = user.addresses[index];
    if (!address) {
        showNotification('Selected address was not found.');
        return;
    }

    saveSelectedCheckoutAddress(address);
    showNotification(`${String(address.name || 'Address')} selected for checkout.`);

    if (shouldRedirect) {
        window.location.href = 'checkout.html';
    }
}

function savePreferences() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        let user = getUserData(currentUser);
        if (user) {
            user.preferences = {
                newsletter: document.getElementById('pref-newsletter')?.checked,
                promotions: document.getElementById('pref-promotions')?.checked
            };
            
            let users = getUsers();
            const userIndex = users.findIndex(u => u.email === currentUser);
            if (userIndex >= 0) {
                users[userIndex] = user;
                saveUsers(users);
                alert('Preferences saved!');
            }
        }
    }
}

function displayOrderHistory(orders) {
    const container = document.getElementById('order-history');
    if (!container) return;
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p style="color: #999;">No orders yet</p>';
        return;
    }
    
    container.innerHTML = '';
    orders.forEach(order => {
        const html = `
            <div style="padding: 1rem; background-color: #f5f5f5; border-radius: 5px; margin-bottom: 1rem;">
                <div><strong>${order.id}</strong></div>
                <div>Date: ${order.date}</div>
                <div>Total: ₦${Number(order.total || 0).toFixed(2)}</div>
                <div>Status: ${getOrderStatusLabel(order.status)}</div>
            </div>
        `;
        container.innerHTML += html;
    });

    queueScrollRevealTargets(container);
}

function displaySavedAddresses(addresses) {
    const container = document.getElementById('saved-addresses');
    if (!container) return;
    
    if (!addresses || addresses.length === 0) {
        container.innerHTML = '<p style="color: #999;">No saved addresses</p>';
        return;
    }
    
    container.innerHTML = '';
    addresses.forEach((address, index) => {
        const html = `
            <div class="saved-address-card" onclick="useAddressForCheckout(${index}, false)" title="Click to select this address for checkout">
                <div><strong>${address.name}</strong></div>
                <div>${address.street}</div>
                <div>${address.subDistrict || address.subdistrict || 'N/A'}, ${address.district || 'N/A'}</div>
                <div>${address.city}, ${address.zip}</div>
                <div class="saved-address-actions">
                    <button type="button" onclick="event.stopPropagation(); useAddressForCheckout(${index}, true)" class="btn btn-primary" style="font-size: 0.8rem; padding: 4px 8px;">Use for Checkout</button>
                    <button type="button" onclick="event.stopPropagation(); removeAddress(${index})" class="btn btn-secondary" style="font-size: 0.8rem; padding: 4px 8px;">Remove</button>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });

    queueScrollRevealTargets(container);
}

function removeAddress(index) {
    if (confirm('Remove this address?')) {
        const currentUser = getCurrentUser();
        if (currentUser) {
            let user = getUserData(currentUser);
            if (user && user.addresses) {
                user.addresses.splice(index, 1);
                
                let users = getUsers();
                const userIndex = users.findIndex(u => u.email === currentUser);
                if (userIndex >= 0) {
                    users[userIndex] = user;
                    saveUsers(users);
                    displaySavedAddresses(user.addresses);
                }
            }
        }
    }
}

// ==================== 
// UTILITY FUNCTIONS
// ====================

function showNotification(message) {
    let toast = document.getElementById('app-toast');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('active');

    clearTimeout(showNotification._timer);
    showNotification._timer = setTimeout(() => {
        toast.classList.remove('active');
    }, 2200);
}

function normalizeBaseApiUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
}

function normalizeVerifyApiUrl(value) {
    return String(value || '').trim();
}

function isValidHttpUrl(value) {
    const input = String(value || '').trim();
    if (!input) return false;

    try {
        const parsed = new URL(input);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (error) {
        return false;
    }
}

function getDeploymentApiConfigSnapshot() {
    return {
        baseUrl: normalizeBaseApiUrl(localStorage.getItem('order_api_base_url') || ORDER_WORKFLOW_CONFIG.baseUrl || ''),
        verifyEndpoint: normalizeVerifyApiUrl(localStorage.getItem('payment_verify_endpoint') || PAYMENT_GATEWAY_CONFIG.verificationEndpoint || '')
    };
}

function updateDeploymentConfigStatus(message, state = 'pending') {
    const statusEl = document.getElementById('deployment-config-status');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `deployment-config-status ${state}`;
}

function populateDeploymentApiConfigForm() {
    const baseInput = document.getElementById('deploy-order-api-base');
    const verifyInput = document.getElementById('deploy-payment-verify-endpoint');
    if (!baseInput || !verifyInput) return;

    const snapshot = getDeploymentApiConfigSnapshot();
    baseInput.value = snapshot.baseUrl;
    verifyInput.value = snapshot.verifyEndpoint;

    if (!snapshot.baseUrl) {
        updateDeploymentConfigStatus('Current API: Auto mode', 'pending');
        return;
    }

    updateDeploymentConfigStatus(`Current API: ${snapshot.baseUrl}`, 'success');
}

function applyDeploymentApiConfig(baseUrl, verifyEndpoint) {
    const normalizedBaseUrl = normalizeBaseApiUrl(baseUrl);
    const normalizedVerify = normalizeVerifyApiUrl(verifyEndpoint || `${normalizedBaseUrl}/verify-payment`);

    ORDER_WORKFLOW_CONFIG.baseUrl = normalizedBaseUrl || DEFAULT_ORDER_API_BASE_URL;
    PAYMENT_GATEWAY_CONFIG.verificationEndpoint = normalizedVerify || DEFAULT_PAYMENT_VERIFY_ENDPOINT;

    if (normalizedBaseUrl) {
        localStorage.setItem('order_api_base_url', normalizedBaseUrl);
    } else {
        localStorage.removeItem('order_api_base_url');
    }

    if (normalizedVerify) {
        localStorage.setItem('payment_verify_endpoint', normalizedVerify);
    } else {
        localStorage.removeItem('payment_verify_endpoint');
    }
}

function saveDeploymentApiConfigFromForm() {
    const baseInput = document.getElementById('deploy-order-api-base');
    const verifyInput = document.getElementById('deploy-payment-verify-endpoint');
    if (!baseInput || !verifyInput) return;

    const baseUrl = normalizeBaseApiUrl(baseInput.value);
    let verifyEndpoint = normalizeVerifyApiUrl(verifyInput.value);

    if (!baseUrl) {
        updateDeploymentConfigStatus('Please enter a backend API base URL.', 'error');
        return;
    }

    if (!isValidHttpUrl(baseUrl)) {
        updateDeploymentConfigStatus('Backend API base URL is invalid.', 'error');
        return;
    }

    if (!verifyEndpoint) {
        verifyEndpoint = `${baseUrl}/verify-payment`;
        verifyInput.value = verifyEndpoint;
    }

    if (!isValidHttpUrl(verifyEndpoint)) {
        updateDeploymentConfigStatus('Payment verify endpoint is invalid.', 'error');
        return;
    }

    applyDeploymentApiConfig(baseUrl, verifyEndpoint);
    updateDeploymentConfigStatus(`Saved. Current API: ${baseUrl}`, 'success');
    showNotification('Live API settings saved.');
}

async function testDeploymentApiConfigConnection() {
    const baseInput = document.getElementById('deploy-order-api-base');
    if (!baseInput) return;

    const baseUrl = normalizeBaseApiUrl(baseInput.value);
    if (!baseUrl || !isValidHttpUrl(baseUrl)) {
        updateDeploymentConfigStatus('Enter a valid backend API base URL before testing.', 'error');
        return;
    }

    updateDeploymentConfigStatus('Testing backend connection...', 'pending');

    try {
        const response = await fetch(`${baseUrl}/orders?status=all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Restaurant-Token': ORDER_WORKFLOW_CONFIG.restaurantToken || DEFAULT_RESTAURANT_DASHBOARD_TOKEN
            }
        });

        if (response.ok || response.status === 401 || response.status === 403) {
            updateDeploymentConfigStatus('Connection successful. Backend is reachable.', 'success');
            showNotification('Backend connection test successful.');
            return;
        }

        updateDeploymentConfigStatus(`Backend reached but returned status ${response.status}.`, 'pending');
    } catch (error) {
        updateDeploymentConfigStatus('Connection failed. Check URL, CORS, and backend status.', 'error');
    }
}

function resetDeploymentApiConfigToDefault() {
    applyDeploymentApiConfig('', '');
    populateDeploymentApiConfigForm();
    updateDeploymentConfigStatus('Reset complete. Using default API mode.', 'pending');
    showNotification('API settings reset to defaults.');
}

function shouldShowDeploymentConfigPanel() {
    const params = new URLSearchParams(window.location.search || '');
    if (params.get('showApiSettings') === '1') {
        return true;
    }

    return currentUserCanAccessRestaurantDashboard();
}

function updateDeploymentConfigPanelVisibility() {
    const section = document.getElementById('deployment-config-section');
    if (!section) return false;

    const shouldShow = shouldShowDeploymentConfigPanel();
    section.style.display = shouldShow ? 'block' : 'none';
    section.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    return shouldShow;
}

function initDeploymentApiConfigPanel() {
    const panelVisible = updateDeploymentConfigPanelVisibility();
    const baseInput = document.getElementById('deploy-order-api-base');
    const verifyInput = document.getElementById('deploy-payment-verify-endpoint');
    if (!baseInput || !verifyInput) return;

    if (!panelVisible) {
        return;
    }

    populateDeploymentApiConfigForm();

    if (!baseInput.dataset.bound) {
        baseInput.dataset.bound = '1';
        baseInput.addEventListener('change', () => {
            const nextBase = normalizeBaseApiUrl(baseInput.value);
            if (!verifyInput.value.trim() && isValidHttpUrl(nextBase)) {
                verifyInput.value = `${nextBase}/verify-payment`;
            }
        });
    }
}

const aiConversationState = {
    lastIntent: '',
    lastMatchedItemIds: []
};

function getAIProviderConfig() {
    const defaultEndpoint = 'https://api.openai.com/v1/responses';
    const remoteEnabled = localStorage.getItem('restaurant_ai_remote_enabled');

    return {
        enabled: remoteEnabled !== '0',
        apiKey: window.RESTAURANT_AI_API_KEY || localStorage.getItem('restaurant_ai_api_key') || '',
        endpoint: window.RESTAURANT_AI_ENDPOINT || localStorage.getItem('restaurant_ai_endpoint') || defaultEndpoint,
        model: window.RESTAURANT_AI_MODEL || localStorage.getItem('restaurant_ai_model') || 'gpt-4.1-mini'
    };
}

function buildAIContextSnapshot() {
    const cart = getCart();
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const currentUser = getCurrentUser();
    const currentUserData = currentUser ? getUserData(currentUser) : null;
    const activeOrder = getActiveDeliveryOrder();

    const menuSummary = menuData
        .map(item => `${item.name} | ${item.category} | ${formatNaira(item.price)} | ${item.calories} cal`)
        .join('\n');

    return [
        `Available menu items:\n${menuSummary}`,
        `Cart count: ${cartCount}`,
        `Cart subtotal: ${formatNaira(cartSubtotal)}`,
        `Logged in user: ${currentUserData ? currentUserData.name : 'None'}`,
        `Active order: ${activeOrder ? `${activeOrder.id} (${getOrderStatusLabel(activeOrder.status)})` : 'None'}`,
        'Checkout payment methods: Cash on Delivery, Card Payment (must be verified), Bank Transfer (must be verified).',
        'Delivery fee is fixed at ₦5.00 and tax is 10%.'
    ].join('\n\n');
}

function extractResponseOutputText(apiResponse) {
    if (!apiResponse || typeof apiResponse !== 'object') return '';

    if (typeof apiResponse.output_text === 'string' && apiResponse.output_text.trim()) {
        return apiResponse.output_text.trim();
    }

    const outputBlocks = Array.isArray(apiResponse.output) ? apiResponse.output : [];
    for (const block of outputBlocks) {
        const contentItems = Array.isArray(block?.content) ? block.content : [];
        for (const content of contentItems) {
            if (content?.type === 'output_text' && typeof content?.text === 'string' && content.text.trim()) {
                return content.text.trim();
            }
        }
    }

    return '';
}

async function getRemoteAIResponse(question) {
    const config = getAIProviderConfig();
    if (!config.enabled || !config.apiKey) {
        return '';
    }

    const contextSnapshot = buildAIContextSnapshot();
    const systemPrompt = [
        'You are an assistant for a restaurant ordering web app.',
        'Be concise, practical, and accurate based on provided context.',
        'Do not invent menu items or prices.',
        'If asked for payment confirmation, explain that card and transfer must be verified before order placement.'
    ].join(' ');

    const payload = {
        model: config.model,
        input: [
            {
                role: 'system',
                content: [
                    {
                        type: 'input_text',
                        text: systemPrompt
                    }
                ]
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'input_text',
                        text: `Context:\n${contextSnapshot}\n\nUser question: ${question}`
                    }
                ]
            }
        ],
        temperature: 0.3,
        max_output_tokens: 260
    };

    const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Remote AI request failed (${response.status}).`);
    }

    const result = await response.json();
    return extractResponseOutputText(result);
}

function normalizeAIText(value) {
    return (value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenizeAIText(value) {
    const normalized = normalizeAIText(value);
    return normalized ? normalized.split(' ') : [];
}

function formatNaira(value) {
    return `₦${Number(value || 0).toFixed(2)}`;
}

function findAIMenuMatches(question) {
    const normalizedQuestion = normalizeAIText(question);
    const terms = tokenizeAIText(question);

    const scored = menuData
        .map(item => {
            const normalizedName = normalizeAIText(item.name);
            const normalizedDescription = normalizeAIText(item.description);
            const nameTokens = tokenizeAIText(item.name);
            const descriptionTokens = tokenizeAIText(item.description);
            let score = 0;

            if (normalizedQuestion.includes(normalizedName)) {
                score += 8;
            }

            nameTokens.forEach(token => {
                if (terms.includes(token)) score += 2;
            });

            descriptionTokens.forEach(token => {
                if (terms.includes(token)) score += 1;
            });

            return { item, score };
        })
        .filter(entry => entry.score >= 2)
        .sort((a, b) => b.score - a.score);

    return scored.map(entry => entry.item);
}

function getAIReferencedItems(question, directMatches) {
    if (directMatches.length > 0) {
        return directMatches;
    }

    const text = normalizeAIText(question);
    const referencesLastItem = /\b(it|that|this|one|same|them|those)\b/.test(text);
    if (!referencesLastItem || aiConversationState.lastMatchedItemIds.length === 0) {
        return [];
    }

    return aiConversationState.lastMatchedItemIds
        .map(itemId => menuData.find(item => item.id === itemId))
        .filter(Boolean);
}

function extractAIBudget(question) {
    const normalized = normalizeAIText(question);
    const explicitMatch = normalized.match(/\b(?:under|below|less than|max(?:imum)?|budget|within)\s*(\d+(?:\.\d+)?)\b/);
    if (explicitMatch) {
        return parseFloat(explicitMatch[1]);
    }

    if (/(cheap|afford|budget|low cost)/.test(normalized)) {
        const anyNumber = normalized.match(/\b(\d+(?:\.\d+)?)\b/);
        if (anyNumber) {
            return parseFloat(anyNumber[1]);
        }
    }

    return null;
}

function detectAICategory(question) {
    const normalized = normalizeAIText(question);
    const categoryMap = {
        appetizers: ['appetizer', 'appetizers', 'starter', 'starters', 'snack', 'snacks'],
        main: ['main', 'mains', 'entree', 'entrees', 'main course', 'main courses'],
        sides: ['side', 'sides'],
        desserts: ['dessert', 'desserts', 'sweet', 'sweets', 'cake', 'ice cream'],
        beverages: ['beverage', 'beverages', 'drink', 'drinks', 'juice', 'tea', 'cola', 'soda']
    };

    for (const [category, aliases] of Object.entries(categoryMap)) {
        if (aliases.some(alias => normalized.includes(alias))) {
            return category;
        }
    }

    return null;
}

function formatAIItemList(items, maxCount = 4) {
    return items
        .slice(0, maxCount)
        .map(item => `${item.name} (${formatNaira(item.price)})`)
        .join(', ');
}

function finalizeAIResponse(intent, matchedItems, message) {
    aiConversationState.lastIntent = intent;
    aiConversationState.lastMatchedItemIds = (matchedItems || []).map(item => item.id);
    return message;
}

function initAIAssistant() {
    if (document.getElementById('ai-assistant')) return;

    const assistant = document.createElement('div');
    assistant.id = 'ai-assistant';
    assistant.className = 'ai-assistant';
    assistant.innerHTML = `
        <div class="ai-panel" id="ai-panel">
            <div class="ai-header">
                <div>
                    <strong>AI Assistant</strong>
                    <small>Instant app help</small>
                </div>
                <button class="ai-close" type="button" id="ai-close" aria-label="Close assistant">&times;</button>
            </div>
            <div class="ai-messages" id="ai-messages"></div>
            <div class="ai-quick">
                <button type="button" data-prompt="Recommend something under 10">Budget picks</button>
                <button type="button" data-prompt="What is the price of Pizza?">Check item price</button>
                <button type="button" data-prompt="How do I checkout?">Checkout help</button>
            </div>
            <div class="ai-input">
                <input id="ai-input" type="text" placeholder="Ask about menu, cart, checkout...">
                <button type="button" id="ai-send">Send</button>
            </div>
        </div>
        <button class="ai-trigger" id="ai-trigger" type="button" aria-label="Open AI assistant">AI</button>
    `;

    document.body.appendChild(assistant);

    const panel = document.getElementById('ai-panel');
    const trigger = document.getElementById('ai-trigger');
    const close = document.getElementById('ai-close');
    const input = document.getElementById('ai-input');
    const send = document.getElementById('ai-send');
    const quickButtons = assistant.querySelectorAll('.ai-quick button');

    if (!panel || !trigger || !close || !input || !send) return;

    const sendPrompt = async (promptText) => {
        const prompt = (promptText || input.value || '').trim();
        if (!prompt) return;

        appendAIMessage(prompt, 'user');
        input.value = '';

        input.disabled = true;
        send.disabled = true;
        const typingMessage = appendAIMessage('Thinking...', 'bot');

        try {
            const response = await getAIResponse(prompt);
            if (typingMessage?.parentElement) {
                typingMessage.parentElement.removeChild(typingMessage);
            }
            appendAIMessage(response, 'bot');
        } catch (error) {
            if (typingMessage?.parentElement) {
                typingMessage.parentElement.removeChild(typingMessage);
            }
            appendAIMessage('I ran into an AI service issue, so I switched to local assistant mode. Please try again.', 'bot');
        } finally {
            input.disabled = false;
            send.disabled = false;
            input.focus();
        }
    };

    trigger.addEventListener('click', () => {
        panel.classList.toggle('active');
        if (panel.classList.contains('active')) {
            input.focus();
        }
    });

    close.addEventListener('click', () => panel.classList.remove('active'));
    send.addEventListener('click', () => sendPrompt());
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendPrompt();
        }
    });

    quickButtons.forEach(button => {
        button.addEventListener('click', () => sendPrompt(button.dataset.prompt));
    });

    appendAIMessage('Hi, I am your AI assistant. I can understand item names, compare meals, suggest options by budget, and help with checkout, payment, and step-by-step order status. For real LLM mode, run: /ai-key YOUR_KEY', 'bot');
}

function appendAIMessage(text, role) {
    const container = document.getElementById('ai-messages');
    if (!container) return null;

    const message = document.createElement('div');
    message.className = `ai-msg ${role}`;
    message.textContent = text;
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
    return message;
}

function getLocalAIResponse(question) {
    const text = normalizeAIText(question);
    const directMatches = findAIMenuMatches(question);
    const referencedItems = getAIReferencedItems(question, directMatches);
    const budget = extractAIBudget(question);
    const detectedCategory = detectAICategory(question);
    const cart = getCart();
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const activeOrder = getActiveDeliveryOrder();
    const currentUser = getCurrentUser();
    const currentUserData = currentUser ? getUserData(currentUser) : null;

    if (/\b(hello|hi|hey)\b/.test(text)) {
        const name = currentUserData?.name ? ` ${currentUserData.name}` : '';
        return finalizeAIResponse('greeting', referencedItems, `Hi${name}. Ask me for recommendations, item prices, calorie info, cart totals, checkout steps, or delivery status.`);
    }

    if (/\b(compare|difference|vs|versus)\b/.test(text) && referencedItems.length >= 2) {
        const first = referencedItems[0];
        const second = referencedItems[1];
        const priceDiff = Math.abs(first.price - second.price).toFixed(2);
        const calorieDiff = Math.abs(first.calories - second.calories);
        const cheaperText = first.price === second.price
            ? 'Both have the same price.'
            : first.price < second.price
                ? `${first.name} is cheaper by ${formatNaira(priceDiff)}.`
                : `${second.name} is cheaper by ${formatNaira(priceDiff)}.`;

        return finalizeAIResponse(
            'compare',
            [first, second],
            `${first.name}: ${formatNaira(first.price)}, ${first.calories} cal. ${second.name}: ${formatNaira(second.price)}, ${second.calories} cal. ${cheaperText} Calorie difference is ${calorieDiff} cal.`
        );
    }

    if (/\b(price|cost|how much|amount)\b/.test(text)) {
        if (referencedItems.length === 1) {
            const item = referencedItems[0];
            return finalizeAIResponse('price', [item], `${item.name} costs ${formatNaira(item.price)} and has ${item.calories} calories.`);
        }

        if (referencedItems.length > 1) {
            return finalizeAIResponse('price', referencedItems, `Here are the prices: ${formatAIItemList(referencedItems, 5)}.`);
        }

        const cheapest = [...menuData].sort((a, b) => a.price - b.price)[0];
        return finalizeAIResponse('price', [cheapest], `Tell me the item name and I will give the exact price. Our cheapest item right now is ${cheapest.name} at ${formatNaira(cheapest.price)}.`);
    }

    if (/\b(calorie|calories|kcal|nutrition)\b/.test(text)) {
        if (referencedItems.length === 1) {
            const item = referencedItems[0];
            return finalizeAIResponse('calories', [item], `${item.name} contains about ${item.calories} calories.`);
        }

        if (referencedItems.length > 1) {
            const summary = referencedItems
                .slice(0, 5)
                .map(item => `${item.name} (${item.calories} cal)`)
                .join(', ');
            return finalizeAIResponse('calories', referencedItems, `Calorie info: ${summary}.`);
        }

        return finalizeAIResponse('calories', [], 'Tell me which menu item you want calorie info for, for example: "Calories in Pizza".');
    }

    if (budget !== null || /\b(cheap|afford|budget|low cost|economy)\b/.test(text)) {
        const pool = detectedCategory
            ? menuData.filter(item => item.category === detectedCategory)
            : [...menuData];

        const limit = budget !== null ? budget : 10;
        const picks = pool
            .filter(item => item.price <= limit)
            .sort((a, b) => a.price - b.price);

        if (picks.length === 0) {
            const cheapest = pool.sort((a, b) => a.price - b.price)[0];
            const categoryLabel = detectedCategory ? `${detectedCategory} category` : 'menu';
            return finalizeAIResponse('budget', cheapest ? [cheapest] : [], `I could not find items under ${formatNaira(limit)} in the ${categoryLabel}. The lowest option is ${cheapest.name} at ${formatNaira(cheapest.price)}.`);
        }

        const topPicks = picks.slice(0, 5);
        return finalizeAIResponse('budget', topPicks, `Best picks under ${formatNaira(limit)}: ${formatAIItemList(topPicks, 5)}.`);
    }

    if (detectedCategory && /\b(show|list|menu|available|options|items)\b/.test(text)) {
        const categoryItems = menuData
            .filter(item => item.category === detectedCategory)
            .sort((a, b) => a.price - b.price);

        return finalizeAIResponse(
            'category-list',
            categoryItems,
            `${detectedCategory.charAt(0).toUpperCase() + detectedCategory.slice(1)} options: ${formatAIItemList(categoryItems, 6)}.`
        );
    }

    if (/\b(popular|recommend|best|suggest|what should i eat|what should i order)\b/.test(text)) {
        const preferredPool = detectedCategory
            ? menuData.filter(item => item.category === detectedCategory)
            : [...menuData];
        const budgetFilteredPool = budget !== null
            ? preferredPool.filter(item => item.price <= budget)
            : preferredPool;

        const priorityIds = [5, 4, 1, 14, 7, 10];
        const recommendations = budgetFilteredPool
            .sort((a, b) => {
                const aPriority = priorityIds.includes(a.id) ? 1 : 0;
                const bPriority = priorityIds.includes(b.id) ? 1 : 0;
                if (aPriority !== bPriority) return bPriority - aPriority;
                return a.price - b.price;
            })
            .slice(0, 4);

        if (recommendations.length === 0) {
            return finalizeAIResponse('recommend', [], 'I could not find a recommendation with those constraints. Try a higher budget or remove category limits.');
        }

        return finalizeAIResponse('recommend', recommendations, `Great choices to consider: ${formatAIItemList(recommendations)}.`);
    }

    if (/\b(cart|basket|add|remove|total)\b/.test(text)) {
        if (cartCount === 0) {
            return finalizeAIResponse('cart', [], 'Your cart is empty right now. Add items from the Menu page and I can estimate your total instantly.');
        }

        const estimatedTax = cartSubtotal * 0.1;
        const estimatedDelivery = 5;
        const estimatedTotal = cartSubtotal + estimatedTax + estimatedDelivery;
        return finalizeAIResponse(
            'cart',
            [],
            `Your cart has ${cartCount} item(s). Subtotal is ${formatNaira(cartSubtotal)}, tax about ${formatNaira(estimatedTax)}, delivery ${formatNaira(estimatedDelivery)}, estimated total ${formatNaira(estimatedTotal)}.`
        );
    }

    if (/\b(checkout|place order|order now|buy now)\b/.test(text)) {
        return finalizeAIResponse('checkout', [], 'Go to Cart, click Proceed to Checkout, fill delivery details, choose your payment method, and confirm payment first for Card or Bank Transfer. Place Order is enabled only after payment verification for those methods.');
    }

    if (/\b(delivery|track|status|eta|arrival|rider)\b/.test(text)) {
        if (!activeOrder) {
            return finalizeAIResponse('delivery', [], 'No active order is running yet. Place an order and I will show step-by-step status updates.');
        }

        const status = getOrderStatusLabel(activeOrder.status);
        return finalizeAIResponse('delivery', [], `Order ${activeOrder.id} is currently at: ${status}.`);
    }

    if (/\b(pay|payment|bank|transfer|cash|card)\b/.test(text)) {
        return finalizeAIResponse('payment', [], 'Payment options are Cash on Delivery, Card, and Bank Transfer. Card and Bank Transfer must be verified successfully before Place Order will work.');
    }

    if (/\b(account|login|register|profile|orders)\b/.test(text)) {
        if (!currentUserData) {
            return finalizeAIResponse('account', [], 'Open Account to register or login. After login, you can see order history, saved addresses, and notification preferences.');
        }

        const totalOrders = (currentUserData.orders || []).length;
        return finalizeAIResponse('account', [], `You are logged in as ${currentUserData.name}. You currently have ${totalOrders} saved order(s) in your account history.`);
    }

    if (/\b(help|what can you do|commands)\b/.test(text)) {
        return finalizeAIResponse('help', [], 'I can recommend meals, match menu items even with casual wording, provide prices and calories, compare dishes, estimate cart totals, explain checkout/payment, and report delivery status. Try: "Compare pizza and burger".');
    }

    if (referencedItems.length > 0) {
        const item = referencedItems[0];
        return finalizeAIResponse('item-fallback', [item], `${item.name} is ${formatNaira(item.price)} with ${item.calories} calories. Ask me to compare it, find cheaper options, or add budget limits.`);
    }

    return finalizeAIResponse('fallback', [], 'I can answer menu, cart, checkout, payment, account, and delivery questions. You can ask things like "Recommend dinner under 12" or "What is the price of grilled salmon?".');
}

function handleAIConfigCommand(question) {
    const trimmed = (question || '').trim();

    if (/^\/ai-on$/i.test(trimmed)) {
        localStorage.setItem('restaurant_ai_remote_enabled', '1');
        return 'Remote AI mode enabled.';
    }

    if (/^\/ai-off$/i.test(trimmed)) {
        localStorage.setItem('restaurant_ai_remote_enabled', '0');
        return 'Remote AI mode disabled. Using local assistant only.';
    }

    const keyMatch = trimmed.match(/^\/ai-key\s+(.+)$/i);
    if (keyMatch) {
        const key = keyMatch[1].trim();
        localStorage.setItem('restaurant_ai_api_key', key);
        localStorage.setItem('restaurant_ai_remote_enabled', '1');
        return 'AI API key saved for this browser. Remote AI mode is active.';
    }

    const modelMatch = trimmed.match(/^\/ai-model\s+(.+)$/i);
    if (modelMatch) {
        localStorage.setItem('restaurant_ai_model', modelMatch[1].trim());
        return `AI model set to ${modelMatch[1].trim()}.`;
    }

    const endpointMatch = trimmed.match(/^\/ai-endpoint\s+(.+)$/i);
    if (endpointMatch) {
        localStorage.setItem('restaurant_ai_endpoint', endpointMatch[1].trim());
        return 'AI endpoint updated successfully.';
    }

    if (/^\/ai-status$/i.test(trimmed)) {
        const config = getAIProviderConfig();
        return `Remote AI ${config.enabled ? 'enabled' : 'disabled'}. Model: ${config.model}. Endpoint: ${config.endpoint}. API key: ${config.apiKey ? 'set' : 'not set'}.`;
    }

    return '';
}

async function getAIResponse(question) {
    const commandResponse = handleAIConfigCommand(question);
    if (commandResponse) {
        return commandResponse;
    }

    const localResponse = getLocalAIResponse(question);
    const localIntent = aiConversationState.lastIntent;
    const localOnlyIntents = new Set(['cart', 'delivery', 'account', 'payment', 'checkout', 'price', 'calories', 'compare', 'item-fallback']);
    if (localOnlyIntents.has(localIntent)) {
        return localResponse;
    }

    const config = getAIProviderConfig();
    if (!config.enabled || !config.apiKey) {
        return localResponse;
    }

    try {
        const remoteResponse = await getRemoteAIResponse(question);
        if (remoteResponse) {
            return remoteResponse;
        }
    } catch (error) {
        if (localIntent === 'fallback') {
            return `${localResponse} Remote AI is currently unavailable.`;
        }
    }

    return localResponse;
}

// Initialize app on page load
window.addEventListener('DOMContentLoaded', function() {
    initEnhancedSiteExperience();
    initAddressAutocomplete();
    initDeploymentApiConfigPanel();
    updateCartCount();
    updateAccountUI();
    updateRestaurantNavVisibility();
    enforceRestaurantPageAccess();
    initAIAssistant();
    initRestaurantDashboard();
});
