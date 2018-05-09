import qiniuController from './qiniuController';
import qiniuModel from './qiniuModel';
import CryptoJS from './CryptoJS';

const initContextMenus = () => {
  chrome.contextMenus.removeAll();

  const parentContextMenuId = chrome.contextMenus.create({
    type: 'normal',
    title: '存入七牛云存储',
    // contexts有很多种，
    // "all", "page", "frame", "selection", "link",
    // "editable", "image", "video", "audio", "launcher",
    // "browser_action", or "page_action"
    // 我们选用的是image
    // 只在图片上面有action
    contexts: ['image', 'link'],
    onclick: (info, tab) => {
      // 获取图片url,
      // 然后推送到七牛
      // 将info.srcUrl推送给contentscript
      // 如果没有设置七牛的相关项，则不推送
      qiniuController.getDefaultSetting().then((QINIU) => {
        // src路径方式
        if (info.srcUrl) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'UPLOAD_IMG',
            tabId: tab.id,
            dir: QINIU.defaultDir,
            srcUrl: info.srcUrl,
          }, {
            frameId: 0,
          });
        } else if (info.linkUrl) {
          // href方式
          chrome.tabs.sendMessage(tab.id, {
            action: 'UPLOAD_FILE',
            tabId: tab.id,
            dir: QINIU.defaultDir,
            srcUrl: info.linkUrl,
          }, {
            frameId: 0,
          });
        }
      }, () => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'SHOW_MSG',
          tabId: tab.id,
          msg: '未设置七牛相关设置，请点击七牛在线存图ICON前往设置',
        }, {
          frameId: 0,
        });
      });
    },
  });
  qiniuController.getDefaultSetting().then((QINIU) => {
    if (QINIU && QINIU.allDirs && QINIU.allDirs.length > 1) {
      const allDirs = QINIU.allDirs;
      for (let i = 0, len = allDirs.length; i < len; i += 1) {
        const singleDir = allDirs[i] || '根目录';
        chrome.contextMenus.create({
          id: `${singleDir}_${Date.now()}`,
          type: 'normal',
          title: singleDir,
          // contexts有很多种，
          // "all", "page", "frame", "selection", "link",
          // "editable", "image", "video", "audio", "launcher", "browser_action", or "page_action"
          // 我们选用的是image
          // 只在图片上面有action
          parentId: parentContextMenuId,
          contexts: ['all'],
          onclick: (info, tab) => {
            // 获取图片url,
            // 然后推送到七牛
            // 将info.srcUrl推送给contentscript
            // 如果没有设置七牛的相关项，则不推送
            qiniuController.getDefaultSetting().then(() => {
              const dir = info.menuItemId.split('_')[0];
              // src路径方式
              if (info.srcUrl) {
                chrome.tabs.sendMessage(tab.id, {
                  action: 'UPLOAD_IMG',
                  tabId: tab.id,
                  dir: dir === '根目录' ? '' : dir,
                  srcUrl: info.srcUrl,
                }, {
                  frameId: 0,
                });
              } else if (info.linkUrl) {
                // href方式
                chrome.tabs.sendMessage(tab.id, {
                  action: 'UPLOAD_FILE',
                  tabId: tab.id,
                  dir: dir === '根目录' ? '' : dir,
                  srcUrl: info.linkUrl,
                }, {
                  frameId: 0,
                });
              }
            }, () => {
              chrome.tabs.sendMessage(tab.id, {
                action: 'SHOW_MSG',
                tabId: tab.id,
                msg: '未设置七牛相关设置，请点击七牛在线存图ICON前往设置',
              }, {
                frameId: 0,
              });
            });
          },
        });
      }
    }
  });
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // new install do nothing
    initContextMenus();
  } else {
    // 如果是update, 则需要读一下有没有QINIU这个存的值，如果有的话需要对其更新加QINIU_EXTEND
    qiniuModel.dataTransfer()
      .then(() => initContextMenus());
  }
});

chrome.runtime.onMessage.addListener((d, messageSender, response) => {
  const data = d;
  // 将此值上传到七牛bucket当中
  // 通过BASE64方式传递
  const tab = messageSender.tab || {};
  if (data) {
    qiniuController.getDefaultSetting().then((QINIU) => {
      // 如果没有填,则给默认的
      if (typeof data.dir === 'undefined') {
        data.dir = QINIU.defaultDir;
      }
      if (data.action === 'UPLOAD_BY_BASE64') {
        const REGEXP_EXT = /^data:image\/([^;]*)/;
        const matched = data.base64.match(REGEXP_EXT);
        let ext = '';

        if (matched && matched.length > 1) {
          ext = matched[1];
          const tmpDir = data.dir ? `${data.dir}/` : '';
          const tmpFilename = data.filename ? data.filename : `${CryptoJS.MD5(data.srcUrl)}`;
          data.filename = `${tmpDir}${tmpFilename}.${ext}`;
        }

        qiniuController.uploadByBase64(data)
          .then(() => {
            response({
              action: 'OPEN_PAGE',
              tabId: tab.id,
              pageUrl: `${QINIU.domain}/${data.filename}`,
            });
          }, () => console.log('failed'));
        return true;
      } else if (data.action === 'UPLOAD_BY_URL') {
        try {
          let ext = '';
          // 从url当中获取ext
          const REGEXP_EXT = /\.(jpeg|jpg|png|bmp|gif)/i;
          const matched = data.srcUrl.match(REGEXP_EXT);
          if (matched && matched.length > 1) {
            ext = matched[1];
          } else {
            ext = 'jpeg';
          }
          const tmpDir = data.dir ? `${data.dir}/` : '';
          const tmpFilename = data.filename ? data.filename : `${CryptoJS.MD5(data.srcUrl)}`;
          data.filename = `${tmpDir}${tmpFilename}.${ext}`;
        } catch (e) {
          console.error(e);
        }

        // 通过URL方式传递
        qiniuController.uploadByUrl(data)
          .then(() => {
            response({
              action: 'OPEN_PAGE',
              tabId: tab.id,
              pageUrl: `${QINIU.domain}/${data.filename}`,
            });
          }, () => {
            console.error('upload error');
          });
        return true;
      } else if (data.action === 'CONSOLE') {
        // console.log('get msg from ' + tab.id);
      } else if (data.action === 'REFRESH_CONTEXT_MENUS') {
        initContextMenus();
      }
      return true;
    });
    return true;
  }
  return true;
});

// 绑定browserAction的点击事件
chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.extension.getURL('options.html'),
  });
});

// after install, we open the options page
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({
    url: chrome.extension.getURL('options.html'),
  });
});
