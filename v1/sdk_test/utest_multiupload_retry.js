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
var file_path = "6M-file";
var UPLOAD_ID = "";


var InitMultiUpload = function() {
    assert(fs.existsSync(file_path));

    var method = 'POST';
    var url_path_params = '/' + key + '?uploads';
    var init_upload = new HttpRequest(method, url_path_params, bucket, key, file_path);

init_upload.setHeader("X-UCloud-Hello", "1234");
init_upload.setHeader("X-UCloud-World", "abcd");
init_upload.setHeader("X-UCloud-Hello", "3.14");

    var client = new AuthClient(init_upload);
    client.SendRequest(InitResponse);
};

var InitResponse = function(res) {
    if (res instanceof Error || res.statusCode != 200) {
        console.error('InitResponse ' + util.inspect(res));
    } else {
        console.log('InitResponse ' + util.inspect(res));
        var body = res.body;
		UPLOAD_ID = body.UploadId;
        BuildTasks(file_path, body.UploadId, body.BlkSize, body.Bucket, body.Key);
    }
};

var TASK_MAP = {};
var SUCCESS_TASK_MAP = {};

var BuildTasks = function(file_path, upload_id, blk_size, bucket, key) {
    assert(fs.existsSync(file_path));
    assert(blk_size > 0);
    var file_size = helper.GetFileSize(file_path);
    console.log("file_size = " + file_size);
    var TASK_MAP_LENGTH = file_size / blk_size | 0;
	if (file_size % blk_size > 0) {
		TASK_MAP_LENGTH++;
	}
	console.log('TASK_MAP_LENGTH = ' + TASK_MAP_LENGTH);
    var MIME_TYPE = helper.GetMimeType(file_path);

    for (var i = 0; i < TASK_MAP_LENGTH; i++) {
        var start = i * blk_size;
        var end = i * blk_size + blk_size - 1;
        var stream_size = blk_size;
        if (i === TASK_MAP_LENGTH - 1 && file_size % blk_size > 0) {
            end = i * blk_size + (file_size % blk_size);
            stream_size = file_size % blk_size;
        }
        var options = {
            start: start,
            end: end
        };
        var task_id = '' + i;
        var task_item = {
            'task_id': task_id,
            'file_path': file_path,
            'mime_type': MIME_TYPE,
            'options': options,
            'stream_size': stream_size
        };
        var method = 'PUT';
        var url_path_params = '/' + key + '?uploadId=' + upload_id + '&partNumber=' + i;
        task_item['bucket'] = bucket;
        task_item['key'] = key;
        task_item['method'] = method;
        task_item['url_path_params'] = url_path_params;
        TASK_MAP[task_id] = task_item;
    }
	console.log('TASK_MAP ' + util.inspect(TASK_MAP));
    AllocateTasks();
};



// 从 TASK_MAP 获取任务， 成功的任务加入 SUCCESS_TASK_MAP
// 把 TASK_MAP 中的task分配给 TaskRunner
// 每个TaskRunner对同一个任务重复执行3次，3次都失败，选择下一个任务
// 任务执行成功的TaskRunner会获取新的任务继续执行，
// 存在失败的，对于TASK_MAP重复执行，在TASK_MAP上的尝试次数为3次

var ALLOCATE_TASKS_LENGTH = 3;
var ALLOCATE_TASKS_COUNT = 0;

//分成10个task, 编号分别为0~9，编号i的task负责上传i,i+10,i+20...的分片上传
var TASK_RUNNER_LENGTH = 10;

var AllocateTasks = function() {
	console.log('AllocateTasks ... ');
    if (ALLOCATE_TASKS_COUNT === ALLOCATE_TASKS_LENGTH) {
        console.log('we have try ' + ALLOCATE_TASKS_COUNT + ' times, but still failed');
        process.exit(-1);
    }

    if (Object.keys(TASK_MAP).length === 0) {
        console.log('no task to do');
        process.exit(-1);
    }

    TASK_RUNNER_COUNTER = {};
    for (var i = 0; i < TASK_RUNNER_LENGTH; i++) {
        var task_array = [];
        for (var j = i; j < Object.keys(TASK_MAP).length; j += TASK_RUNNER_LENGTH) {
			var task_id = '' + j;
            task_array.push(task_id);
        }
        console.log('task_array ' + util.inspect(task_array));
        if (task_array.length > 0) {
            var task_runner_id = '' + i;
            TaskRunnerArray(task_runner_id, task_array);
        } else {
            break;
        }
    }
};

