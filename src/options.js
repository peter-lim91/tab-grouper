import html from "./options.html";
import css from "./styles.css";

const debug = false;

function addEventListeners() {
  addButtonEventListener();
  if (debug) {
    addSetIgnoreEventListener();
    addStorageEventListener();
  }
}

function addButtonEventListener() {
  const button = document.getElementById("reset");
  button.addEventListener("click", resetStorage);
}

function addStorageEventListener() {
  const storage = document.getElementById("storage");
  storage.addEventListener("click", async () => {
    const storageItems = await chrome.storage.local.get(
      "domainGroupIdList",
      (items) => {
        console.log(items);
      }
    );
  });
}

function addSetIgnoreEventListener() {
  const setIgnore = document.getElementById("set-ignore");
  setIgnore.addEventListener("click", setIgnoreList);
}

function resetStorage() {
  chrome.storage.local.set({ domainGroupIdList: [] }, () => {});
}

async function displayIgnoreList() {
  const ignoreListElement = document.getElementById("ignore-list");
  const ignoreList = await getIgnoreList();
  ignoreListElement.innerText = ignoreList || test;
}

function setIgnoreList(e) {
  console.log("settingignore", e.target.innerText);
}

async function getIgnoreList() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("ignoreList", (ignoreList) => {
      console.log(ignoreList);
      resolve(ignoreList);
    });
  });
}

addEventListeners();
// displayIgnoreList();
