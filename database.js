const fs = require('fs');
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
            password TEXT
            );`
        );
        await db.run(
            `INSERT INTO user (login, password) VALUES ('1', '123'), ('2', '456'), ('admin', '789');`
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
    }else{
            console.log(await db.all('SELECT * FROM user'));
        };
    }
catch(dbError){
    console.error('Database error:', dbError);
}
});
module.exports = {
    getMessages: async () => {
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
    addMessage: async (msg, userId) => {
        await db.run(
            `INSERT INTO message (user_id, content) VALUES (?, ?)`,
            [userId, msg]
        );
    },
    addUser: async (user) => {
        const salt = crypto.randomBytes(16).toString('hex');
        const password = crypto.pbkdf2Sync(user.password, salt, 1000, 64, 'sha512').toString('hex');
        await db.run(
            `INSERT INTO user (login, password, salt) VALUES (?, ?, ?)`,
            [user.login, password, salt]
        );
    },
    getUser: async (user) => {
        const candidate = await db.get(
            `SELECT * FROM user WHERE login = ?`,
            [user.login]
        );
        if (!candidate.length){
            throw new Error('User not found');
        };
        const {userId, login, password, salt} = candidate[0];
        const hash = crypto.pbkdf2Sync(user.password, salt, 1000, 64, 'sha512').toString('hex');
        if (hash !== password){
            throw new Error('Invalid password');
        };
        return userId +"."+ login +"."+ crypto.randomBytes(16).toString('hex');
    }

};

