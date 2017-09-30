var request = require('request');
var fs = require('fs');
var crypto = require('crypto');
var utf8 = require('utf8');


Base64 = function(content) {
    return new Buffer(content).toString('base64');
}

HmacSha1 = function(secretKey, content) {
    var hmac = crypto.createHmac('sha1', secretKey);
    hmac.update(content);
    return hmac.digest();
}

var UCloudPublicKey = "your ucloud public key";
var UCloudPrivateKey = "your ucloud private key";
var HTTPVerb = "GET";
var ContentMD5 = "";
var ContentType = "image/jpeg";
var MyDate = "";
var CanonicalizedUCloudHeaders = "";
var bucket = "showpub";
var key = "blind-date";
var CanonicalizedResource = "/" + bucket + "/" + key;
var StringToSign =  HTTPVerb + "\n" + ContentMD5 + "\n" + ContentType + "\n" + MyDate + "\n" + 
        CanonicalizedUCloudHeaders +
        CanonicalizedResource;
console.log(StringToSign);
var Signature = Base64(HmacSha1(UCloudPrivateKey, utf8.encode(StringToSign)));
var Authorization = "UCloud" + " " + UCloudPublicKey + ":" + Signature;
console.log("Authorization: " + Authorization);


var urlstr = 'http://' + bucket + '.ufile.ucloud.cn:8080/' + key;
var options = {
    url: urlstr,
    method: 'GET',
    headers:{
        'Authorization': Authorization
    }
};

function callback(err, response, body) {
    if (err) {
        return console.error("upload failed:", err);
    }
    console.log(response.caseless);
    //console.log(body);
}
var out_path = "blind-date.jpg"
request(options, callback).pipe(fs.createWriteStream(out_path));
