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
server.listen(3000);