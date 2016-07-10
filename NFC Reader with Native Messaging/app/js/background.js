// NFC Reader Extension for Win32 (c) 2015 by Yosuke Torii. All rights reserved.

//host application name
var hostName = "chrome.nfcbridge.win32";

//the browser Tab Id that requests reading cards
var targetTabId = null;

//the connection with the host application
var port = null;

//polling timer object
var timer = 0;

//polling interval in milli seconds
var pollingInterval = 200;

//event listener for reading cards request from web pages
chrome.runtime.onMessage.addListener(

  function(request, sender, sendResponse) {

    //If timer exists, reader device is already used.
    if (!timer){

      //Get sender's tab id to return the card information.
      //If this request from popup page, sender's tab id
      if(!sender.tab){

        targetTabId =  request.targetTabId;

      } else {

        targetTabId = sender.tab.id;  

      }

      //These are dubugging messages.
      console.log("target TabId : " + targetTabId);
      console.log("start polling");

      //Resposing to web pages that the polling is started. 
      sendResponse({"state": "1"});

      //connect to the host application to read card infomation.
      // connect to the host application
      port = chrome.runtime.connectNative(hostName);

      // event listener for reciving message from the host application
      // and when the host application exits
      port.onMessage.addListener(onNativeMessage);
      port.onDisconnect.addListener(onDisconnected);

      // send message to the host application to read the card
      port.postMessage({"text":request.method});

     //Set the timer send message to the host application to read card infomation.
      timer = setInterval(function(){if(timer){port.postMessage({"text":request.method});}}, pollingInterval);

    } else {

      //Resposing to web pages that the polling is NOT started. 
      sendResponse({"state": "0"}); 

    }

});


//When the target tab is closed, clear the timer and exit the host application.
chrome.tabs.onRemoved.addListener(

  function(tabId){

    if(tabId == targetTabId){

      console.log("The target tab removed, stop polling.");

      // initialize the timer and the target tab
      clearInterval(timer);
      timer = 0;
      targetTabId = null;

       // If port is not null, there's a connection with the host application to br closed
      if(port){

         // send message to the host application to exit
        port.postMessage({"text":"close"});
      
      }
 

    }

  }

);

//When the target tab is updated, clear the timer and exit the host application.
chrome.tabs.onUpdated.addListener(

  function(tabId){

   if(tabId == targetTabId){

      console.log("The target tab updated, stop polling.");

      // initialize the timer and the target tab
      clearInterval(timer);
      timer = 0;
      targetTabId = null;

      // If port is not null, there's a connection with the host application to br closed
      if(port){

         // send message to the host application to exit
         port.postMessage({"text":"close"});
      
      }

    }

  }

);

// initialize connection when the host application exits.
function onDisconnected() {

  port = null;

}

// check the message from the host application
function onNativeMessage(message) {

  // result 0 means the host application got card infomation
  if(message.result == "0"){

    console.log("detected the IC card.");

    // Send card infomation to the web pages.
    // Sending the card ID.
    if(message.id && targetTabId){

       chrome.runtime.sendMessage({"result":message.result, "id" : message.id.toUpperCase()}, function(response) {});
       chrome.tabs.sendMessage(targetTabId, {"result":message.result, "id" : message.id.toUpperCase()}, function(response){});

    // Sending the NDEF messages.
    } else if(message.NDEFMsg){

       // Parse raw byte array to NdefLibrary format.
       var ndefMsgArray = NdefLibrary.NdefMessage.fromByteArray(setArray(message.NDEFMsg)).getRecords();

       for(i = 0; i < ndefMsgArray.length; i++){

         if(checkNdefType(ndefMsgArray[i]._type) == 0){

           parseSpString(ndefMsgArray[i]._payload);

         } else if(checkNdefType(ndefMsgArray[i]._type) == 1){

           console.log("detected Text record");

           alert(parseTextString(ndefMsgArray[i]._payload));

         } else if(checkNdefType(ndefMsgArray[i]._type) == 2){

           console.log("detected URI record");
  
           window.open(parseUriString(ndefMsgArray[i]._payload));

         }

       }

    }

    // clear and initialize timer
    clearInterval(timer);
    timer = 0;

    // initialize the target tab
    targetTabId = null;

  // result 1 means there are no cards
  } else if(message.result == "1"){

    // Send result code to the web pages.(Stopping now because it causes errors in moving page)
    //chrome.tabs.sendMessage(targetTabId, {"result":message.result}, function(response){});


  // other(result code 2) means error occured in reading cards
  } else {

    console.log("Error occured.");

    // Send result code to the web pages.
    chrome.tabs.sendMessage(targetTabId, {"result":message.result}, function(response){});

    // clear and initialize timer
    clearInterval(timer);
    timer = 0;

    // initialize the target tab
    targetTabId = null;

  }

}


// Check the type of NDEF message.
// return 0 : Smart Poster
// return 1 : Text
// return 2 : URI
function checkNdefType(inputTypeArray){

  if(inputTypeArray[0] == 0x53 && inputTypeArray[1] == 0x70){

    return 0;

  } else if(inputTypeArray[0] == 0x54){

    return 1;

  } else if(inputTypeArray[0] == 0x55){

    return 2;
  
  }

}

// parse the input byte array to Smart Poster Record.
// the input array must be consisted of a byte hex numbers.
function parseSpString(inputRawSpPayload){

  var textString;
  var uriString;
  var actionString;

  console.log("detected Smart Poster card");  
  var spMsgArray =  NdefLibrary.NdefMessage.fromByteArray(inputRawSpPayload).getRecords();

  for(j = 0; j < spMsgArray.length; j++){

    if(checkNdefType(spMsgArray[j]._type) == 1){

       textString = parseTextString(spMsgArray[j]._payload);

       console.log("Title : " + textString);

     } else if(checkNdefType(spMsgArray[j]._type) == 2){
   
      uriString = parseUriString(spMsgArray[j]._payload);

      console.log("URI : " + uriString);

 
    }

  }

  window.open(uriString);

}

// parse the input byte array to Text.
// the input array must be consisted of a byte hex numbers.
function parseTextString(inputRawTextPayload){
 
  // NdefUriRecord object for UTF-8 encoding raw bytes to URI string.
  var textRecord = new NdefLibrary.NdefTextRecord();
  
  // set following bytes as uri payload
  textRecord.setPayload(inputRawTextPayload);

  return (textRecord.getText());

}

// parse the input byte array to URI.
// the input string must be consisted of hex numbers.
function parseUriString(inputRawUriPayload){

  // NdefUriRecord object for UTF-8 encoding raw bytes to URI string.
  var uriRecord = new NdefLibrary.NdefUriRecord();
  
  // The first byte of NdefUriRecord indicates URI header(http:// etc.)
  var uriHeader = NdefLibrary.NdefUriRecord.Abbreviations[inputRawUriPayload.shift()] 

  // set following bytes as uri payload
  uriRecord.setRawUri(inputRawUriPayload);

  // return header and UTF-8 encoded uri string
  return (uriHeader + uriRecord.getUri());

}

// parse the input string to hex byte array.
// the input string must be consisted of hex numbers.
function setArray(inputString){

  var tempArray = [parseInt("0x" + inputString.substr(0 , 2))];

  for(var i = 2; i < inputString.length; i = i + 2){

    tempArray = tempArray.concat([parseInt("0x" + inputString.substr(i , 2))]);
	
  }

  return tempArray;

}