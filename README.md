# UCloud US3 Node.js SDK

[![Software License](https://img.shields.io/github/license/saltstack/salt)](LICENSE)

Node.js SDK for UCloud US3 (原名UFile 对象存储服务)

## 目录说明
./ufile     -- US3的Node.js SDK，其依赖的模块可以查看./ufile/package.json    
./sdk_test  -- Node.js SDK的测试脚本    
./raw_test  -- 不依赖于Node.js SDK的测试脚本，适合阅读人群：需要探究细节，采用原生HTTP请求     


## US3的Node.js SDK使用方式

### 修改配置    

修改./ufile/config.json，填写你的 ucloud_public_key 和 ucloud_private_key （这对key可以在你ucloud账号的控制台中'API密钥'看到）

### 安装SDK
进入sdk_test目录，执行
(sudo) npm install ../ufile  

如果你的测试脚本和ufile在同一级目录，执行
(sudo) npm install ufile

### 运行脚本
例如，运行put上传脚本      

先到ucloud控制台创建一个bucket，或者使用命令行工具，创建、修改、删除bucket等API，本SDK不提供。      

修改utest_put.js中的bucket、key、file_path参数      

执行 node utest_put.js       
     
## 许可证
[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0.html)
