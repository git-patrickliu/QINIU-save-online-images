/**
 * Created with JetBrains PhpStorm.
 * User: patrickliu
 * Date: 13-12-17
 * Time: 下午2:29
 * To change this template use File | Settings | File Templates.
 */
// 这个函数是用于在再次登录其他号时，删除上一个的所有cookie用的
var deleteRelatedCookies = function(env, callback) {
    var removeCookie = function(dataObj) {
        var deferred = $.Deferred();
        chrome.cookies.remove(dataObj, function(details) {
            if(!details) {
                deferred.reject();
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise();
    };

    // 企业QQ账户中心cookie
    var needRemoveHrtxCookie = '';
    if(env === 'ol') {
        needRemoveHrtxCookie = 'hrtxcookie_v3';
    } else if(env === 'oa') {
        needRemoveHrtxCookie = 'hrtxcookie_v3oa';
    } else if(env === 'dev') {
        needRemoveHrtxCookie = 'hrtxcookie_v3dev';
    }

    // 我能找到的关于登录的cookie全部删掉！
    $.when(
            removeCookie({
                url: 'http://ptlogin2.qq.com/',
                name: 'superkey'
            }),
            removeCookie({
                url: 'https://ptlogin2.qq.com/',
                name: 'superkey'
            }),
            removeCookie({
                url: 'http://ptlogin2.qq.com/',
                name: 'superuin'
            }),
            removeCookie({
                url: 'https://ptlogin2.qq.com/',
                name: 'superuin'
            }),
            removeCookie({
                url: 'http://b.qq.com/',
                name: 'p_skey'
            }),
            removeCookie({
                url: 'https://b.qq.com/',
                name: 'p_skey'
            }),
            removeCookie({
                url: 'http://b.qq.com/',
                name: 'p_uin'
            }),
            removeCookie({
                url: 'https://b.qq.com/',
                name: 'p_uin'
            }),
            removeCookie({
                url: 'http://b.qq.com/',
                name: 'p_luin'
            }),
            removeCookie({
                url: 'https://b.qq.com/',
                name: 'p_luin'
            }),
            removeCookie({
                url: 'http://b.qq.com/',
                name: 'p_lskey'
            }),
            removeCookie({
                url: 'https://b.qq.com/',
                name: 'p_lskey'
            }),
            removeCookie({
                url: 'http://b.qq.com/',
                name: 'pt4_token'
            }),
            removeCookie({
                url: 'https://b.qq.com/',
                name: 'pt4_token'
            }),
            removeCookie({
                url: 'http://qq.com/',
                name: 'pt_mbkey'
            }),
            removeCookie({
                url: 'https://qq.com/',
                name: 'pt_mbkey'
            }),
            removeCookie({
                url: 'http://qq.com/',
                name: 'uin_m'
            }),
            removeCookie({
                url: 'https://qq.com/',
                name: 'skey_m'
            }),
            removeCookie({
                url: 'http://qq.com/',
                name: 'uin'
            }),
            removeCookie({
                url: 'https://qq.com/',
                name: 'skey'
            }),
            removeCookie({
                url: 'http://b.qq.com/',
                name: needRemoveHrtxCookie
            }),
            removeCookie({
                url: 'https://b.qq.com/',
                name: needRemoveHrtxCookie
            }),
            removeCookie({
                url: 'https://id.b.qq.com/',
                name: 'hrtx_tag'
            }),
            removeCookie({
                url: 'https://id.b.qq.com/hrtx/',
                name: 'hrtx_tag'
            }),
            removeCookie({
                url: 'https://b.qq.com/',
                name: 'hrtx_tag'
            }),
            removeCookie({
                url: 'https://b.qq.com/hrtx/',
                name: 'hrtx_tag'
            }),
            removeCookie({
                url: 'http://id.b.qq.com/',
                name: 'hrtx_tag'
            }),
            removeCookie({
                url: 'http://id.b.qq.com/hrtx/',
                name: 'hrtx_tag'
            }),
            removeCookie({
                url: 'http://b.qq.com/',
                name: 'hrtx_tag'
            }),
            removeCookie({
                url: 'http://b.qq.com/hrtx/',
                name: 'hrtx_tag'
            })
        ).done(function () {
            callback && callback();
        });
};

// 初始化contextMenus, 选中了企业QQ号，右键的contextMenu会加上此项
var contextMenuId = chrome.contextMenus.create({
    type: 'normal',

    // %s会被选中的内容替代
    title: '快速登陆选中的企业QQ号 \'%s\'',

    // contexts有很多种，selection代表是文字选中之后右键的contextMenu
    contexts: ['selection'],
    onclick: function(info, tab) {
        var account = info.selectionText,
            url = tab.url,
            devRegexp = /^https?:\/\/devid/,
            oaRegexp = /^https?:\/\/oaid/,
            olRegexp = /^https?:\/\/id/,
            env = '',
            destUrlHash = {
                'dev': 'https://devid.b.qq.com/login/index',
                'oa': 'https://oaid.b.qq.com/login/index',
                'ol': 'https://id.b.qq.com/login/index'
            },
            destUrl = '',
            deleteCookies = function(env, destUrl, account) {
                deleteRelatedCookies(env, function() {
                    //先获取一下pwd
                    chrome.storage.local.get('accounts', function(obj) {
                        var accounts = obj['accounts'],
                            accountPwdHash = accounts['accountPwdHash'],
                            pwd = accountPwdHash[account] || accounts['defaultPwd'];

                        chrome.tabs.create({
                            url: destUrl
                        }, function (tab) {
                            var callback = function (tabId, changeInfo, newTab) {
                                if (tab.id === newTab.id && changeInfo.status === 'complete') {
                                    chrome.tabs.onUpdated.removeListener(callback);
                                    chrome.tabs.sendMessage(tab.id, {
                                        account: account,
                                        pwd: pwd
                                    });
                                }
                            };
                            chrome.tabs.onUpdated.addListener(callback)
                        });
                    });

                });
            };

        if(devRegexp.test(url)) {
            env = 'dev';
            destUrl = destUrlHash[env];
        } else if(oaRegexp.test(url)) {
            env = 'oa';
            destUrl = destUrlHash[env];
        } else if(olRegexp.test(url)) {
            env = 'ol';
            destUrl = destUrlHash[env];
        }


        if(env === '') {
            //拉了一下保存的数据
            chrome.storage.local.get('accounts', function(obj) {
                var accounts = obj['accounts'],
                    accountEnvHash = accounts['accountEnvHash'];

                //还是不存在的做oa号论处
                env = accountEnvHash[account] || 'oa';
                destUrl = destUrlHash[env];
                deleteCookies(env, destUrl, account);
            });
            //oa号出现的多，所以这么hardcode一下
            env = 'oa';
            destUrl = destUrlHash[env];
        } else {
            deleteCookies(env, destUrl, account);
        }
    }
});
// 获取accounts 数据，这个保存在chrome插件的storage当中, 和localStorage稍有不同，具体可见官网介绍
chrome.storage.local.get('accounts', function(obj) {
    if ($.isEmptyObject(obj)) {
        obj = {
            'dev': {},
            'oa': {},
            'ol': {},
            'accountPwdHash': {},
            'defaultPwd': '',
            'accountEnvHash': {}
        };
        chrome.storage.local.set({
            'accounts': obj
        });
    }
});
// background.js当中进行监听来自contentscript 或是popup.html中的请求
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // 来自popup的请求
        if(request.from && request.from === 'popup') {
            //环境
            var env = request.env;

            //防止登录失败，先将之前种下的相关cookie都删除
            deleteRelatedCookies(env, function() {
                chrome.tabs.create({
                    url: request.url
                }, function (tab) {
                    var callback = function (tabId, changeInfo, newTab) {
                        if (tab.id === newTab.id && changeInfo.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(callback);
                            chrome.tabs.sendMessage(tab.id, {
                                account: request.account,
                                pwd: request.pwd
                            });
                        }
                    };
                    chrome.tabs.onUpdated.addListener(callback)
                });
            });

        } else if(request.from && request.from === 'pt') {
            //从pt过来的，保存账户密码
            var account = request.account,
                pwd = request.pwd;

            chrome.storage.local.get('accounts', function(obj) {
                var localAccount = {};
                if ($.isEmptyObject(obj)) {
                    obj = {
                        'dev': {},
                        'oa': {},
                        'ol': {},
                        'accountPwdHash': {},
                        'defaultPwd': '',
                        'accountEnvHash': {}
                    };
                    localAccount = obj;
                    chrome.storage.local.set({
                        'accounts': localAccount
                    });
                } else {
                    localAccount = obj['accounts'];
                }

                //保存新密码
                var accountPwdHash = localAccount['accountPwdHash'];
                accountPwdHash[account] = pwd;

                //保存至chrome.storage
                chrome.storage.local.set({
                    'accounts': localAccount
                });
            });

        } else if(request.from && request.from == 'selectionChange') {
            // 用于enable和disable contextMenu, 是全数字才enable
            var selection = request.selection,
                isAllDigits = /^\d*$/;
            if(!isAllDigits.test(selection)) {
                chrome.contextMenus.update(contextMenuId, {
                    enabled: false
                });
            } else {
                chrome.contextMenus.update(contextMenuId, {
                    enabled: true
                });
            }

        } else {
            chrome.tabs.sendMessage(sender.tab.id, {
                account: request.account,
                pwd: request.pwd
            });
        }
    }
);

