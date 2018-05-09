/**
 * Created by patrickliu on 15/9/19.
 */

import { assignIn } from 'lodash';
import CryptoJS, { base64encode, safe64, utf16to8, safeBase64Encode } from './CryptoJS';

const qiniuModel = {
  getDefaultSetting: () =>
    new Promise((resolve) => {
      const defaultBucket = {};
      qiniuModel.getSetting()
        .then((QINIU) => {
          defaultBucket.accessKey = QINIU.accessKey;
          defaultBucket.secretKey = QINIU.secretKey;
          defaultBucket.isSelfDefinePicName = QINIU.isSelfDefinePicName;
          const buckets = QINIU.buckets || [];
          buckets.forEach((bucket) => {
            if (bucket.isDefault) {
              defaultBucket.bucket = bucket.bucket;
              defaultBucket.domain = bucket.domain;
              defaultBucket.allDirs = bucket.allDirs;
              defaultBucket.defaultDir = bucket.defaultDir;
            }
          });
          resolve(defaultBucket);
        });
    }),

  getSetting: () =>
    new Promise((resolve, reject) => {
      chrome.storage.local.get('QINIU_EXTEND', (data) => {
        if (data) {
          const QINIU_EXTEND = data.QINIU_EXTEND;
          if (QINIU_EXTEND
            && QINIU_EXTEND.accessKey
            && QINIU_EXTEND.secretKey
            && QINIU_EXTEND.buckets.length !== 0) {
            resolve(QINIU_EXTEND);
          } else {
            reject(null);
          }
        } else {
          reject(null);
        }
      });
    }),

  setSetting: data =>
    new Promise((resolve) => {
      chrome.storage.local.set({
        QINIU_EXTEND: data,
      }, () => resolve());
    }),

  // 0.0.8以上有一个更新，需要dataTransfer
  dataTransfer: () =>
    new Promise((resolve, reject) => {
      chrome.storage.local.get('QINIU', (data) => {
        if (data.QINIU) {
          const result = data.QINIU;
          // 转成QINIU_EXTEND格式再存起来
          const QINIU_EXTEND = {
            accessKey: result.accessKey || '',
            secretKey: result.secretKey || '',
            isSelfDefinePicName: result.isSelfDefinePicName || false,
            buckets: [{
              bucket: result.bucket,
              domain: result.domain,
              allDirs: result.allDirs,
              defaultDir: result.defaultDir,
              isEditing: false,
              isDefault: true,
              inputVisible: false,
              inputValue: '',
            }],
          };
          qiniuModel.setSetting(QINIU_EXTEND)
            .then(() => resolve(), () => reject());
        } else {
          resolve();
        }
      });
    }),

  getUpToken: (data) => {
    const genUpToken = (accessKey, secretKey, putPolicy) => {
      // STEP 2
      const putPolicyStr = JSON.stringify(putPolicy);
      // STEP 3
      const encoded = base64encode(utf16to8(putPolicyStr));
      // STEP 4
      const hash = CryptoJS.HmacSHA1(encoded, secretKey);
      const encodedSigned = hash.toString(CryptoJS.enc.Base64);
      // STEP 5
      return `${accessKey}:${safe64(encodedSigned)}:${encoded}`;
    };

    return new Promise((resolve, reject) =>
      qiniuModel.getDefaultSetting().then((userData) => {
        const d = data;
        const { filename } = d;
        d.token =
          genUpToken(
            userData.accessKey,
            userData.secretKey,
            assignIn({
              scope: userData.bucket,
              deadline: parseInt(Date.now() / 1000, 10) + 3600, // 1小时有效期
            }, filename ? {
              saveKey: filename,
            } : {}));
        resolve({
          data: d,
          userData,
        });
      }, () => reject(null)));
  },

  getAccessToken: (data) => {
    const genAccessToken = (accessKey, secretKey, bucket, srcUrl) => {
      const tmpFileName = data.filename ? `:${data.filename}` : '';
      const signingStr = `/fetch/${safeBase64Encode(srcUrl)}/to/${safeBase64Encode(bucket + tmpFileName)}\n`;
      const hash = CryptoJS.HmacSHA1(signingStr, secretKey);
      const encodedSigned = hash.toString(CryptoJS.enc.Base64);
      return `${accessKey}:${safe64(encodedSigned)}`;
    };

    return new Promise((resolve, reject) => {
      const d = data;
      qiniuModel.getDefaultSetting().then((userData) => {
        d.token =
          genAccessToken(
            userData.accessKey,
            userData.secretKey,
            userData.bucket,
            data.srcUrl,
          );
        resolve({
          data: d,
          userData,
        });
      }, () => reject(null));
    });
  },
};

export default qiniuModel;
