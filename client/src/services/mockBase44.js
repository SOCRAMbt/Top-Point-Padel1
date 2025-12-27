// Mock service for base44 (placeholder)
export const base44 = {
    auth: {
        isAuthenticated: async () => false,
        me: async () => null,
        redirectToLogin: () => window.location.href = '/login'
    },
    entities: {
        Reservation: {
            filter: async () => [],
            create: async (data) => data,
            list: async () => []
        },
        Block: {
            list: async () => []
        },
        Settings: {
            list: async () => []
        }
    },
    integrations: {
        Core: {
            SendEmail: async () => { }
        }
    }
}
