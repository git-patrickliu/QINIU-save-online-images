$(function() {
    // 从qiniuModel中获取数据

    qiniuModel.getSetting().then(function(data) {
        $('#AK').val(data.accessKey);
        $('#SK').val(data.secretKey);
        $('#domain').val(data.domain);
        $('#bucket').val(data.bucket);
        $('#directories').val(data.directories);
    }, function() {

    });

    $('#save').on('click', function() {
        var data = {
            accessKey: $('#AK').val(),
            secretKey: $('#SK').val(),
            domain: $('#domain').val(),
            bucket: $('#bucket').val(),
            directories: $('#directories').val()
        };

        qiniuModel.setSetting(data).then(function() {

            alert('save success');
            // 通知contextMenus刷新
            chrome.runtime.sendMessage({
                action: 'REFRESH_CONTEXT_MENUS'
            });

        }, function() {

            alert('failed!!!');
        });
    });
});
