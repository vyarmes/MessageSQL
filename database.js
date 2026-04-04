const fs = require('fs');

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
    }
};
