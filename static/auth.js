const registerForm = document.getElementById('form-register');
const loginForm = document.getElementById('login-form');

if (registerForm) {
registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const {login, password} = registerForm;
    const passwordRepeat = registerForm['confirm-password'];
    if (password.value == !passwordRepeat.value) {
        alert('Passwords do not match');
        return;
    }
    const user = JSON.stringify({
        login: login.value,
        password: password.value
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
            const token = xhr.response;
            document.cookie = `token=${token}`;
            window.location.assign('/');
        } else {
            return alert(xhr.response);
        }
    };
});
}