const $pasteArea = document.querySelector('#pasteArea');
const onPaste = (evt) => {
  const clipboardData = evt.clipboardData;
  for (let i = 0; i < clipboardData.items.length; i += 1) {
    const item = clipboardData.items[i];
    if (item.kind === 'file' && item.type.match(/^image\//i)) {
      // blob就是剪贴板中的二进制图片数据
      const blob = item.getAsFile();
      const reader = new FileReader();
      // 定义fileReader读取完数据后的回调
      reader.onload = (event) => {
        const base64Str = event.target.result;

        // 将此值发送给background.js
        chrome.runtime.sendMessage({
          // 没有srcUrl,暂时用base64Str代替
          srcUrl: base64Str,
          base64: base64Str,
          action: 'UPLOAD_BY_BASE64',
        }, (response) => {
          if (response) {
            if (response.action === 'SHOW_MSG') {
              alert(response.msg);
            } else if (response.action === 'OPEN_PAGE') {
              window.open(response.pageUrl);
            }
          }
        });
      };
      // 用fileReader读取二进制图片，完成后会调用上面定义的回调函数
      reader.readAsDataURL(blob);
    }
  }
};
$pasteArea.onpaste = onPaste;
