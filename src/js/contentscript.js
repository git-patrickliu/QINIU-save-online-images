/**
 * Created with JetBrains PhpStorm.
 * User: patrickliu
 * Date: 13-12-17
 * Time: 下午2:15
 * To change this template use File | Settings | File Templates.
 */

var url = window.location.href,
    regexpDev = /^https?:\/\/devid/,
    regexpOa = /^https?:\/\/oaid/,
    regexOl = /^https?:\/\/id/,
    localAccount = {},
    env = '',
    envAccount = {}; //default value

//判断属于哪一个 dev oa ol
if(regexpDev.test(url)) {
    //dev
    env = 'dev';

} else if(regexpOa.test(url)){
    //oa
    env = 'oa';

} else if(regexOl.test(url)) {
    //ol
    env = 'ol';
}

if(!env) {
    //可能是pt框
    var $loginButton = $('#login_button'),
        $u = $('#u'),
        $p = $('#p');

    //绑定#login_button的点击事件
    $loginButton.click(function() {
        //点击之后将用户名和密码传给background.js用于保存
        var uValue = $.trim($u.val()),
            pValue = $.trim($p.val());

        if(uValue !== '' && pValue !== '') {
            chrome.runtime.sendMessage({
                from: 'pt',
                account: uValue,
                pwd: pValue
            });
        }
    });

    //pt框来监听数据到来
    chrome.runtime.onMessage.addListener(function(data) {
        if(data) {
            var account = data.account,
                pwd = data.pwd;

            // 下面代码为啥要这样写呢？因为pt登陆框在输入账号之后，input框blur之后实现上会发送一个
            // 请求去后台来判断一些是否要输入验证码的逻辑，并会种下一些比较重要的cookie,
            // 所以这里setTimeout了 100秒 和 1000秒来模拟手动的行为
                $u.val(account);
                $u[0].focus();
                setTimeout(function() {
                    $p[0].focus();
                    $p.val(pwd);
                    setTimeout(function() {
                        $loginButton.click();
                    }, 1000);
                }, 100);
        }
    });
} else {
    //判断url中是否有accout和pwd的字段, 隐藏的一种快捷登陆方式，通过url#account=xxxxx&pwd=xxxxx
    //小彩蛋一个
    var existAccountAndPwd = '#.*account=([^&]*)&pwd=([^&]*)',
        matchedAccountAndPwd = url.match(existAccountAndPwd),
        userAccount = '',
        userPwd = '';

    if(matchedAccountAndPwd && matchedAccountAndPwd.length > 2) {
        userAccount = matchedAccountAndPwd[1];
        userPwd = matchedAccountAndPwd[2];
        chrome.runtime.sendMessage({
            account: userAccount,
            pwd: userPwd
        }, function(res) {
        });
    }

    //账户中心页面
    //从chrome localstorage 来获取数据
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
            localAccount = obj;
            chrome.storage.sync.set({
                'accounts': localAccount
            });
        } else {
            localAccount = obj['accounts'];
        }

        envAccount = localAccount[env];

        //获取页面上的号码
        var $user = $('#user'),
            mainAccount = $user.attr('account'),
            crtAccountRegexp = /\((\d*)\)$/,
            crtAccountText = $user.text().slice(4),
            crtAccountArray = crtAccountText.match(crtAccountRegexp),
            crtAccount = '',
            isAdmin = window.location.href.indexOf('adminIndex') !== -1;

        if(crtAccountArray && crtAccountArray.length > 1) {
            crtAccount = crtAccountArray[1];
        }

        if(crtAccount) {
            if(!envAccount[mainAccount]) {
                envAccount[mainAccount] = {};
            }

            // {mainAccount: '', name: '', comment: ''}
            if(!envAccount[mainAccount][crtAccount]) {
                envAccount[mainAccount][crtAccount] = {
                    'mainAccount': mainAccount,
                    'name': crtAccountText,
                    'role': mainAccount === crtAccount ? '主号' : (isAdmin === true ? '管理员' : '')
                };
            } else {
                envAccount[mainAccount][crtAccount]['mainAccount'] = mainAccount;
                envAccount[mainAccount][crtAccount]['name'] = crtAccountText;
            }

            //设置账号的环境
            localAccount['accountEnvHash'][crtAccount] = env;
            chrome.storage.sync.set({'accounts': localAccount});
        }
    });

}

//监听contextMenu变化，选中的是数字才让弹出的contextMenu可以选中“快捷打开企业QQ账号”
document.addEventListener('selectionchange', function() {
    var selection = window.getSelection().toString().trim();
    chrome.runtime.sendMessage({
        from: 'selectionChange',
        selection: selection
    });
});

