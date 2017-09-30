var HttpRequest = require('ufile').HttpRequest;
var MultiUpload = require('ufile').MultiUpload;
var AuthClient = require('ufile').AuthClient;
var helper = require('ufile').helper;

var fs = require('fs');
var assert = require('assert');
var util = require('util');

var streamifier = require('streamifier');

var bucket = "yellow-cup";
var key = "6M-file";
var file_path = '6M-file';

var method = 'POST';
var url_path_params = '/' + key + '?uploads';


var init_upload = new HttpRequest(method, url_path_params, bucket, key, file_path);

init_upload.setHeader("X-UCloud-Hello", "1234");
init_upload.setHeader("X-UCloud-World", "abcd");
init_upload.setHeader("X-UCloud-Hello", "3.14");
var client =  new AuthClient(init_upload);
client.SendRequest(init_response);

function init_response(res) {
    if (res instanceof Error) {
        console.log(util.inspect(res));
    } else {
        if (200 == res.statusCode) {
            console.log(util.inspect(res));
            var body = res.body;
            upload_parts(file_path, body.UploadId, body.BlkSize, body.Bucket, body.Key);
        } else {
            console.log(util.inspect(res));
        }
    }
}

function upload_parts(file_path, upload_id, blk_size, bucket, key) {
    assert(fs.existsSync(file_path));
    assert(blk_size > 0);
    var file_size = helper.GetFileSize(file_path);
    console.log("file_size = " + file_size);
    var loop_length = file_size / blk_size | 0;
    if (file_size % blk_size > 0) {
        loop_length++;
    }
    console.log("loop_length = " + loop_length);
    //不能使用循环 
    var i = 0;
    var etags = [];
    loop_body();
    function loop_body() {
        var start = i*blk_size;
        var end = i*blk_size + blk_size - 1;
        var stream_size = blk_size;
        if ( i === loop_length - 1 && file_size % blk_size > 0) {	
            end = i*blk_size + (file_size % blk_size);
            stream_size = file_size % blk_size;
        }	
        var options = {
            start: start,
            end: end
        };
        var method = 'PUT';
        var url_path_params = '/' + key + '?uploadId=' + upload_id + '&partNumber=' + i;
        var read_stream = fs.createReadStream(file_path, options);
        var mime_type = helper.GetMimeType(file_path);
        console.log('mime_type ' + mime_type);
        var part_upload = new MultiUpload(method, url_path_params, bucket, key, read_stream, stream_size, mime_type);
        part_upload.setHeader("X-UCloud-Hello", "1234");
        part_upload.setHeader("X-UCloud-World", "abcd");
        part_upload.setHeader("X-UCloud-Hello", "3.14");
        var client = new AuthClient(part_upload);
        client.SendRequest(function(res) {
            if (res instanceof Error) {
                console.log(util.inspect(res));
            } else {
                if (res.statusCode != 200) {
                    console.log('upload part failed');
                    return;
                }
                console.log(util.inspect(res));
                if (res.header) {
                    console.log(res.header.etag.replace(/\"/g, ""));
                    //etags.push(res.header.etag.replace(/\"/g, ""));
                    etags.push(res.header.etag);
                }
                if (i == loop_length - 1) {
                    var method = 'POST';
                    var new_key = "new" + key;
                    var url_path_params =  '/' + key + '?uploadId=' + upload_id + '&newKey=' + new_key;
                    //var etags_buf = new Buffer(etags.toString());
                    var etags_str = etags.toString();
                    var read_stream = new streamifier.createReadStream(etags_str);
                    var finish_upload = new MultiUpload(method, url_path_params, bucket, key, read_stream, etags_str.length);
                    finish_upload.setHeader("X-UCloud-Hello", "1234");
                    finish_upload.setHeader("X-UCloud-World", "abcd");
                    finish_upload.setHeader("X-UCloud-Hello", "3.14");
                    var client = new AuthClient(finish_upload);
                    client.SendRequest(function(res) {
                        if (res instanceof Error) {
                            console.log(util.inspect(res));
                        } else {
                            console.log(util.inspect(res));
                        }
                    });
                } else {
                    i++;
                    loop_body();
                }
            }
        });	
    }
}

