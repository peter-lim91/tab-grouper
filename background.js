chrome.runtime.onStartup.addListener(() => {
  console.log("startup listener fired");
});

let domainGroupIdList;

if (domainGroupIdList === undefined) {
  chrome.storage.local.get("domainGroupIdList", (storage) => {
    domainGroupIdList = storage.domainGroupIdList || [];
  });
  console.log(domainGroupIdList);
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes?.domainGroupIdList) {
    domainGroupIdList = changes.domainGroupIdList.newValue;
  }
  console.log("changes", changes, "namespace", namespace);
});

//promisify chrome.tabs.query
function chromeQuery(queryInfo) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      resolve(tabs);
    });
  });
}

//promisify chrome.tabs.group
function chromeGroup(options) {
  return new Promise((resolve, reject) => {
    chrome.tabs.group(options, (groupId) => {
      resolve(groupId);
    });
  });
}

async function checkChromeGroupStillExists(groupId) {
  const allTabs = await chromeQuery({});

  const tabsInGroupId = allTabs.filter((tab) => {
    return tab.groupId === groupId;
  });
  return tabsInGroupId.length > 0;
}

function deleteGroupId(groupId) {
  const index = domainGroupIdList.findIndex((group) => group.id === groupId);
  domainGroupIdList.splice(index, 1);
}

chrome.action.onClicked.addListener(handleGrouping);

async function handleGrouping() {
  console.log(domainGroupIdList);
  const tabs = await chromeQuery({ currentWindow: true });
  console.log(tabs[0]);
  const ungroupedTabs = filterGroupedTabs(tabs);
  const groupedTabs = groupTabsByHostname(ungroupedTabs);
  groupedTabs.forEach(async (group) => {
    const hostname = group.hostname;
    const args = {};

    // check to see if group already exists both on extension side and chrome side.
    // if exists in both, use existing, if exists on extension side only, remove from extension and treat as new
    const groupId = getGroupIdByHostname(hostname); // extension side
    const stillExists = await checkChromeGroupStillExists(groupId); // chrome side
    if (groupId) {
      if (stillExists) {
        args.groupId = groupId;
      }
      if (!stillExists) {
        deleteGroupId(groupId);
      }
    }
    args.tabIds = group.tabs.map((tab) => tab.id);
    const newGroupId = await chromeGroup(args);
    if (!groupId || !stillExists) {
      domainGroupIdList.push({ hostname, groupId: newGroupId });
      chrome.tabGroups.update(newGroupId, { collapsed: true, title: hostname });
    }
  });
  await saveToStorage();
}

function saveToStorage() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ domainGroupIdList }, () => {
      resolve();
    });
  });
}

function getHostnameByGroupId(groupId) {
  return domainGroupIdList.find((group) => {
    return group.groupId === groupId;
  })?.hostname;
}

function getGroupIdByHostname(hostname) {
  return domainGroupIdList.find((group) => {
    return group.hostname === hostname;
  })?.groupId;
}

function groupTabsByHostname(tabs) {
  const groupedTabs = tabs.reduce((acc, tab) => {
    const hostname = new URL(tab.url).hostname;
    const hostnameGroup = acc.find((t) => t.hostname === hostname);
    if (hostnameGroup) {
      hostnameGroup.tabs.push(tab);
    } else {
      acc.push({
        hostname,
        tabs: [tab],
      });
    }
    return acc;
  }, []);
  return filterUniqueTabs(groupedTabs);
}

function filterUniqueTabs(groupedTabs) {
  const filteredGroup = groupedTabs.filter((group) => group.tabs.length > 1);
  return filteredGroup;
}

function filterGroupedTabs(tabs) {
  return tabs.filter((tab) => tab.groupId === -1);
}
