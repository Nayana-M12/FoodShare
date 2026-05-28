// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

// In-app feedback utilities (toast + confirm modal)
(function initAppFeedback() {
    if (window.appToast && window.appConfirm) {
        return;
    }

    const style = document.createElement('style');
    style.textContent = `
        .fs-toast-wrap {
            position: fixed;
            top: 80px;
            right: 16px;
            z-index: 2000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        }
        .fs-toast {
            min-width: 260px;
            max-width: 360px;
            background: #111827;
            color: #ffffff;
            border-radius: 10px;
            padding: 12px 14px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
            border-left: 4px solid #22c55e;
            opacity: 0;
            transform: translateY(-8px);
            transition: opacity 0.2s ease, transform 0.2s ease;
            font-size: 14px;
            line-height: 1.35;
        }
        .fs-toast.show {
            opacity: 1;
            transform: translateY(0);
        }
        .fs-toast.error { border-left-color: #ef4444; }
        .fs-toast.warning { border-left-color: #f59e0b; }
        .fs-toast.success { border-left-color: #22c55e; }

        .fs-confirm-overlay {
            position: fixed;
            inset: 0;
            background: rgba(17, 24, 39, 0.56);
            z-index: 2100;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
        }
        .fs-confirm {
            width: 100%;
            max-width: 420px;
            background: #ffffff;
            border-radius: 14px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.28);
            overflow: hidden;
        }
        .fs-confirm-head {
            padding: 16px 20px 8px;
            font-weight: 700;
            color: #111827;
            font-size: 18px;
        }
        .fs-confirm-body {
            padding: 0 20px 18px;
            color: #4b5563;
            font-size: 14px;
        }
        .fs-confirm-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 14px 20px 20px;
            background: #f9fafb;
        }
        .fs-btn {
            border: none;
            border-radius: 8px;
            padding: 10px 14px;
            font-size: 14px;
            cursor: pointer;
        }
        .fs-btn-cancel {
            background: #e5e7eb;
            color: #1f2937;
        }
        .fs-btn-confirm {
            background: #22c55e;
            color: #ffffff;
        }
    `;
    document.head.appendChild(style);

    const toastWrap = document.createElement('div');
    toastWrap.className = 'fs-toast-wrap';
    document.body.appendChild(toastWrap);

    window.appToast = function(message, type = 'info', duration = 2600) {
        const toast = document.createElement('div');
        toast.className = `fs-toast ${type}`;
        toast.textContent = message;
        toastWrap.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 180);
        }, duration);
    };

    window.appConfirm = function(options) {
        const cfg = options || {};
        const title = cfg.title || 'Please Confirm';
        const message = cfg.message || 'Are you sure you want to continue?';
        const confirmText = cfg.confirmText || 'Confirm';
        const cancelText = cfg.cancelText || 'Cancel';

        const overlay = document.createElement('div');
        overlay.className = 'fs-confirm-overlay';
        overlay.innerHTML = `
            <div class="fs-confirm" role="dialog" aria-modal="true">
                <div class="fs-confirm-head">${title}</div>
                <div class="fs-confirm-body">${message}</div>
                <div class="fs-confirm-actions">
                    <button class="fs-btn fs-btn-cancel" type="button">${cancelText}</button>
                    <button class="fs-btn fs-btn-confirm" type="button">${confirmText}</button>
                </div>
            </div>
        `;

        const close = () => overlay.remove();
        overlay.querySelector('.fs-btn-cancel').addEventListener('click', () => {
            close();
            if (typeof cfg.onCancel === 'function') {
                cfg.onCancel();
            }
        });
        overlay.querySelector('.fs-btn-confirm').addEventListener('click', () => {
            close();
            if (typeof cfg.onConfirm === 'function') {
                cfg.onConfirm();
            }
        });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close();
            }
        });

        document.body.appendChild(overlay);
    };
})();

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getApiBaseCandidates() {
    const candidates = [];
    const configuredBase = String(window.FOODSHARE_API_BASE_URL || '').trim();

    if (configuredBase) {
        candidates.push(configuredBase);
    }

    if (window.location.protocol !== 'file:') {
        candidates.push(new URL('backend/', window.location.href).toString());
    }

    candidates.push('http://localhost/Food-donation/backend/');
    candidates.push('http://127.0.0.1/Food-donation/backend/');

    return [...new Set(candidates.map((value) => value.endsWith('/') ? value : `${value}/`))];
}

