// Admin Dashboard functionality
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadStats();
    loadUsers();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('refreshBtn').addEventListener('click', loadUsers);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('editForm').addEventListener('submit', handleEditUser);
    document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
}

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'Admin') {
        window.location.href = '/login.html';
        return;
    }
    
    currentUser = user;
    document.getElementById('adminName').textContent = `Hello, ${user.username}`;
}

async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/stats/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('totalUsers').textContent = stats.total || 0;
            document.getElementById('totalAdmins').textContent = stats.admins || 0;
            document.getElementById('recentUsers').textContent = stats.recentUsers || 0;
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayUsers(data.users || data);
        } else if (response.status === 401) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        const createdDate = new Date(user.createdAt).toLocaleDateString();
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${user.username}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600">${user.email}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }">
                    ${user.role}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                ${createdDate}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="editUser('${user._id}')" class="text-blue-600 hover:text-blue-800 mr-3">
                    ✏️ Edit
                </button>
                <button onclick="deleteUser('${user._id}', '${user.username}')" class="text-red-600 hover:text-red-800">
                    🗑️ Delete
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

async function editUser(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const user = data.user || data;
            document.getElementById('editUserId').value = user._id;
            document.getElementById('editUsername').value = user.username;
            document.getElementById('editEmail').value = user.email;
            document.getElementById('editRole').value = user.role;
            document.getElementById('editModal').classList.remove('hidden');
        }
    } catch (error) {
        alert('Failed to load user details');
    }
}

async function handleEditUser(e) {
    e.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const username = document.getElementById('editUsername').value;
    const email = document.getElementById('editEmail').value;
    const role = document.getElementById('editRole').value;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username, email, role })
        });
        
        if (response.ok) {
            closeEditModal();
            loadUsers();
            loadStats();
            alert('User updated successfully');
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to update user');
        }
    } catch (error) {
        alert('Failed to update user');
    }
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

async function deleteUser(userId, username) {
    if (currentUser._id === userId) {
        alert('You cannot delete your own account');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            loadUsers();
            loadStats();
            alert('User deleted successfully');
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to delete user');
        }
    } catch (error) {
        alert('Failed to delete user');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Make functions globally accessible
window.editUser = editUser;
window.deleteUser = deleteUser;
