function addEventListeners() {
  const button = document.getElementById("clear");
  button.addEventListener("click", clearStorage);

  const storage = document.getElementById("storage");
  storage.addEventListener("click", async () => {
    const storageItems = await chrome.storage.local.get(
      "domainGroupIdList",
      (items) => {
        console.log(items);
      }
    );
  });

  console.log("event listener added");
}

function clearStorage() {
  // chrome.storage.local.clear();
  chrome.storage.local.set({ domainGroupIdList: [] }, () => {
    console.log("storageareacleared");
  });
}

addEventListeners();
