$(function() {
    // 从qiniuModel中获取数据

    qiniuModel.getSetting().then(function(data) {
        $('#AK').val(data.accessKey);
        $('#SK').val(data.secretKey);
        $('#domain').val(data.domain);
        $('#bucket').val(data.bucket);
    }, function() {

    });

    $('#save').on('click', function() {
        var data = {
            accessKey: $('#AK').val(),
            secretKey: $('#SK').val(),
            domain: $('#domain').val(),
            bucket: $('#bucket').val()
        };

        qiniuModel.setSetting(data).then(function() {

            alert('save success');

        }, function() {

            alert('failed!!!');
        });
    });
});
