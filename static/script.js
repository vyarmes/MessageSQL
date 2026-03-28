const socket = io();

const message = document.getElementById('message');
const input = document.getElementById('input');
const form = document.getElementById('form');
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
        item.textContent = msg;
        messages.appendChild(item);
    });
});
socket.on('message', function(msg){
    var item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

function changeNickname(){
    let nickname = prompt('Enter your nickname:');
    if (nickname){
        socket.emit('set_nickname', nickname);
    }
}
changeNickname();