var TASK_RUNNER_TETRY = 3;
var TASK_RUNNER_COUNTER = {};
var TaskRunnerArray = function(task_runner_id, task_array) {
    TASK_RUNNER_COUNTER[task_runner_id] = {
        'finish': false
    };
    TaskRunner(task_runner_id, 0, task_array, 0);
};

var TaskRunner = function(task_runner_id, index, task_array, retry) {
	console.log('task runner -> task_runner_id: ' + task_runner_id + ', index: ' + index + ', retry: ' + retry);
    if (index === task_array.length) {
        //当前TaskRunner任务执行完毕 检查所有TaskRunner是否执行完毕
        TASK_RUNNER_COUNTER[task_runner_id]['finish'] = true;
        for (var id in TASK_RUNNER_COUNTER) {
            if (!TASK_RUNNER_COUNTER[id]['finish']) {
                return;
            }
        }
        if (Object.keys(TASK_MAP).length === 0) {
            FinishMultiUpload();
        } else {
            ALLOCATE_TASKS_COUNT++;
            console.log('allocate tasks again');
            AllocateTasks();
        }
        return;
    }

    if (retry === TASK_RUNNER_TETRY) {
        TaskRunner(task_runner_id, index + 1, task_array, 0);
        //本次 TaskRunner 结束
        return;
    }

    var task = TASK_MAP[task_array[index]];
    var file_path = task['file_path'];
    var options = task['options'];
    var read_stream = fs.createReadStream(file_path, options);

    var part_upload = new MultiUpload(task['method'],
        task['url_path_params'], task['bucket'], task['key'],
        read_stream, task['stream_size'], task['mime_type']);

    part_upload.setHeader("X-UCloud-Hello", "1234");
    part_upload.setHeader("X-UCloud-World", "abcd");
    part_upload.setHeader("X-UCloud-Hello", "3.14");

    var client = new AuthClient(part_upload);
    client.SendRequest(function(res) {
        if (res instanceof Error || res.statusCode != 200 || !res.header) {
            console.error('error task_runner_id ' + task_runner_id + ' index ' + index + ' retry ' + retry + ' -> ' + util.inspect(res));
            TaskRunner(task_runner_id, index, task_array, retry + 1);

        } else {
            console.log('task_runner_id ' + task_runner_id + ' index ' + index + ' retry ' + retry + ' -> ' + util.inspect(res));
            res.header.etag.replace(/\"/g, "");
            task['etag'] = res.header.etag;
            SUCCESS_TASK_MAP[task['task_id']] = task;
            delete TASK_MAP[task['task_id']];
            TaskRunner(task_runner_id, index + 1, task_array, 0);
        }
    });

};

var FinishMultiUpload = function() {
    var method = 'POST';
    var new_key = "new" + key;
    var url_path_params = '/' + key + '?uploadId=' + UPLOAD_ID + '&newKey=' + new_key;

    var etags = [];
    for (var k in SUCCESS_TASK_MAP) {
        etags.push(SUCCESS_TASK_MAP[k]['etag']);
    }
    var etags_str = etags.toString();
    console.log('FinishMultiUpload ' + etags_str);

    var read_stream = new streamifier.createReadStream(etags_str);
    var finish_upload = new MultiUpload(method, url_path_params, bucket, key, read_stream, etags_str.length);

    finish_upload.setHeader("X-UCloud-Hello", "1234");
    finish_upload.setHeader("X-UCloud-World", "abcd");
    finish_upload.setHeader("X-UCloud-Hello", "3.14");

    var client = new AuthClient(finish_upload);
    client.SendRequest(function(res) {
        if (res instanceof Error) {
            console.error('FinishMultiUpload ' + util.inspect(res));
            process(-1);
        } else {
            console.log('FinishMultiUpload ' + util.inspect(res));
            process.exit(0);
        }
    });
};

if (require.main === module) {
    console.log('start...');
    InitMultiUpload();
}
