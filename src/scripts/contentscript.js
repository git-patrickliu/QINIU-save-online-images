import qiniuController from './qiniuController';

const responseHandler = (response) => {
  if (response) {
    if (response.action === 'SHOW_MSG') {
      alert(response.msg);
    } else if (response.action === 'OPEN_PAGE') {
      window.open(response.pageUrl);
    }
  }
};
chrome.runtime.onMessage.addListener((data) => {
  // 向background上报一下，收到了消息
  chrome.runtime.sendMessage({
    msg: 'it is me',
    action: 'CONSOLE',
  });

  if (data && data.action === 'UPLOAD_IMG') {
    console.log('UPLOAD_IMG');
    // 先跟用户询问一下，是否需要自定义文件名
    qiniuController.getDefaultSetting()
      .then((QINIU) => {
        const uploadFun = (filename) => {
          // 在页面当中新建一个canvas来取base64值
          const image = new Image();
          image.src = data.srcUrl;
          image.onload = () => {
            try {
              // 通过canvas来获取base64的值
              const canvas = document.createElement('canvas');
              canvas.height = image.height;
              canvas.width = image.width;

              const ctx = canvas.getContext('2d');
              ctx.drawImage(image, 0, 0);

              const base64 = canvas.toDataURL();

              // 将此值发送给background.js
              chrome.runtime.sendMessage({
                srcUrl: data.srcUrl,
                dir: data.dir,
                base64,
                filename,
                action: 'UPLOAD_BY_BASE64',
              }, responseHandler);
            } catch (e) {
              // 使用url方式进行传递
              // action: 'UPLOAD_BY_URL'
              // 将此值发送给background.js
              chrome.runtime.sendMessage({
                srcUrl: data.srcUrl,
                dir: data.dir,
                filename,
                action: 'UPLOAD_BY_URL',
              }, responseHandler);
            }
          };
        }
        if (QINIU.isSelfDefinePicName) {
          // 弹框提示用户输入文件名
          const filename = prompt('请输入自定义图片名(不需要输入后缀名)', '');
          uploadFun(filename);
        } else {
          uploadFun();
        }
      });
  } else if (data && data.action === 'UPLOAD_FILE') {
    console.log('UPLOAD_FILE');
    chrome.runtime.sendMessage({
      srcUrl: data.srcUrl,
      dir: data.dir,
      action: 'UPLOAD_BY_URL',
    }, responseHandler);
  } else if (data && data.action === 'SHOW_MSG') {
    alert(data.msg);
  }
});
