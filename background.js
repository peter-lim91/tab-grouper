chrome.runtime.onStartup.addListener(() => {
  console.log("startup listener fired");
});

let domainGroupIdList;

if (domainGroupIdList === undefined) {
  chrome.storage.local.get("domainGroupIdList", (storage) => {
    domainGroupIdList = storage.domainGroupIdList || [];
  });
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes?.domainGroupIdList) {
    domainGroupIdList = changes.domainGroupIdList.newValue;
  }
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
  const index = domainGroupIdList.findIndex(
    (group) => group.groupId === groupId
  );
  domainGroupIdList.splice(index, 1);
}

chrome.action.onClicked.addListener(handleGrouping);

async function handleGrouping() {
  const tabs = await chromeQuery({ currentWindow: true });
  // const ungroupedTabs = filterUngroupedTabs(tabs);
  let sortedTabs = sortTabsByHostname(tabs);
  sortedTabs = filterUniqueTabs(sortedTabs);
  sortedTabs.forEach(async (hostnameGroup) => {
    const hostname = hostnameGroup.hostname;
    const args = {};

    // check to see if group already exists both on extension side and chrome side.
    // if exists in both, use existing, if exists on extension side only, remove from extension and treat as new
    const groupId = getGroupIdByHostname(hostname); // extension side
    const groupStillExists = await checkChromeGroupStillExists(groupId); // chrome side

    if (groupId) {
      if (groupStillExists) {
        args.groupId = groupId;
      }
      if (!groupStillExists) {
        deleteGroupId(groupId);
      }
    }
    args.tabIds = hostnameGroup.tabs.map((tab) => tab.id);
    const newGroupId = await chromeGroup(args);

    //if it's an entirely new tab grouping
    if (!groupId || !groupStillExists) {
      //add to extension records
      domainGroupIdList.push({ hostname, groupId: newGroupId });
      // collapse the group and give it a title
      chrome.tabGroups.update(newGroupId, { collapsed: true, title: hostname });
    }
  });
  await saveToStorage(domainGroupIdList);
}

function saveToStorage(domainGroupIdList) {
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

function sortTabsByHostname(tabs) {
  const sortedTabs = tabs.reduce((acc, tab) => {
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
  return sortedTabs;
}

function filterUniqueTabs(sortedTabs) {
  const filteredGroup = sortedTabs.filter((group) => group.tabs.length > 1);
  return filteredGroup;
}

function filterUngroupedTabs(tabs) {
  return tabs.filter((tab) => tab.groupId === -1);
}
