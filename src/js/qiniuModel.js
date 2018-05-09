/**
 * Created by patrickliu on 15/9/19.
 */

var qiniuModel = {

    getDefaultSetting: function () {
        var that = this;
        return new Promise(function (resolve, reject) {
            var defaultBucket = {};
            that.getSetting()
                .then(function (QINIU) {
                    defaultBucket.accessKey = QINIU.accessKey;
                    defaultBucket.secretKey = QINIU.secretKey;

                    var buckets = QINIU.buckets || [];
                    buckets.forEach(function (bucket) {
                        if(bucket.isDefault) {
                            defaultBucket.bucket = bucket.bucket;
                            defaultBucket.domain = bucket.domain;
                            defaultBucket.allDirs = bucket.allDirs;
                            defaultBucket.defaultDir = bucket.defaultDir;
                        }
                    });
                    resolve(defaultBucket);
                });
        });
    },

    getSetting: function() {

        return new Promise(function(resolve, reject) {

            chrome.storage.local.get('QINIU_EXTEND', function(data) {

                if(data) {

                    var QINIU_EXTEND = data['QINIU_EXTEND'];

                    if(QINIU_EXTEND && QINIU_EXTEND.accessKey && QINIU_EXTEND.secretKey && QINIU_EXTEND.buckets.length !== 0) {

                        resolve(QINIU_EXTEND);

                    } else {

                        reject(null);

                    }

                } else {

                    reject(null);
                }

            });
        });

    },

    setSetting: function(data) {

        return new Promise(function(resolve, reject) {
            chrome.storage.local.set({
                QINIU_EXTEND: data
            }, function() {
                resolve();
            });
        });
    },

    // 0.0.8以上有一个更新，需要dataTransfer
    dataTransfer: function () {
        var that = this;
        return new Promise(function (resolve, reject) {
            chrome.storage.local.get('QINIU', function(data) {
                if(data['QINIU']) {
                    var result = data['QINIU'];
                    // 转成QINIU_EXTEND格式再存起来
                    var QINIU_EXTEND = {
                        accessKey: result.accessKey || '',
                        secretKey: result.secretKey || '',
                        buckets: [{
                            bucket: result.bucket,
                            domain: result.domain,
                            allDirs: result.allDirs,
                            defaultDir: result.defaultDir,
                            isEditing: false,
                            isDefault: true,
                            inputVisible: false,
                            inputValue: ''
                        }]
                    };
                    that.setSetting(QINIU_EXTEND)
                        .then(function () {
                            resolve();
                        }, function () {
                            reject();
                        });
                } else {
                    resolve();
                }
            });
        });
    },

    getUpToken: function(data) {

        var that = this;

        var genUpToken = function(accessKey, secretKey, putPolicy) {

                //STEP 2
                var put_policy = JSON.stringify(putPolicy);

                //STEP 3
                var encoded = base64encode(utf16to8(put_policy));

                //STEP 4
                var hash = CryptoJS.HmacSHA1(encoded, secretKey);
                var encoded_signed = hash.toString(CryptoJS.enc.Base64);

                //STEP 5
                var upload_token = accessKey + ":" + safe64(encoded_signed) + ":" + encoded;

                return upload_token;
            };

        return new Promise(function(resolve, reject) {

            that.getDefaultSetting().then(function(userData) {

                data.token =
                    genUpToken(
                        userData.accessKey,
                        userData.secretKey,
                        $.extend({
                            scope: userData.bucket,
                            deadline: parseInt(new Date()/1000, 10) + 3600 // 1小时有效期
                        }, data.fileName ? {
                            saveKey: data.fileName
                        } : {}));

                resolve({
                    data: data,
                    userData: userData
                });

            }, function() {

                reject(null);
            })
        });

    },

    getAccessToken: function(data) {

        var that = this;

        var genAccessToken = function(accessKey, secretKey, bucket, srcUrl) {

            var signingStr = "/fetch/" + safe_base64_encode(srcUrl) + "/to/" + safe_base64_encode(bucket + (data.fileName ? (':' + data.fileName) : (''))) + '\n';

            var hash = CryptoJS.HmacSHA1(signingStr, secretKey);
            var encoded_signed = hash.toString(CryptoJS.enc.Base64);

            var accessToken = accessKey + ":" + safe64(encoded_signed);

            return accessToken;
        };

        return new Promise(function(resolve, reject) {

            that.getDefaultSetting().then(function(userData) {

                data.token =
                    genAccessToken(
                        userData.accessKey,
                        userData.secretKey,
                        userData.bucket,
                        data.srcUrl
                    );

                resolve({
                    data: data,
                    userData: userData
                });

            }, function() {

                reject(null);
            });
        });
    }
};
