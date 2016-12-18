/**
 * Created by patrickliu on 15/9/19.
 */

var qiniuModel = {

    getSetting: function() {

        return new Promise(function(resolve, reject) {

            chrome.storage.local.get('QINIU', function(data) {

                if(data) {

                    var QINIU = data['QINIU'];

                    if(QINIU && QINIU.accessKey && QINIU.secretKey && QINIU.domain && QINIU.bucket) {

                        resolve(QINIU);

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
            
            var directories = data.directories;
            if(directories) {
                
                data.defaultDir = directories.split(',')[0];
                data.allDirs = directories.split(',');
            } else {
                // 根据directories来设置defaultDir
                data.defaultDir = '';
                data.allDirs = [''];
            }

            chrome.storage.local.set({
                QINIU: data
            }, function() {
                resolve();
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

            that.getSetting().then(function(userData) {

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

            that.getSetting().then(function(userData) {

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
