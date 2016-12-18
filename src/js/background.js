var initContextMenus = function() {
    
    chrome.contextMenus.removeAll();

    var parentContextMenuId = chrome.contextMenus.create({

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
            qiniuController.getSetting().then(function(QINIU) {

                // src路径方式
                if(info.srcUrl) {

                    chrome.tabs.sendMessage(tab.id, {
                        action: 'UPLOAD_IMG',
                        tabId: tab.id,
                        dir: QINIU.defaultDir,
                        srcUrl: info.srcUrl
                    }, {
                        frameId: 0
                    });
                } else if(info.linkUrl) {

                    //href方式
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'UPLOAD_FILE',
                        tabId: tab.id,
                        dir: QINIU.defaultDir,
                        srcUrl: info.linkUrl
                    }, {
                        frameId: 0
                    });

                }

            }, function() {


                chrome.tabs.sendMessage(tab.id, {
                    action: 'SHOW_MSG',
                    tabId: tab.id,
                    msg: '未设置七牛相关设置，请点击七牛在线存图ICON前往设置'
                }, {
                    frameId: 0
                });
            });
        }
    });

    qiniuController.getSetting().then(function(QINIU) {
        if(QINIU && QINIU.allDirs && QINIU.allDirs.length > 1) {

            var allDirs = QINIU.allDirs;
            for(var i = 0, len = allDirs.length; i < len; i++) {

                var singleDir = allDirs[i] || '根目录';
                var subContextMenuId = chrome.contextMenus.create({

                    id: singleDir + '_' + (+ new Date()),

                    type: 'normal',

                    title: singleDir,

                    // contexts有很多种，
                    // "all", "page", "frame", "selection", "link", "editable", "image", "video", "audio", "launcher", "browser_action", or "page_action"
                    // 我们选用的是image
                    // 只在图片上面有action
                    parentId: parentContextMenuId,
                    contexts: ['all'],
                    onclick: function(info, tab) {
                        // 获取图片url,
                        // 然后推送到七牛
                        // 将info.srcUrl推送给contentscript
                        // 如果没有设置七牛的相关项，则不推送
                        qiniuController.getSetting().then(function(QINIU) {

                            // src路径方式
                            if(info.srcUrl) {

                                chrome.tabs.sendMessage(tab.id, {
                                    action: 'UPLOAD_IMG',
                                    tabId: tab.id,
                                    dir: info.menuItemId.split('_')[0],
                                    srcUrl: info.srcUrl
                                }, {
                                    frameId: 0
                                });
                            } else if(info.linkUrl) {

                                //href方式
                                chrome.tabs.sendMessage(tab.id, {
                                    action: 'UPLOAD_FILE',
                                    tabId: tab.id,
                                    dir: info.menuItemId.split('_')[0],
                                    srcUrl: info.linkUrl
                                }, {
                                    frameId: 0
                                });

                            }

                        }, function() {


                            chrome.tabs.sendMessage(tab.id, {
                                action: 'SHOW_MSG',
                                tabId: tab.id,
                                msg: '未设置七牛相关设置，请点击七牛在线存图ICON前往设置'
                            }, {
                                frameId: 0
                            });
                        });
                    }
                });
            }

        }
    });
};
initContextMenus(); 

chrome.runtime.onMessage.addListener(function(data, messageSender, response) {
    // 将此值上传到七牛bucket当中
    // 通过BASE64方式传递

    var tab = messageSender.tab || {};

    if(data) {


        qiniuController.getSetting().then(function(QINIU) {

            // 如果没有填,则给默认的
            if(typeof data.dir === 'undefined') {
                data.dir = QINIU.defaultDir;
            }

            if(data.action === 'UPLOAD_BY_BASE64') {


                var REGEXP_EXT = /^data:image\/([^;]*)/,
                    matched = data.base64.match(REGEXP_EXT);

                var ext = '';

                if(matched && matched.length > 1) {
                    ext = matched[1];
                    data.fileName = (data.dir ? (data.dir + '/') : '') + CryptoJS.MD5(data.srcUrl) + '.' + ext;
                }

                qiniuController.uploadByBase64(data).then(function(callbackData) {

                        response({
                            action: 'OPEN_PAGE',
                            tabId: tab.id,
                            pageUrl: QINIU.domain + '/' + data.fileName
                        });

                }, function() {

                    console.log('failed');
                });

                return true;


            } else if(data.action === 'UPLOAD_BY_URL') {


                try {

                    var ext = '';

                    // 从url当中获取ext
                    var extFrament = data.srcUrl.split('.')[data.srcUrl.split('.').length - 1];
                    var REGEXP_EXT = /^([^\/\\\?]*)/,
                        matched = extFrament.match(REGEXP_EXT);


                    if(matched && matched.length > 1) {
                        ext = matched[1];
                        data.fileName = (data.dir ? (data.dir + '/') : '') + CryptoJS.MD5(data.srcUrl) + '.' + ext;
                    }

                } catch(e) {

                }

                // 通过URL方式传递
                qiniuController.uploadByUrl(data).then(function(callbackData) {

                    response({
                        action: 'OPEN_PAGE',
                        tabId: tab.id,
                        pageUrl: QINIU.domain + '/' + data.fileName
                    });

                }, function() {

                });

                return true;

            } else if(data.action === 'CONSOLE') {

                // console.log('get msg from ' + tab.id);

            } else if(data.action === 'REFRESH_CONTEXT_MENUS') {
                // 
                initContextMenus();
            }
        });
        return true;
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
