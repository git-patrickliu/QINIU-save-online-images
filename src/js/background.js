 var contextMenuId = chrome.contextMenus.create({

    type: 'normal',

    title: '存入七牛云存储',

    // contexts有很多种，
    // "all", "page", "frame", "selection", "link", "editable", "image", "video", "audio", "launcher", "browser_action", or "page_action"
    // 我们选用的是image
    // 只在图片上面有action
    contexts: ['image', 'link'],
    onclick: function(info, tab) {
        // 获取图片url,
        // 然后推送到七牛
        // 将info.srcUrl推送给contentscript
        // 如果没有设置七牛的相关项，则不推送
        qiniuController.getSetting().then(function() {

            // src路径方式
            if(info.srcUrl) {

                chrome.tabs.sendMessage(tab.id, {
                    action: 'UPLOAD_IMG',
                    srcUrl: info.srcUrl
                });
            } else if(info.linkUrl) {

                //href方式
                chrome.tabs.sendMessage(tab.id, {
                    action: 'UPLOAD_FILE',
                    srcUrl: info.linkUrl
                });

            }

        }, function() {

            chrome.tabs.sendMessage(tab.id, {
                action: 'SHOW_MSG',
                msg: '未设置七牛相关设置，请点击七牛在线存图ICON前往设置'
            });
        });
    }
});

chrome.runtime.onMessage.addListener(function(data, messageSender) {
    // 将此值上传到七牛bucket当中
    // 通过BASE64方式传递

    var tab = messageSender.tab;

    if(data) {

        if(data.action === 'UPLOAD_BY_BASE64') {

            var REGEXP_EXT = /^data:image\/([^;]*)/,
                matched = data.base64.match(REGEXP_EXT);

            var ext = '';

            if(matched && matched.length > 1) {
                ext = matched[1];
                data.fileName = CryptoJS.MD5(data.srcUrl) + '.' + ext;
            }

            qiniuController.uploadByBase64(data).then(function(callbackData) {

                qiniuController.getSetting().then(function(userData) {

                    chrome.tabs.sendMessage(tab.id, {
                        action: 'SHOW_MSG',
                        msg: userData.domain + '/' + userData.bucket + '/' + callbackData.key
                    });

                });



            }, function() {
                console.log('failed');
            });


        } else if(data.action === 'UPLOAD_BY_URL') {


            try {

                var ext = '';

                // 从url当中获取ext
                var extFrament = data.srcUrl.split('.')[data.srcUrl.split('.').length - 1];
                var REGEXP_EXT = /^([^\/\\\?]*)/,
                    matched = extFrament.match(REGEXP_EXT);


                if(matched && matched.length > 1) {
                    ext = matched[1];
                    data.fileName = CryptoJS.MD5(data.srcUrl) + '.' + ext;
                }

            } catch(e) {

            }

            // 通过URL方式传递
            qiniuController.uploadByUrl(data).then(function(callbackData) {

                qiniuController.getSetting().then(function(userData) {

                    chrome.tabs.sendMessage(tab.id, {
                        action: 'SHOW_MSG',
                        msg: '地址:  ' + userData.domain + '/' + callbackData.key
                    });

                });

            }, function() {

            });
        }
    }
});

 // 绑定browserAction的点击事件
chrome.browserAction.onClicked.addListener(function() {
    chrome.tabs.create({ url: chrome.extension.getURL('html/options.html') });
});

 // after install, we open the options page
chrome.runtime.onInstalled.addListener(function () {
    chrome.tabs.create({ url: chrome.extension.getURL('html/options.html') });
});
