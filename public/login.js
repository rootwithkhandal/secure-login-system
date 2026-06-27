// Login functionality
let captchaId = null;

// Load CAPTCHA on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCaptcha();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('refreshCaptcha').addEventListener('click', loadCaptcha);
    document.getElementById('togglePassword').addEventListener('click', togglePasswordVisibility);
}

async function loadCaptcha() {
    try {
        const response = await fetch('/api/captcha/generate');
        const data = await response.json();
        
        captchaId = data.captchaId;
        document.getElementById('captchaImage').innerHTML = data.captchaSvg;
        document.getElementById('captchaId').value = captchaId;
        document.getElementById('captchaText').value = '';
    } catch (error) {
        showMessage('Failed to load CAPTCHA', 'error');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const captchaText = document.getElementById('captchaText').value;
    
    setLoading(true);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, captchaId, captchaText })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect based on role
            setTimeout(() => {
                if (data.user.role === 'Admin') {
                    window.location.href = '/admin-dashboard.html';
                } else {
                    window.location.href = '/user-dashboard.html';
                }
            }, 1000);
        } else {
            showMessage(data.message, 'error');
            loadCaptcha(); // Refresh CAPTCHA on error
        }
    } catch (error) {
        showMessage('Login failed. Please try again.', 'error');
        loadCaptcha();
    } finally {
        setLoading(false);
    }
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `p-4 rounded-lg ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
    messageDiv.classList.remove('hidden');
    
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}

function setLoading(loading) {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    
    submitBtn.disabled = loading;
    btnText.classList.toggle('hidden', loading);
    btnLoader.classList.toggle('hidden', !loading);
}
