var tlv_count = 1;
var appendTlvTable = function (content) {
    try {
        if (content.indexOf('color%3A%20red') != -1) {
            $('#tlv-cgi-err').show();
        }

        $("#tlv-cgi-stack").append("No." + tlv_count + ' ' + decodeURIComponent(content));

    } catch (e) {
        $("#tlv-cgi-stack").append("No." + tlv_count + ' ' + unescape(content));
        //$("#tlv-cgi-stack").append("No." + tlv_count + ' ' + 'decodeURIComponent error.<br /><br />');
    }
    tlv_count++;
    return true;
}

// 插入承载HTML
var _html = '<div id="tlv-cgi-err" style="position:fixed; bottom:0; display:none; left:0; opacity:.7; width:100%; height:30px; text-align:center; font-size:18px; font-weight:700; color:#fff; line-height:30px; vertical-align:middle; background:#f00;">↓↓↓注意：Webinterface调用有异常，请检查当前页面底部协议调用列表↓↓↓<span title="关闭" style="display:block; width:28px; height:28px; paddong:0 10px; position:absolute; top:0; right:1px; border:1px solid #fff; cursor:pointer;" onclick="$(\'#tlv-cgi-err\').hide();">X</span></div>';


$('#tlv-cgi-err-container').append('<div id="tlv-cgi-stack" style="width: 953px; margin: 0 auto; line-height:25px;"></div>');
$('#tlv-cgi-err-container').append(_html);

// 点击后弹出具体内容
$("#tlv-cgi-stack").delegate('a', 'click', function () {
    if (this.title) alert(this.title);
});

$('#clear').on('click', function() {
    $('#tlv-cgi-stack').html('');
    tlv_count = 1;
});


chrome.devtools.network.onRequestFinished.addListener(function (request) {
    request.getContent(function (body) {

        var responseData = JSON.parse(body);
        responseData && responseData.callback && new Function('try { ' + responseData.callback + ' } catch(e) {} ')();
    });
});