const http = require('http');
const fs = require('fs');
const path = require('path');
const cookie = require('cookie');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const dbWrapper = require('sqlite');

const validAuthTokens = [];

const dbFile = './chat.db';
const excist = fs.existsSync(dbFile);
let db;

const indexHtmlFile = fs.readFileSync(path.join(__dirname,'static','index.html'),'utf-8');
const scriptFile = fs.readFileSync(path.join(__dirname,'static','script.js'),'utf-8');
const styleFile = fs.readFileSync(path.join(__dirname,'static','style.css'),'utf-8');
const registerHtml = fs.readFileSync(path.join(__dirname,'static','register.html'),'utf-8');
const loginHtml = fs.readFileSync(path.join(__dirname,'static','login.html'),'utf-8');
const registerCss = fs.readFileSync(path.join(__dirname,'static','register.css'),'utf-8');
const loginCss = fs.readFileSync(path.join(__dirname,'static','login.css'),'utf-8');   
const authJs = fs.readFileSync(path.join(__dirname,'static','auth.js'),'utf-8');

const isUserExist = async (login) => {
    const candidate = await db.get(
        `SELECT * FROM user WHERE login = ?`,
        [login]
    );
    return !!candidate;
};

const addUser = async (user) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const password = crypto.pbkdf2Sync(user.password, salt, 1000, 64, 'sha512').toString('hex');
    await db.run(
        `INSERT INTO user (login, password, salt) VALUES (?, ?, ?)`,
        [user.login, password, salt]
    );
    return true;
};

const getUser = async (user) => {
    const candidate = await db.get(
        `SELECT * FROM user WHERE login = ?`,
        [user.login]
    );
    if (!candidate){
        throw new Error('User not found');
    }
    if (candidate.salt) {
        const hash = crypto.pbkdf2Sync(user.password, candidate.salt, 1000, 64, 'sha512').toString('hex');
        if (hash !== candidate.password){
            throw new Error('Invalid password');
        }
    } else {
        // Plaintext password for old users
        if (user.password !== candidate.password){
            throw new Error('Invalid password');
        }
    }
    return candidate.user_id + "." + candidate.login;
};

const getMessages = async () => {
    try{
        return await db.all(
            `SELECT message_id, content, login FROM message
             JOIN user ON message.user_id = user.user_id
             ORDER BY message_id ASC`
            );
    }
    catch(dbError){
        console.error('Database error:', dbError);
        return [];
    }
};

const addMessage = async (msg, userId) => {
    try{
        return await db.run(
            `INSERT INTO message (user_id, content) VALUES (?, ?)`,
            [userId, msg]
        );
    }
    catch(dbError){
        console.error('Database error:', dbError);
    }
};

const server = http.createServer((req,res)=>{
    if(req.method === 'GET'){   
        switch(req.url){
            case '/':return res.end(indexHtmlFile);
            case '/script.js':return res.end(scriptFile);
            case '/style.css':return res.end(styleFile);
            case '/register':return res.end(registerHtml);
            case '/login':return res.end(loginHtml);    
            case '/register.css':return res.end(registerCss);
            case '/login.css':return res.end(loginCss);
            case '/auth.js':return res.end(authJs);
            default: return guarded(req, res);
        }
    }
    if(req.method === 'POST'){
        switch(req.url){
        case '/api/register': return registerUser(req, res);
        case '/api/login': return login(req, res);
        default: return guarded(req, res);
        };
    }
});

function guarded(req, res){
    const credentionals = getCredentionals(req.headers.cookie);
    if (!credentionals){
        res.writeHead(302, {'Location': '/register'});
        return res.end();
    }
    if(req.method === 'GET'){
        switch(req.url){
            case '/':return res.end(indexHtmlFile);
            case '/script.js':return res.end(scriptFile);
        }
    }
    res.writeHead(404);
    return res.end('Error 404: Not Found');
}

function getCredentionals(cookieHeaders){
    const cookies = cookie.parse(cookieHeaders || '');
    const token = cookies?.token;
    if (!token || !validAuthTokens.includes(token)){
        return null;
    }
    const [userId, login] = token.split('.');
    if(!userId || !login){
        return null;
    }
    return {userId, login};
}

function registerUser(req, res) {
    let data = '';
    req.on('data', function(chunk) {
        data += chunk;
    });
    req.on('end', async function() {
      try {
        const user = JSON.parse(data);
        if(!user.login || !user.password) {
          return res.end('Empty login or password');
        }
        if(await isUserExist(user.login)) {
          return res.end('User already exists');
        }
        await addUser(user);
        res.writeHead(200);
        return res.end('Registration is successful');
      }
      catch(e) {
        console.error(e);
        res.writeHead(500);
        return res.end('Error: ' + e.message);
      }
    });
}

function login(req, res) {
  let data = '';
  req.on('data', function(chunk) {
      data += chunk;
  });
  req.on('end', async function() {
    try {
      const user = JSON.parse(data);
      const token = await getUser(user);
      validAuthTokens.push(token);
      res.writeHead(200);
      res.end(token);
    }
    catch(e) {
      res.writeHead(500);
      res.end('Error: ' + e.message);
    }
  });
}

dbWrapper.open({
    filename: dbFile,
    driver: sqlite3.Database
})
.then(async dBase => {
    db = dBase;
    try{
    if (!excist){
        await db.run(
            `CREATE TABLE user(
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            login TEXT,
            password TEXT,
            salt TEXT
            );`
        );
        await db.run(
            `CREATE TABLE message(
            message_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            content TEXT,
            author INTEGER,
            FOREIGN KEY (user_id) REFERENCES user(user_id)
            );`
        );
        // Insert default users with hashed passwords
        const users = [
            {login: '1', password: '123'},
            {login: '2', password: '456'},
            {login: 'admin', password: '789'}
        ];
        for (const user of users) {
            const salt = crypto.randomBytes(16).toString('hex');
            const hashedPassword = crypto.pbkdf2Sync(user.password, salt, 1000, 64, 'sha512').toString('hex');
            await db.run(
                `INSERT INTO user (login, password, salt) VALUES (?, ?, ?)`,
                [user.login, hashedPassword, salt]
            );
        };
    }else{
        // For existing databases, add salt column if missing
        try {
            await db.run('ALTER TABLE user ADD COLUMN salt TEXT');
        } catch (e) {
            // Column might already exist
        }
        console.log(await db.all('SELECT * FROM user'));
    };
    }
catch(dbError){
    console.error('Database error:', dbError);
}

    // Start server after database is ready
    server.listen(3000, () => {
        console.log('Server running on http://localhost:3000');
    });

    const { Server } = require("socket.io");
    const io = new Server(server);

    io.on('connection', async (socket) => {
      const cookieHeader = socket.handshake.headers.cookie;
      const credentials = getCredentionals(cookieHeader);
      if (!credentials) {
        socket.disconnect();
        return;
      }

      console.log('a user connected. id - ' + socket.id);

      let userNickname = credentials.login;
      let userId = credentials.userId;
      let messages = await getMessages();

      socket.emit('all_messages', messages);

      socket.on('new_message', (message) => {
        addMessage(message, userId);
        io.emit('message', userNickname + ': ' + message);
      });
    });
});
