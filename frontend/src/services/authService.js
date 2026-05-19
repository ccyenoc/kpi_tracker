const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8006';

export const authService = {
    login: async (credentials) => {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });
        
        const data = await response.json();

        if (!response.ok || !data.success) {
            let errorMsg = "Invalid email or password";

            if (data.detail && data.detail.toLowerCase().includes("authentication")) {
                errorMsg = "Invalid email or password";
            } else if (data.detail && data.detail.toLowerCase().includes("invalid")) {
                errorMsg = "Invalid email or password";
            }

            throw new Error(errorMsg);
        }

        return data;
    },

    register: async (userInfo) => {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userInfo)
        });

        const data = await response.json();

        if(!data.success) {
            const errorMsg = `${data.detail || 'Please try again'}`;
            if (data.detail && data.detail.toLowerCase().includes("email")) {
                errorMsg = "Email already registered.";
            }
            throw new Error(errorMsg);
        }

        return data;
    },

    fetchUserByToken: async (token) => {
        const response = await fetch(`${API_BASE_URL}/api/user`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        return await response.json();
    },

    sendVerificationCode: async (email) => {
        const response = await fetch(`${API_BASE_URL}/api/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();

        if (!response.ok || !data.success) {
            const errorMsg = data.detail || data.message || 'Failed to send verification code';
            throw new Error(errorMsg);
        }

        return data;
    },

    verifyCode: async (email, code) => {
        const response = await fetch(`${API_BASE_URL}/api/verify-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const errorMsg = data.detail || data.message || 'Verification failed';
            throw new Error(errorMsg);
        }
        return data;
    }
};