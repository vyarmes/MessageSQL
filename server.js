const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./database');


const indexHtmlFile = fs.readFileSync(path.join(__dirname,'static','index.html'),'utf-8');
const scriptFile = fs.readFileSync(path.join(__dirname,'static','script.js'),'utf-8');
const styleFile = fs.readFileSync(path.join(__dirname,'static','style.css'),'utf-8');
const registerHtmlFile = fs.readFileSync(path.join(__dirname,'static','register.html'),'utf-8');
const loginHtmlFile = fs.readFileSync(path.join(__dirname,'static','login.html'),'utf-8');
const registerCssFile = fs.readFileSync(path.join(__dirname,'static','register.css'),'utf-8');
const loginCssFile = fs.readFileSync(path.join(__dirname,'static','login.css'),'utf-8');   
const authJsFile = fs.readFileSync(path.join(__dirname,'static','auth.js'),'utf-8');

const server = http.createServer((req,res)=>{
    switch(req.url){
        case '/':return res.end(indexHtmlFile);
        case '/script.js':return res.end(scriptFile);
        case '/style.css':return res.end(styleFile);
        case '/register.html':return res.end(registerHtmlFile);
        case '/login.html':return res.end(loginHtmlFile);
        case '/register.css':return res.end(registerCssFile);
        case '/login.css':return res.end(loginCssFile);
        case '/auth.js':return res.end(authJsFile);
    }
    res.statusCode = 404;
    return res.end('Error 404: Not Found');
});
const {Server} = require('socket.io');
const { measureMemory } = require('vm');
const io = new Server(server);

let messages = [];

server.listen(3000);

io.on('connection', async (socket) => 
    {
    console.log('a user connection.id:' + socket.id);

    let userNickname = 'user_' + socket.id;
    let messages = await db.getMessages();


    // socket.on('set_nickname', (nickname) => {
    //     userNickname = nickname;
    // });
    
    socket.emit('load_messages', messages);

    socket.on('new_message', (message) => {
        // messages.push(fullMessage);
        db.addMessage(message, 1);
        io.emit('message', new Date().toLocaleTimeString() + ' ' + userNickname + ': ' + message);
    });
});
function registerUser(req, res) {
    let data = '';
    req.on('data', function(chunk) {
        data += chunk;
    });
    req.on('end', function() {
        console.log(data);
        return res.end('ok');
        try {
            const user = JSON.parse(data);
            if (!user.login || !user.password) {
                return res.end('Login and password are required');
            }
            if (await, db.addUser(user)){
                res.end('User registered successfully');
            }
        }
        catch(e){
            res.writeHead(500);
            return res.end('Error registering user');
        }
    });
}