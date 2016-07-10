// Felica IDm Reciever for RC-S380 (c) 2015 by Yosuke Torii. All rights reserved.

// ローカルストレージに登録済みのAppのIDを取得する
var appId = getAppId();

var targetTabId;

var isPolling = 0;

var randomNum;
var masterKey;

//event listener for reading cards request from web pages
chrome.runtime.onMessage.addListener(

  function(request, sender, sendResponse) {

    //If timer exists, reader device is already used.
    if (!isPolling){

      //Get sender's tab id to return the card information.
      //If this request from popup page, set current page's tabId.
      if(!sender.tab){

        targetTabId =  request.targetTabId;

      } else {

        targetTabId = sender.tab.id;  

      }

      //These are dubugging messages.
      console.log("target TabId : " + targetTabId);

      if(!request.authCard && !request.verifyRc){

        chrome.runtime.sendMessage( appId, request, function(response) {

          if(response.pollingStart){

            isPolling = 1;

          }
     
        });

        console.log("send request to app");

      } else if(request.verifyRc){

        masterKey = request.verifyKey;
       
        // IDと個別化マスター鍵から個別化カード鍵を作成する(IVは0とする)
        var uniqueCardKey = uniqueCardKey_generator(request.verifyId, request.verifyKey, 0);

        // MAC生成時の平文を作成する(内部認証では固定値)
        var ptMAC_A = "820086009100ffff";

        var verifyData = request.verifyId + request.verifyCKV;

        // 算出したMAC値とカードから送られたMAC値が一致するかを判定する
        // MAC値の算出
        var verifyMAC = calcAuthMAC_A(ptMAC_A, uniqueCardKey, request.verifyRandomNum, verifyData);

        //Resposing to web pages that the polling is started. 
        sendResponse({"verifyMAC": verifyMAC});

      } else if(request.authCard){

        randomNum = CryptoJS.lib.WordArray.random(16).toString();
        masterKey = request.masterKey;

        var authRequest = {"authCard":"true", "randomNum":randomNum}

        chrome.runtime.sendMessage( appId, authRequest, function(response) {

          isPolling = 1;
     
        });

        console.log("send request to app");

      }

    } else {

      console.log("the device is already used.");

      //Resposing to web pages that the polling is NOT started. 
      sendResponse({"log": "the device is already used."}); 

    }

});

chrome.runtime.onMessageExternal.addListener(

  function(request, sender, sendResponse) {

    if (sender.id == appId){

      sendResponse({"success":"true"});

      if(request.rcResponse){

        var rcResponse = request.rcResponse;

        var cardId = rcResponse.substr(0,32);

        var message = {"felicaIDm" : cardId, "felicaCKV" : rcResponse.substr(32,32), "felicaRandomNum" : randomNum, "felicaRandomRes" : rcResponse.substr(64,16) };

        chrome.tabs.sendMessage(targetTabId, message, function(response){});

     } else if(request.felicaIDm){

        var message= {"felicaIDm" : request.felicaIDm};
 
        chrome.tabs.sendMessage(targetTabId, message, function(response){});

      }

 	isPolling = 0;


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

    if((tabId == targetTabId) && isPolling){

      chrome.runtime.sendMessage( appId, {pageChange: "true"}, function(response) {});

      isPolling = 0;

    }

  }

);

chrome.tabs.onUpdated.addListener(

  function(tabId){

    if((tabId == targetTabId) && isPolling){

      chrome.runtime.sendMessage( appId, {pageChange: "true"}, function(response) {});

      isPolling = 0;

     }

  }

);

function getAppId(){

    var appId;

    var appIdObj = localStorage.getItem("idmReaderApp");

    if(appIdObj == null){

	appId = "oocaofoepnenfidojplahcdelmemhklc";

    } else {

	appId = JSON.parse(appIdObj)["idmReaderApp"];

    }

    return appId;

}