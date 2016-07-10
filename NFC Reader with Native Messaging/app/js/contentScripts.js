// NFC Reader Extension for Win32 (c) 2015 by Yosuke Torii. All rights reserved.

var startPolling = document.getElementById('startPolling');

// When the 'startPolling' element is clicked, send message to the host application through extension.
if(startPolling){

  startPolling.addEventListener('click', function(){ 

    chrome.runtime.sendMessage({"method": "getId"}, function(response) {}); 

  },false);

}

var cardId = document.getElementById('cardId');

// As content scripts can't fire events such as 'click', 'changes', 
// so custom event is needed to fire event in web pages.
var getIdEvent = new CustomEvent('getId');

// When recieved the data from extension, insert the data to 'cardId' element in web pages.
if(cardId){
  
  chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
  
    // result 0 means the host application got th card infomation
    if(request.result == "0"){

       // insert the value to 'cardId' element in web pages
       cardId.value = request.id.toUpperCase();

       // fire the cutstom event('getId') at 'cardId' element
       cardId.dispatchEvent(getIdEvent);

    }

  });

}