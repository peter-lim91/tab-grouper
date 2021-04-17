//promisify chrome.tabs.query
export function chromeQuery(queryInfo) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      resolve(tabs);
    });
  });
}

//promisify chrome.tabs.group
export function chromeGroup(options) {
  return new Promise((resolve, reject) => {
    chrome.tabs.group(options, (groupId) => {
      resolve(groupId);
    });
  });
}
