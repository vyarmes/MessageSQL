const socket = io({
    auth: {
        cookie: document.cookie
    }
});

const messages = document.getElementById('messages');
const input = document.getElementById('input');
const form = document.getElementById('form');
const logOut = document.getElementById('logout');
const avatar = document.getElementById('avatar-button');

if (avatar) {
    avatar.addEventListener('click',() => {
        
    });
}


logOut.addEventListener('click', (e) => {
    document.cookie = 'token=; Max-Age=0;';
    location.assign('/login');
});

socket.on('all_messages', function(msgArray) {
  msgArray.forEach(msg => {
    let item = document.createElement('li');
    item.classList.add('message-item');
    
    let avatar = document.createElement('img');
    avatar.src = 'avatar/' + (msg.avatar || '1.png');
    avatar.alt = msg.login;
    avatar.classList.add('message-avatar');
    item.appendChild(avatar);
    
    let textContainer = document.createElement('div');
    textContainer.classList.add('message-text');
    let username = document.createElement('span');
    username.classList.add('username');
    username.textContent = msg.login + ': ';
    textContainer.appendChild(username);
    
    let content = document.createElement('span');
    content.textContent = msg.content;
    textContainer.appendChild(content);
    item.appendChild(textContainer);
    
    messages.appendChild(item);
  });
  window.scrollTo(0, document.body.scrollHeight);
});
form.addEventListener('submit', function(e){
    e.preventDefault();
    if (input.value){
        socket.emit('new_message', input.value);
        input.value = '';
    }
});
socket.on('load_messages', function(msgs){
    msgs.forEach(function(msg){
        var item = document.createElement('li');
        item.classList.add('message-item');
        if (typeof msg === 'object' && msg.content) {
            let avatar = document.createElement('img');
            avatar.src = 'avatar/' + (msg.avatar || '1.png');
            avatar.alt = msg.login;
            avatar.classList.add('message-avatar');
            item.appendChild(avatar);
            
            let textContainer = document.createElement('div');
            textContainer.classList.add('message-text');
            let username = document.createElement('span');
            username.classList.add('username');
            username.textContent = msg.login + ': ';
            textContainer.appendChild(username);
            
            let content = document.createElement('span');
            content.textContent = msg.content;
            textContainer.appendChild(content);
            item.appendChild(textContainer);
        } else {
            item.textContent = msg;
        }
        messages.appendChild(item);
    });
});
socket.on('message', function(msg){
    var item = document.createElement('li');
    item.classList.add('message-item');
    if (typeof msg === 'object' && msg.content) {
        let avatar = document.createElement('img');
        avatar.src = 'avatar/' + (msg.avatar || '1.png');
        avatar.alt = msg.login;
        avatar.classList.add('message-avatar');
        item.appendChild(avatar);
        
        let textContainer = document.createElement('div');
        textContainer.classList.add('message-text');
        let username = document.createElement('span');
        username.classList.add('username');
        username.textContent = msg.login + ': ';
        textContainer.appendChild(username);
        
        let content = document.createElement('span');
        content.textContent = msg.content;
        textContainer.appendChild(content);
        item.appendChild(textContainer);
    } else {
        item.textContent = msg;
    }
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

// function changeNickname(){
//     let nickname = prompt('Enter your nickname:');
//     if (nickname){
//         socket.emit('set_nickname', nickname);
//     }
// }
// changeNickname();