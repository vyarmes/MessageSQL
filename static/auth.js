const registerForm = document.getElementById('form-register');
const loginForm = document.getElementById('login-form');
const modal = document.getElementById('avatar-modal');
const avatarButton = document.getElementById('avatar-button');
const closeBtn = document.querySelector('.close');
const avatarOptions = document.querySelectorAll('.avatar-option');
const avatarSelected = document.getElementById('avatar-selected');
const avatarDisplay = document.getElementById('avatar-display');
const avatarImg = document.getElementById('avatar-img');

let selectedAvatar = null;

// Modal functionality
if (avatarButton) {
    avatarButton.addEventListener('click', () => {
        modal.style.display = 'block';
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

window.addEventListener('click', (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});

avatarOptions.forEach(option => {
    option.addEventListener('click', () => {
        avatarOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedAvatar = option.dataset.avatar;
        avatarSelected.value = selectedAvatar;
        avatarImg.src = 'avatar/' + selectedAvatar;
        avatarDisplay.style.display = 'flex';
        modal.style.display = 'none';
    });
});

if (registerForm) {
registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const {login, password} = registerForm;
    const passwordRepeat = registerForm['confirm-password'];
    if (password.value !== passwordRepeat.value) {
        alert('Passwords do not match');
        return;
    }
    if (!selectedAvatar) {
        alert('Please select an avatar');
        return;
    }
    const user = JSON.stringify({
        login: login.value,
        password: password.value,
        avatar: selectedAvatar
    })
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/register');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(user);
    xhr.onload = () => { alert(xhr.response); 
    };
});
}

if (loginForm) {
loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const {login, password} = loginForm;
    const user = JSON.stringify({
        login: login.value,
        password: password.value
    })
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/login');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(user);
    xhr.onload = () => {
            if (xhr.status === 200) {
            const response = JSON.parse(xhr.response);
            document.cookie = `token=${response.token}`;
            window.location.assign('/');
        } else {
            return alert(xhr.response);
        }
    };
});
}