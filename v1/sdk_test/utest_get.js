var HttpRequest = require('ufile').HttpRequest;
var AuthClient = require('ufile').AuthClient;
var util = require('util');


var bucket = "yellow-cup";
var key = "6M-file";
var file_path = '6M-file.dl';

var method = 'GET';
var url_path_params = '/' + key;


var req = new HttpRequest(method, url_path_params, bucket, key, file_path);

req.setHeader("X-UCloud-Hello", "1234");
req.setHeader("X-UCloud-World", "abcd");
req.setHeader("X-UCloud-Hello", "3.14");

var client =  new AuthClient(req);

function callback(res) {
    if (res instanceof Error) {
        console.log(util.inspect(res));
    } else {
        console.log(util.inspect(res));
    }
}

client.SendRequest(callback);
