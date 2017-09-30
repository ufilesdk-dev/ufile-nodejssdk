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
var path = 'octet';
var stats = fs.statSync(path);
console.log(util.inspect(stats));
var fileSize = stats.size;

var UCloudPublicKey = "your ucloud public key";
var UCloudPrivateKey = "your ucloud private key";
var HTTPVerb = "DELETE";
var ContentMD5 = "";
var ContentType = "";
var MyDate = "";
var CanonicalizedUCloudHeaders = "";
var bucket = "showpub";
var key = "no-mime-type";
var CanonicalizedResource = "/" + bucket + "/" + key;
var StringToSign =  HTTPVerb + "\n" + ContentMD5 + "\n" + ContentType + "\n" + MyDate + "\n" + 
        CanonicalizedUCloudHeaders +
        CanonicalizedResource;
console.log(StringToSign);
var Signature = Base64(HmacSha1(UCloudPrivateKey, StringToSign));
var Authorization = "UCloud" + " " + UCloudPublicKey + ":" + Signature;
console.log("Authorization: " + Authorization);


var urlstr = 'http://' + bucket + '.ufile.ucloud.cn:8080/' + key;
var options = {
    url: urlstr,
    method: 'DELETE',
    headers: {
        'Authorization': Authorization
    }
};

function callback(err, response, body) {
    if (err) {
        return console.error("delete failed:", err);
    }
    console.log(response.caseless);
    console.log(body);
}

request(options, callback);
