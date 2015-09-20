/**
 * Created by patrickliu on 15/9/19.
 */


var qiniuController = {

    uploadByBase64: function(data) {

        var that = this;

        return new Promise(function(resolve, reject) {

            that.getUpToken(data).then(function(callbackData) {

                var data = callbackData.data,
                    userData = callbackData.userData;

                var url = "http://up.qiniu.com/putb64/-1";
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {

                    if (xhr.readyState === 4 && xhr.status === 200) {
                        resolve(JSON.parse(xhr.responseText));
                    } else if(xhr.readyState === 4 && typeof xhr.status !== 'undefined' && xhr.status !== 200) {
                        reject(null);
                    }
                }
                xhr.open("POST", url, true);
                xhr.setRequestHeader("Content-Type", "application/octet-stream");
                xhr.setRequestHeader("Authorization", 'UpToken ' + data.token);

                // 需要将前缀去掉
                var startIndex = data.base64.indexOf('base64,');
                // 'base64,'.length === 7
                xhr.send(data.base64.slice(startIndex + 7));

            }, function() {

                reject(null);
            });
        });
    },

    uploadByUrl: function(data) {

        var that = this;

        return new Promise(function(resolve, reject) {

            that.getAccessToken(data).then(function(callbackData) {

                var data = callbackData.data,
                    userData = callbackData.userData;

                var url = "http://iovip.qbox.me/fetch/" + safe_base64_encode(data.srcUrl) + "/to/" + safe_base64_encode(userData.bucket + (data.fileName ? (':' + data.fileName) : ('')));
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && xhr.status == 200) {

                        resolve(JSON.parse(xhr.responseText));

                    } else if(xhr.readyState == 4 && typeof xhr.status !== 'undefined' && xhr.status != 200) {
                        reject(null);
                    }
                }
                xhr.open("POST", url, true);
                xhr.setRequestHeader("Content-Type", "x-www-form-urlencoded");
                xhr.setRequestHeader("Authorization", 'QBox ' + data.token);

                xhr.send(null);

            }, function() {

                reject(null);
            });
        });
    },

    getSetting: function() {

        return qiniuModel.getSetting();
    },

    // getUpToken from qiniu
    getUpToken: function(data) {
        return qiniuModel.getUpToken(data);
    },

    getAccessToken: function(data) {
        return qiniuModel.getAccessToken(data);
    }
};

