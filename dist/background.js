(()=>{"use strict";let t;function e(t){return new Promise(((e,o)=>{chrome.tabs.query(t,(t=>{e(t)}))}))}chrome.runtime.onStartup.addListener((()=>{console.log("startup listener fired")})),void 0===t&&chrome.storage.local.get("domainGroupIdList",(e=>{t=e.domainGroupIdList||[]})),chrome.storage.onChanged.addListener(((e,o)=>{e?.domainGroupIdList&&(t=e.domainGroupIdList.newValue)})),chrome.action.onClicked.addListener((async function(){console.log("test");let o=(await e({currentWindow:!0})).reduce(((t,e)=>{const o=new URL(e.url).hostname,n=t.find((t=>t.hostname===o));return n?n.tabs.push(e):t.push({hostname:o,tabs:[e]}),t}),[]);o=function(t){return t.filter((t=>t.tabs.length>1))}(o),o.forEach((async o=>{const n=o.hostname,r={},a=function(e){return t.find((t=>t.hostname===e))?.groupId}(n),s=await async function(t){return(await e({})).filter((e=>e.groupId===t)).length>0}(a);a&&(s&&(r.groupId=a),s||function(e){const o=t.findIndex((t=>t.groupId===e));t.splice(o,1)}(a)),r.tabIds=o.tabs.map((t=>t.id));const i=await(u=r,new Promise(((t,e)=>{chrome.tabs.group(u,(e=>{t(e)}))})));var u;a&&s||(t.push({hostname:n,groupId:i}),chrome.tabGroups.update(i,{collapsed:!0,title:n}))})),await function(t){return new Promise(((e,o)=>{chrome.storage.local.set({domainGroupIdList:t},(()=>{e()}))}))}(t)}))})();