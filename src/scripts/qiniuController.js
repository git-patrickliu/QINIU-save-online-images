/**
 * Created by patrickliu on 15/9/19.
 */

import { safeBase64Encode } from './CryptoJS';
import qiniuModel from './qiniuModel';

const qiniuController = {
  uploadByBase64: data =>
    new Promise((resolve, reject) => {
      qiniuController.getUpToken(data).then((callbackData) => {
        const { token, base64 } = callbackData.data;
        const url = 'http://up.qiniu.com/putb64/-1';
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4 && xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else if (xhr.readyState === 4 && typeof xhr.status !== 'undefined' && xhr.status !== 200) {
            reject(null);
          }
        };
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.setRequestHeader('Authorization', `UpToken ${token}`);

        // 需要将前缀去掉
        const startIndex = base64.indexOf('base64,');
        // 'base64,'.length === 7
        xhr.send(data.base64.slice(startIndex + 7));
      }, () => reject(null));
    }),

  uploadByUrl: data =>
    new Promise((resolve, reject) => {
      qiniuController.getAccessToken(data).then((callbackData) => {
        const { token, srcUrl, filename } = callbackData.data;
        const { bucket } = callbackData.userData;
        const tmpFN = data.filename ? `:${filename}` : '';
        const url = `http://iovip.qbox.me/fetch/${safeBase64Encode(srcUrl)}/to/${safeBase64Encode(bucket + tmpFN)}`;
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4 && xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else if (xhr.readyState === 4 && typeof xhr.status !== 'undefined' && xhr.status !== 200) {
            reject(null);
          }
        };
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'x-www-form-urlencoded');
        xhr.setRequestHeader('Authorization', `QBox ${token}`);
        xhr.send(null);
      }, () => reject(null));
    }),

  getSetting: () => qiniuModel.getSetting(),

  setSetting: data => qiniuModel.setSetting(data)
    .then(() => chrome.runtime.sendMessage({ action: 'REFRESH_CONTEXT_MENUS' })),

  getDefaultSetting: () => qiniuModel.getDefaultSetting(),

  // getUpToken from qiniu
  getUpToken: data => qiniuModel.getUpToken(data),

  getAccessToken: data => qiniuModel.getAccessToken(data),
};

export default qiniuController;
