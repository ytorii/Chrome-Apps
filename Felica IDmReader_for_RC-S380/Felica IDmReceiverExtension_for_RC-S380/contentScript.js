// Felica IDm Reciever for RC-S380 (c) 2015 by Yosuke Torii. All rights reserved.

var felicaIDm  = document.getElementById('felicaIDm');

var startPolling = document.getElementById('startPolling');
var getCardId    = document.getElementById('getCardId');
var writeCardId  = document.getElementById('writeCardId');
var authCard     = document.getElementById('authCard');

var felicaUserId    = document.getElementById('felicaUserId');
var felicaMasterKey = document.getElementById('felicaMasterKey');
var felicaCKVInput  = document.getElementById('felicaCKVInput');

var felicaCKV       = document.getElementById('felicaCKV');
var felicaRandomNum = document.getElementById('felicaRandomNum');
var felicaRandomRes = document.getElementById('felicaRandomRes');

var log = document.getElementById('felicaLog');

var appendLog = function(message) { if(log){log.innerText += message; log.innerHTML += "<br/>";} }

// When the 'startPolling' element is clicked, send request to extension.
if(startPolling){

  startPolling.addEventListener('click', function(){

    var request =  {"startPolling" : "true"}; 

    appendLog("start getting IDm...");

    chrome.runtime.sendMessage(request, function(response) {}); 

  },false);

}

// When the 'writeCardId' element is clicked, send request to extension.
if(getCardId){

  getCardId.addEventListener('click', function(){

    var request =  {"getCardId" : "true" };

    appendLog("starting get card Id ...");

    chrome.runtime.sendMessage(request, function(response) {}); 

  },false);

}

// When the 'writeCardId' element is clicked, send request to extension.
if(writeCardId){

  writeCardId.addEventListener('click', function(){

    var request =  {"writeCardId" : "true", "cardId" : felicaUserId.value, "masterKey" : felicaMasterKey.value, "cardKeyVersion" : felicaCKVInput.value };

    appendLog("starting writing card Id and key...");

    chrome.runtime.sendMessage(request, function(response) {}); 

  },false);

}

// When the 'authCard' element is clicked, send request to extension.
if(authCard){

  authCard.addEventListener('click', function(){

    var request =  {"authCard" : "true", "masterKey" : felicaMasterKey.value};

    appendLog("starting authentication...");

    chrome.runtime.sendMessage(request, function(response) {}); 

  },false);

}

// As content scripts can't fire events such as 'click', 'changes', 
// so custom event is needed to fire event in web pages.
var getIdEvent = new CustomEvent('getId');
var getRcEvent = new CustomEvent('getRc');

// When recieved the data from extension, insert the data to 'felicaIDm' element in web pages.
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
  
  if(felicaRandomNum && felicaRandomRes){

     // insert the value to 'cardId' element in web pages
     felicaCKV.value        = request.felicaCKV;
     felicaRandomNum.value  = request.felicaRandomNum;
     felicaRandomRes.value  = request.felicaRandomRes;

  }

  if(felicaIDm){

     // insert the value to 'cardId' element in web pages
     felicaIDm.value = request.felicaIDm.toUpperCase();

     // fire the cutstom event('getId') at 'cardId' element
     felicaIDm.dispatchEvent(getIdEvent);

     sendResponse({"getIDmComplete": "true"});

     appendLog("completed.");

  }


});