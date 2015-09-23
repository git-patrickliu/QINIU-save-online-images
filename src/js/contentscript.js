chrome.runtime.onMessage.addListener(function (data) {

    // 向background上报一下，收到了消息
    chrome.runtime.sendMessage({
        msg: 'it is me',
        action: 'CONSOLE'
    });

    if(data && data.action === 'UPLOAD_IMG') {

        console.log('UPLOAD_IMG');


        // 在页面当中新建一个canvas来取base64值
        var image = new Image();
        image.src = data.srcUrl;

        image.onload = function() {

            try {

                // 通过canvas来获取base64的值
                var canvas = document.createElement('canvas');
                canvas.height = image.height;
                canvas.width = image.width;

                var ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);

                var base64 = canvas.toDataURL();

                // 将此值发送给background.js
                chrome.runtime.sendMessage({
                    srcUrl: data.srcUrl,
                    base64: base64,
                    action: 'UPLOAD_BY_BASE64'
                }, responseHandler);

            } catch(e) {

                // 使用url方式进行传递
                // action: 'UPLOAD_BY_URL'
                // 将此值发送给background.js
                chrome.runtime.sendMessage({
                    srcUrl: data.srcUrl,
                    action: 'UPLOAD_BY_URL'
                }, responseHandler);
            }

        }
    } else if(data && data.action === 'UPLOAD_FILE') {


        console.log('UPLOAD_FILE');

        chrome.runtime.sendMessage({
            srcUrl: data.srcUrl,
            action: 'UPLOAD_BY_URL'
        }, responseHandler);

    } else if(data && data.action === 'SHOW_MSG') {

        alert(data.msg);
    }
});

function responseHandler(response) {

    if(response) {

        if(response.action === 'SHOW_MSG') {
            alert(response.msg);
        } else if(response.action === 'OPEN_PAGE') {
            window.open(response.pageUrl);
        }
    }
}
