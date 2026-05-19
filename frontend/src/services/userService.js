const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8006';

export const userService = {
    updateProfile: async (profileData) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if(!data.success) {
            const errorMsg = `${data.detail || 'Failed to update profile'}`;
            throw new Error(errorMsg);
        }

        return data;
    },

    updatePassword: async (passwordData) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE_URL}/api/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(passwordData)
        });

        const data = await response.json();

        if(!data.success) {
            const errorMsg = `${data.detail || 'Failed to update password'}`;
            throw new Error(errorMsg);
        }

        return data;
    },

    deleteAccount: async () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if(!data.success) {
            const errorMsg = `${data.detail || 'Failed to delete account'}`;
            throw new Error(errorMsg);
        }

        return data;
    },

    getAllStaff: async () => {
        return await fetch(`${API_BASE_URL}/api/staff`);
    }
};