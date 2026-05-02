const fs = require('fs');
const crypto = require('crypto');
const { get } = require('http');

const dbFile = './chat.db';
const excist = fs.existsSync(dbFile);
const sqlite3 = require('sqlite3').verbose();
const dbWrapper = require('sqlite');
let db;

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
            salt TEXT,
            avatar TEXT DEFAULT '1.png'
            );`
        );
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
        try {
            await db.run('ALTER TABLE user ADD COLUMN avatar TEXT DEFAULT "1.png"');
        } catch (e) {
        }
        console.log(await db.all('SELECT * FROM user'));
    };
    }
catch(dbError){
    console.error('Database error:', dbError);
}
})
.then(() => {
    const server = require('./server');
    server.listen(3000, () => {
        console.log('Server running on http://localhost:3000');
    });
});
module.exports = {
    getMessages: async () => {
        try{
            return await db.all(
                `SELECT message_id, content, login, avatar FROM message
                 JOIN user ON message.user_id = user.user_id
                 ORDER BY message_id ASC`
                );
        }
        catch(dbError){
            console.error('Database error:', dbError);
            return [];
        }
    },
addMessage: async (msg, userId) => {
    try{
        return await db.run(
            `INSERT INTO message (user_id, content) VALUES (?, ?)`,
            [userId, msg]
        );
    }
    catch(dbError){
        console.error('Database error:', dbError);
    }
},
isUserExist: async (login) => {
    const candidate = await db.get(
        `SELECT * FROM user WHERE login = ?`,
        [login]
    );
    return !!candidate;
},
addUser: async (user) => {
        const salt = crypto.randomBytes(16).toString('hex');
        const password = crypto.pbkdf2Sync(user.password, salt, 1000, 64, 'sha512').toString('hex');
        const avatar = user.avatar || '1.png';
        await db.run(
            `INSERT INTO user (login, password, salt, avatar) VALUES (?, ?, ?, ?)`,
            [user.login, password, salt, avatar]
        );
        return true;
    },
    getUser: async (user) => {
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
            if (user.password !== candidate.password){
                throw new Error('Invalid password');
            }
        }
        return candidate.user_id + "." + candidate.login;
    }

};

