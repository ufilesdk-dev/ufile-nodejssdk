var request = require('request');
var fs = require('fs');
var crypto = require('crypto');
var utf8 = require('utf8');
var util = require('util');

Base64 = function(content) {
    return new Buffer(content).toString('base64');
}

HmacSha1 = function(secretKey, content) {
    var hmac = crypto.createHmac('sha1', secretKey);
    hmac.update(content);
    return hmac.digest();
}

//file stat
var path = 'ustorage.jpg';
var stats = fs.statSync(path);
console.log(util.inspect(stats));
var fileSize = stats.size;

var UCloudPublicKey = "your ucloud public key";
var UCloudPrivateKey = "your ucloud private key";
var HTTPVerb = "PUT";
var ContentMD5 = "";
var ContentType = "image/jpeg";
var MyDate = "";
var CanonicalizedUCloudHeaders = "";
var bucket = "preview";
var key = "ustorage";
var CanonicalizedResource = "/" + bucket + "/" + key;
var StringToSign =  HTTPVerb + "\n" + ContentMD5 + "\n" + ContentType + "\n" + MyDate + "\n" + 
    CanonicalizedUCloudHeaders +
    CanonicalizedResource;
console.log(StringToSign);
var Signature = Base64(HmacSha1(UCloudPrivateKey, StringToSign));
var Authorization = "UCloud" + " " + UCloudPublicKey + ":" + Signature;
console.log("Authorization: " + Authorization);


var urlstr = 'http://' + bucket + '.ufile.ucloud.cn/' + key;
var options = {
    url: urlstr,
    method: 'PUT',
    headers:{
        'Authorization': Authorization,
        'Content-Length': fileSize
    }
};

function callback(err, response, body) {
    if (err) {
        return console.error("upload failed:", err);
    }
    console.log(response.caseless);
    console.log(body);
}

fs.createReadStream(path).pipe(request.put(options, callback));
