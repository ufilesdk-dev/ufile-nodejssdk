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

var UCloudPublicKey = "your ucloud public key";
var UCloudPrivateKey = "your ucloud private key";
var HTTPVerb = "POST";
var ContentMD5 = "";
var ContentType = "";
var MyDate = "";
var CanonicalizedUCloudHeaders = "";
var bucket = "preview";
var key = "blind-date";
var CanonicalizedResource = "/" + bucket + "/" + key;
var StringToSign =  HTTPVerb + "\n" + ContentMD5 + "\n" + ContentType + "\n"  + MyDate + "\n" + 
        CanonicalizedUCloudHeaders +
        CanonicalizedResource;
console.log(StringToSign);
var Signature = Base64(HmacSha1(UCloudPrivateKey, utf8.encode(StringToSign)));
var Authorization = "UCloud" + " " + UCloudPublicKey + ":" + Signature;
console.log("Authorization: " + Authorization);


var path = 'ustorage.jpg';
var stats = fs.statSync(path);
console.log(util.inspect(stats));
var fileSize = stats.size;


urlsafeBase64Encode = function(buf) {
    var encoded = buf.toString('base64');
    return base64ToUrlSafe(encoded);
}

base64ToUrlSafe = function(value) {
    return value.replace(/\//g, '_').replace(/\+/g, '-');
}

function sha1(path) {
    var sha1 = crypto.createHash('sha1');
    sha1.update(fs.readFileSync(path));
    return sha1.digest();	
}

function file_hash(path, size) {
    if (size <= 4*1024*1024) {
        //blkcnt
        var SHA1 = sha1(path);
        console.log(Buffer.isBuffer(SHA1));
        console.log(SHA1.length);
        console.log(SHA1);
        var blkcnt = new Buffer(4);
        blkcnt.writeUInt32LE(1,0);
        console.log(blkcnt);
        var con = Buffer.concat([blkcnt, SHA1]);
        console.log(util.inspect(con));
        console.log(con.length);
        var hash = urlsafeBase64Encode(con);
        return hash;
    } else {
        //how to slice a file
        console.log("still not support large file");
    }
}
var etag = file_hash(path, fileSize);
console.log(etag);
//uploadhit?Hash=<hash_value>&FileName=<file_name>&FileSize=<filesize>
//

var formData = {
    Hash: etag,
    FileName: key,
    FileSize: fileSize
};

var urlstr = 'http://' + bucket + '.ufile.ucloud.cn:80/uploadhit' 
        + '?Hash=' + etag + '&FileName=' + key + '&FileSize=' + fileSize;
var options = {
    url: urlstr,
    headers:{
        'Authorization': Authorization
    }
};

var r = request({url: urlstr, method: 'POST', headers: {'Authorization': Authorization}}, 
    function callback(err, res, body) { 
        if (err) {
            return console.error('upload failed:', err);
        }
        console.log(res.statusCode);
        console.log(res.caseless);
        console.log(body);
});
