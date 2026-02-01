// API Helper for Flask Backend
// Ensure your python backend is running on http://localhost:5000

const BASE_URL = 'http://localhost:5000/api';

export const api = {
    async register(name: string, mobileNumber: string, password: string) {
        const res = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mobile_number: mobileNumber, password })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Registration failed');
        return res.json();
    },

    async login(mobileNumber: string, password: string) {
        const res = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile_number: mobileNumber, password })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
        return res.json();
    },

    async getUsers(currentUserId: string) {
        const res = await fetch(`${BASE_URL}/users?current_user_id=${currentUserId}`);
        return res.json();
    },

    async getChats(currentUserId: string) {
        const res = await fetch(`${BASE_URL}/chats?user_id=${currentUserId}`);
        return res.json();
    },

    async createChat(participants: string[], isGroup: boolean = false, groupName?: string) {
        const res = await fetch(`${BASE_URL}/chats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants, isGroup, groupName })
        });
        return res.json();
    },

    async getMessages(chatId: string) {
        const res = await fetch(`${BASE_URL}/messages?chat_id=${chatId}`);
        return res.json();
    },

    async sendMessage(chatId: string, senderId: string, content: string, type: string) {
        const res = await fetch(`${BASE_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId, senderId, content, type })
        });
        return res.json();
    },

    async updateProfile(userId: string, name: string) {
        const res = await fetch(`${BASE_URL}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, name })
        });
        return res.json();
    }
};