const http = require('http');
const fs = require('fs');
const path = require('path');

const pathToIndex = path.join(__dirname,'static','index.html');
const indexHtmlFile = fs.readFileSync(pathToIndex, 'utf-8');

const server = http.createServer((req,res)=>{
    if(req.url === '/'){
        return res.end(indexHtmlFile);
    }
    res.statusCode = 404;
    return res.end('Error 404: Not Found');
});
server.listen(3000);