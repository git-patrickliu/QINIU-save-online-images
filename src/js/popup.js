/**
 * Created by patrickliu on 16/11/9.
 */

var $pasteArea = document.querySelector('#pasteArea');
$pasteArea.onpaste = onpaste;

function onpaste(evt) {
    var clipboardData = evt.clipboardData;
    for (var i = 0; i < clipboardData.items.length; i++) {
        var item = clipboardData.items[i];
        if (item.kind == 'file' && item.type.match(/^image\//i)) {
            //blob就是剪贴板中的二进制图片数据
            var blob = item.getAsFile(), reader = new FileReader();
            //定义fileReader读取完数据后的回调
            reader.onload = function (event) {
                var base64Str = event.target.result;

                // 将此值发送给background.js
                chrome.runtime.sendMessage({
                    // 没有srcUrl,暂时用base64Str代替
                    srcUrl: base64Str,
                    base64: base64Str,
                    action: 'UPLOAD_BY_BASE64'
                }, function(response) {

                    if(response) {

                        if(response.action === 'SHOW_MSG') {
                            alert(response.msg);
                        } else if(response.action === 'OPEN_PAGE') {
                            window.open(response.pageUrl);
                        }
                    }
                });
            }
            reader.readAsDataURL(blob);//用fileReader读取二进制图片，完成后会调用上面定义的回调函数
        }
    }
}


