// NFC Reader Extension for Win32 (c) 2015 by Yosuke Torii. All rights reserved.

var getID   = document.getElementById('getID');
var getNDEF = document.getElementById('getNDEF');
var cardID  = document.getElementById('cardId');

// When the 'getID' is clicked, extension starts polling.
getID.addEventListener('click', function(){

  // Get current TabId to tranfer card id to the web page.
  chrome.tabs.query({ active: true,  currentWindow:true }, function(tabs){

    chrome.runtime.sendMessage({"method": "getId", "targetTabId":tabs[0].id}, function(response) {}); 

  });


},false);

// When the 'getNDEF' is clicked, extension starts polling.
getNDEF.addEventListener('click', function(){

  // Get current TabId to tranfer card id to the web page.
  chrome.tabs.query({ active: true,  currentWindow:true }, function(tabs){

    chrome.runtime.sendMessage({"method": "getNDEF", "targetTabId":tabs[0].id}, function(response) {}); 

  });


},false);

// Insert card Id value to popup page when the cardId is sent from extension itself
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  if(request.id){

    cardID.value= request.id;

  }

});