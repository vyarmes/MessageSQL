const http = require('http');
const fs = require('fs');
const path = require('path');

const indexHtmlFile = fs.readFileSync(path.join(__dirname,'static','index.html'),'utf-8');
const scriptFile = fs.readFileSync(path.join(__dirname,'static','script.js'),'utf-8');
const styleFile = fs.readFileSync(path.join(__dirname,'static','style.css'),'utf-8');

const server = http.createServer((req,res)=>{
    switch(req.url){
        case '/':return res.end(indexHtmlFile);
        case '/script.js':return res.end(scriptFile);
        case '/style.css':return res.end(styleFile);
    }
    res.statusCode = 404;
    return res.end('Error 404: Not Found');
});
const {Server} = require('socket.io');
const io = new Server(server);

let messages = [];

server.listen(3000);

io.on('connection', socket=>{
    console.log('a user connection.id:' + socket.id);
    let userNickname = 'user';
    socket.on('set_nickname', (nickname) => {
        userNickname = nickname;
    });
    socket.emit('load_messages', messages);
    socket.on('new_message', (message) => {
        const fullMessage = userNickname + ': ' + message;
        messages.push(fullMessage);
        io.emit('message', fullMessage);
    });
});
