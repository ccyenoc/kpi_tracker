const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8006';

export const kpiService = {
    createKPI: async (kpiData) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE_URL}/api/manager/kpi`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(kpiData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to create KPI');
        }

        return data;
    },

    staffUpdateKPI: async (updateData) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE_URL}/api/kpi/update`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Submission failed');
        }

        return data;
    },

    getWeeklyKPIReport: async () => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/report/weekly`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Download Failed!');
        }

        return await response.blob();
    }
};