function fallbackApiBaseUrl() {
    return getApiBaseCandidates()[0] || 'http://localhost/Food-donation/backend/';
}

function apiUrl(path) {
    return new URL(String(path).replace(/^\//, ''), fallbackApiBaseUrl()).toString();
}

function resolveApiUrls(path) {
    const normalizedPath = String(path).replace(/^\//, '');
    const urls = getApiBaseCandidates().map((baseUrl) => new URL(normalizedPath, baseUrl).toString());

    return [...new Set(urls)];
}

async function apiRequest(path, options = {}) {
    // Backend was removed from the project. Fail fast with a clear error message.
    const finalError = new Error('Backend unavailable: the server-side API has been removed.');
    finalError.status = 0;
    finalError.payload = { success: false, message: finalError.message };
    throw finalError;
}

function dashboardPathForRole(role) {
    const routeMap = {
        donor: 'donor-dashboard.html',
        ngo: 'ngo-dashboard.html',
        volunteer: 'volunteer-dashboard.html',
        admin: 'admin-dashboard.html',
    };

    return routeMap[String(role || '').toLowerCase()] || 'index.html';
}

function normalizeFrontendPath(path) {
    return String(path || '')
        .replace(/^\/+/, '')
        .replace(/^(?:\.\.\/)+/, '')
        .replace(/^\.\//, '');
}

function badgeClassForDonationStatus(status) {
    const normalized = String(status || '').toLowerCase();

    if (normalized.includes('approved')) return 'badge badge-approved';
    if (normalized.includes('picked') || normalized.includes('transit') || normalized.includes('assigned')) return 'badge badge-picked';
    if (normalized.includes('delivered') || normalized.includes('completed')) return 'badge badge-delivered';
    if (normalized.includes('rejected')) return 'badge badge-pending';
    return 'badge badge-pending';
}

function badgeClassForDeliveryStatus(status) {
    const normalized = String(status || '').toLowerCase();

    if (normalized === 'assigned') return 'badge badge-status-assigned';
    if (normalized === 'picked_up') return 'badge badge-status-transit';
    if (normalized === 'in_transit') return 'badge badge-status-transit';
    if (normalized === 'delivered' || normalized === 'completed') return 'badge badge-delivered';
    return 'badge badge-pending';
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString().split('T')[0];
}

if (navToggle) {
    navToggle.addEventListener('click', function() {
        navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
    });

    // Close menu when a link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            navMenu.style.display = 'none';
        });
    });
}

// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Close sidebar when clicking outside
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    if (sidebar && !sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
        sidebar.classList.remove('open');
    }
});

// Menu item click handler for dashboards
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
        // Get the href target
        const href = this.getAttribute('href');

        // Remove active class from all items
        document.querySelectorAll('.menu-item').forEach(i => {
            i.classList.remove('active');
        });

        // Add active class to clicked item
        this.classList.add('active');

        // If href is an in-page anchor, scroll to it smoothly
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (href === '#') {
                // scroll to top for bare '#'
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        // Close sidebar on mobile
        const sidebar = document.getElementById('sidebar');
        if (sidebar && window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
        // If href points to another page (not an anchor), allow the default navigation to proceed
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            const target = document.querySelector(href);
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Responsive sidebar on resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }
});

// Set active menu item on page load
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Highlight current page nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // If page was loaded with a hash (file.html#section), scroll to it with offset
    if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target) {
            // small timeout to allow layout to settle
            setTimeout(() => {
                const y = target.getBoundingClientRect().top + window.scrollY - 80; // offset for header
                window.scrollTo({ top: y, behavior: 'smooth' });
            }, 50);
        }
    }
});

// Handle in-page hash changes (clicking file#anchor links)
window.addEventListener('hashchange', function() {
    const hash = window.location.hash;
    const target = document.querySelector(hash);
    if (target) {
        const y = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
});

// Animation for elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe cards and sections
document.querySelectorAll('.card, .stat-card, .feature-card, .food-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
});
