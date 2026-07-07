// Registration functionality
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('password').addEventListener('input', checkPasswordStrength);
    document.getElementById('togglePassword').addEventListener('click', togglePasswordVisibility);
    
    document.getElementById('role')?.addEventListener('change', (e) => {
        const adminContainer = document.getElementById('adminSecretContainer');
        const adminInput = document.getElementById('adminSecret');
        if (e.target.value === 'Admin') {
            adminContainer.classList.remove('hidden');
            adminInput.setAttribute('required', 'true');
        } else {
            adminContainer.classList.add('hidden');
            adminInput.removeAttribute('required');
            adminInput.value = '';
        }
    });
}

function checkPasswordStrength() {
    const password = document.getElementById('password').value;
    
    // Check requirements
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    // Update requirement indicators
    updateRequirement('req-length', hasLength);
    updateRequirement('req-uppercase', hasUppercase);
    updateRequirement('req-lowercase', hasLowercase);
    updateRequirement('req-number', hasNumber);
    
    // Calculate strength
    const strength = [hasLength, hasUppercase, hasLowercase, hasNumber].filter(Boolean).length;
    
    // Update strength bars
    const bars = [
        document.getElementById('strength-bar-1'),
        document.getElementById('strength-bar-2'),
        document.getElementById('strength-bar-3')
    ];
    
    bars.forEach((bar, index) => {
        bar.className = 'h-1 flex-1 rounded';
        if (index < strength - 1) {
            if (strength === 2) bar.classList.add('bg-red-500');
            else if (strength === 3) bar.classList.add('bg-yellow-500');
            else if (strength === 4) bar.classList.add('bg-green-500');
        } else {
            bar.classList.add('bg-gray-200');
        }
    });
    
    // Update strength text
    const strengthText = document.getElementById('strength-text');
    if (strength === 0 || strength === 1) {
        strengthText.textContent = '';
    } else if (strength === 2) {
        strengthText.textContent = 'Weak password';
        strengthText.className = 'text-sm text-red-600';
    } else if (strength === 3) {
        strengthText.textContent = 'Medium password';
        strengthText.className = 'text-sm text-yellow-600';
    } else {
        strengthText.textContent = 'Strong password';
        strengthText.className = 'text-sm text-green-600';
    }
}

function updateRequirement(id, met) {
    const element = document.getElementById(id);
    const icon = element.querySelector('span');
    
    if (met) {
        icon.textContent = '✓';
        icon.className = 'text-green-500';
        element.className = 'flex items-center gap-2 text-green-600';
    } else {
        icon.textContent = '○';
        icon.className = 'text-gray-400';
        element.className = 'flex items-center gap-2 text-gray-600';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;
    const adminSecret = document.getElementById('adminSecret')?.value || '';
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    // Validate password strength
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        showMessage('Password does not meet requirements', 'error');
        return;
    }
    
    setLoading(true);
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role, adminSecret })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Registration failed. Please try again.', 'error');
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
    messageDiv.className = `p-3.5 rounded border font-label text-xs tracking-wider flex items-center gap-2 ${
        type === 'success' 
            ? 'bg-[#0a1220] border-[#69f0ae]/60 text-[#69f0ae] shadow-[0_0_15px_rgba(105,240,174,0.15)]' 
            : 'bg-[#0a1220] border-[#e53935]/60 text-[#e53935] shadow-[0_0_15px_rgba(229,57,53,0.15)]'
    }`;
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
