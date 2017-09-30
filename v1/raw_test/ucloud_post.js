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
var HTTPVerb = "POST";
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

/*
var r = request.post('http://showpub.ufile.ucloud.cn:8080', function optionalCallback(err, httpResponse, body) { 
    if (err) {
        return console.error('upload failed:', err);
    }
    //console.log('upload successed!');
    console.log(httpResponse.caseless);
    console.log(body);
});

var form = r.form();
form.append('Authorization', Authorization);
form.append('FileName', key);
form.append('file', fs.createReadStream('ustorage.jpg'), {filename:'ustorage.jpg'});
*/

var formData = {
    Authorization: Authorization,
    FileName: key,
    file: {
        value: fs.createReadStream('./caiyueqiao.jpg'),
        options: {
            filename: 'caiyueqiao.jpg'
        }
    }
};

var urlstr = 'http://' + bucket + '.ufile.ucloud.cn/';

request.post({url: urlstr, formData: formData}).on('response', 
    function (response) {
        console.log(response.statusCode);
        console.log(response.headers['content-type']);
});
