export function createPageUrl(pageName) {
    const routes = {
        'Home': '/',
        'Login': '/login',
        'Profile': '/profile',
        'AdminDashboard': '/admin',
        'AdminBlocks': '/admin/blocks',
        'AdminCalendar': '/admin/calendar',
        'AdminReservations': '/admin/reservations',
        'AdminUsers': '/admin/users',
        'AdminSettings': '/admin/settings',
        'AdminStats': '/admin/stats',
        'AdminPayments': '/admin/payments',
        'AdminWaitlist': '/admin/waitlist'
    }
    return routes[pageName] || '/'
}
