// MIFARE UL UID Reciever Extension for RC-S380 (c) 2015 by Yosuke Torii. All rights reserved.

// ローカルストレージに登録済みのAppのIDを取得する
var appId = getAppId();

console.log(appId);

var currentTabId;

var isPolling = 0;

chrome.runtime.onMessageExternal.addListener(

  function(request, sender, sendResponse) {

    if (sender.id == appId){

      if(request.MifareulUID){

        sendResponse({"success":"true"});

        var se = document.createElement("audio");

        se.src = "/assets/ding.wav";

        se.play();

        var recieve_message= {recieve_message : request.MifareulUID};
 
	isPolling = 0;

        chrome.tabs.query(

          { active: true,  currentWindow:true }, function(tabs){

            chrome.tabs.sendMessage(tabs[0].id, recieve_message, function(response){


	    });

          }

        );

      } else if(request.pollingStart){

        chrome.tabs.query(

          { active: true,  currentWindow:true }, function(tabs){

	     currentTabId = tabs[0].id;

             isPolling = 1;

          }

        );

 	console.log("target TabId : " + currentTabId);

        sendResponse({"result":"Ok, got your message"});

      }

   }

});

chrome.runtime.onMessage.addListener(

  function(request, sender, sendResponse) {

    if (request.method == "getAppId"){

      sendResponse({"appId": appId});

    } else {

      sendResponse({}); 

    }

});

chrome.tabs.onRemoved.addListener(

    function(tabId){

	console.log("removed TabId : " + tabId);
	console.log("target TabId : " + currentTabId);

	if((tabId == currentTabId) && isPolling){

	  chrome.runtime.sendMessage( appId, {pageChange: "true"}, function(response) {});

	  isPolling = 0;

	}

    }

);

chrome.tabs.onUpdated.addListener(

    function(tabId){

	 console.log("updated TabId : " + tabId);
	 console.log("target TabId : " + currentTabId);

         if((tabId == currentTabId) && isPolling){

            chrome.runtime.sendMessage( appId, {pageChange: "true"}, function(response) {});

            isPolling = 0;

         }

    }

);

function getAppId(){

    var appId;

    var appIdObj = localStorage.getItem("uidReaderApp");

    if(appIdObj == null){

	appId = "lcmhhnojekallednfohmalghkemkabeo";

    } else {

	appId = JSON.parse(appIdObj)["uidReaderApp"];

    }

    return appId;

}