// Felica IDm Reader for RC-S380 (c) 2015 by Yosuke Torii. All rights reserved.

var sendId = 0; 
// 8bytes user original ID  after the IDm
var uniqueId;
// The master key of the each card's unique key
var masterKey;
// 2bytes unique card key version
var cardKeyVersion;
// The random number for challenge response
var randomNum;

// an object of connection to the device
var connectionHandle = 0; 
// the timer of polling to cards
var timer = 0; 

// following scripts run when the app is ready to be launched
$(function(){
 
  // The event listener for recieving requests from other apps.
  chrome.runtime.onMessageExternal.addListener(

    function(request, sender, sendResponse) {

      // if isOpen is false, the device is not used.
      if (isOpen == 0) {

        // getting sender's app id.  
        sendId = sender.id;

        // Trying to open the connection to the device
        openConnection().then(function(handle){
                     
          // Set the handle object to 'connectionHandle', and set 'isOpen' to true.
          connectionHandle = handle;
          isOpen = 1;

          // 'startPolling' means request for getting IDm.
          if (request.startPolling) {

            appendLog('getting Idm request from : ' +  sender.id);

            // set the timer to execute getting IDm function.
            timer = setInterval(function(){get_IDm_RCS380(connectionHandle, pollingWildcardBuffer, timer)}, pollingInterval);
    
            // As the timer executes function after the interval time, execute the function now.
            get_IDm_RCS380(connectionHandle, pollingWildcardBuffer, timer);

          // 'getCardId' means request for getting user ID.
          } else if(request.getCardId) {

            appendLog('getCardId request from : ' +  sender.id);

            // set the timer to execute getting user ID function.
            timer = setInterval(function(){get_cardId_RCS380(connectionHandle, pollingLiteSBuffer, timer)}, pollingInterval);
    
            get_cardId_RCS380(connectionHandle, pollingLiteSBuffer, timer);

          // 'writeCardId' means request for writing user ID and card key version and unique card key.
          } else if (request.writeCardId) {

            appendLog('writeCardId request from : ' +  sendId.id);

            // user ID and card key version are converted to integer.
            uniqueId = parseInt(request.cardId); 
            cardKeyVersion = parseInt(request.cardKeyVersion);
            masterKey = request.masterKey;

            // return error message and exit if the user ID is empty, not a number, larger than maximum number.
            if(!uniqueId || uniqueId > 281474976710655){
  
              appendLog('ERROR : The Unique Id must be less than 6bytes hex numbers.');

              // Send the error message to the extension.
              sendResponse({"result":"ERROR : The Unique Id must be less than 6bytes hex numbers."});

              // Close connection to the device.
              closeConnection(connectionHandle).done(function(){return;}); 
 
              return;

            // return error message and exit if the entered master key is not a number, or not 24 bytes hex numbers.
            } else if(masterKey && (!parseInt(masterKey) || masterKey.length != 48)){

              appendLog('ERROR : The Master Key must be 24bytes hex numbers.');

              // Send the error message to the extension.
              sendResponse({"result":"ERROR : The Master Key must be 24bytes hex numbers."});

              // Close connection to the device.
              closeConnection(handle).done(function(){return;}); 

              return;

            // return error message and exit if the enterd card key version is not a number, or larger than maximum number.
            } else if(cardKeyVersion && (!cardKeyVersion || cardKeyVersion > 65535 )){

              appendLog('ERROR : The Card Key Version must be less than 2bytes hex numbers.');

              // Send the error message to the extension.
              sendResponse({"result":"ERROR : The Card Key Version must be less than 2bytes hex numbers."});

              // Close connection to the device.
              closeConnection(handle).done(function(){return;}); 

              return;

            }

            // set the timer to execute writing user ID function.
            timer = setInterval(function(){write_cardId_RCS380(connectionHandle, pollingLiteSBuffer, timer, uniqueId, cardKeyVersion, masterKey)}, pollingInterval)

            write_cardId_RCS380(connectionHandle, pollingLiteSBuffer, timer, uniqueId, cardKeyVersion, masterKey);

          // 'authCard' means request for random challenge authentication.
          } else if(request.authCard) {

            appendLog('authCard request from : ' +  sendId);

            // get the random number for random challenge
            randomNum = request.randomNum;

            // return error message and exit if the randomNum is empty, not a 16bytes hex numbers string.
            if(randomNum.length != 32){

              appendLog('ERROR : The Random Number must be 16bytes hex numbers.');

              // Send the error message to the extension.
              sendResponse({"result":"ERROR : The Random Number must be 16bytes hex numbers."});

              // Close connection to the device.
              closeConnection(handle).done(function(){return;}); 

              return;

            }

            // set the timer to execute random challenge function.
            timer = setInterval(function(){auth_cardKey_RCS380(connectionHandle, pollingLiteSBuffer, timer, randomNum)}, pollingInterval)

            auth_cardKey_RCS380(connectionHandle, pollingLiteSBuffer, timer, randomNum);

          }

          // Send the message that the polling is started to the extension.
          sendResponse({"pollingStart": "true"});

        // When failed to open connection, this app exits.
        }, function(){appendLog("Failed to connect RC-S380.");return;});


      // When the requesting web page is closed or moved to other page, this app exits.
      } else if(sender.id == sendId && request.pageChange){

        appendLog('page Changed');

        // stop and initialize the timer
        clearInterval(timer);
        timer = 0;

        // Set 'isOpen' to 0 and stop exchanging data with the device.
        isOpen = 0;

        appendLog('stopped Polling');

        closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});

      // this app exits when the device is already used or recieved unknown messages.
      } else { sendResponse({"failedConnection": "true"}); return; }

    }

  );

});

// The function for getting IDm from the card by polling command.
function get_IDm_RCS380(handle, data, timer){

  send_recieve_packet_RCS380(handle, data).then(function(recieveData){

    // recieved data as byte array format
    var dataArray = recieveData;
  
    // if the length of array is larger than 16, the device has detected the card and gotten IDm.
    if(dataArray.length > 16){

      appendLog('detected Felica Card');

      // stop and initialize the timer
      clearInterval(timer);
      timer = 0;

      // Set 'isOpen' to 0 and stop exchanging data with the device any more.
      isOpen = 0;

      // The value of IDm is placed in from 18th to 25th of recieved data array. 
      var dataIndex = 17;

      // Parse IDm value as hex numbers strings from hex byte array.
      // Zero padding is needed to keep the length of IDm.
      var IDmHexString  = ("0" + dataArray[dataIndex].toString(16)).slice(-2);

      for(dataIndex = dataIndex + 1; dataIndex < 25; dataIndex++){

        IDmHexString = IDmHexString + ("0" + dataArray[dataIndex].toString(16)).slice(-2);

      }

console.log(IDmHexString);
console.log(setHexString(dataArray.subarray(17, 25)));



      appendLog("sending FelicaIDm to " + sendId);

      // Send IDm string to extension.
      chrome.runtime.sendMessage(sendId, {felicaIDm: IDmHexString}, function(response){

        // if there is a 'success' response from extension
        if(response.success){ appendLog("successed sending FelicaIDm"); }

      });

      closeConnection(handle).done(function(){return;});

    // There are cases that the order of recieving packet incorrectly 'shifted' for some reasons.
    // So, if the length of recieved data is 6, this is ack packet and one more recieve packet process is needed to fix order.
    } else if(dataArray.length == 6){recieve_packet_RCS380(handle).done(function(){ appendLog('ack packet recieved');}); }

  // This app exits when the command to the device fails.
  }, function(){closeConnection(handle).done(function(){return;});});

}

// The function of getting IDm and user ID from the card.
function get_cardId_RCS380(handle, data, timer){

  send_recieve_packet_RCS380(handle, data).then(function(recieveData){

    var dataArray = recieveData;

    if(dataArray.length > 16){

      appendLog('detected Felica Lite-S Card');

      clearInterval(timer);
      timer = 0;

      var dataIndex = 17;

      var IDmArray = [dataArray[dataIndex]];

      for(dataIndex = dataIndex + 1; dataIndex < 25; dataIndex++){

        IDmArray = IDmArray.concat([dataArray[dataIndex]]);

      }

console.log(IDmArray);
console.log(dataArray.subarray(17, 25));

        
      // Read card 
      read_wo_encryption_RCS380(handle, IDmArray, [0x01], [0x82]).then(function(recieveData){

        appendLog("successed reading UniqueCardId from the Felica Lite-S card.");

        // dataHexStringに格納したIDmをextensionに送信する
        chrome.runtime.sendMessage(sendId, {felicaIDm: setHexString(recieveData.subarray(28,44))}, function(response){
 
          // extensionからのIDm受信成功メッセージを受信した場合
          if(response.success){

            // connectionHandleを初期化(これをやらないと他のイベントリスナーと競合が発生する)
            connectionHandle = 0;

            // RC-S380との接続を切断する
            closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});

          }

        });

      // 命令パケット送信処理の失敗時はその時点で処理を終了
      }, function(){closeConnection(handle).done(function(){return;});});

    // データパケットの長さが6であればackパケットを受信したと判断する
    // (この判定を行わないと、RC-S380からの受信パケットがずれた場合に正常パターンに戻れない)
    } else if(dataArray.length == 6){ recieve_packet_RCS380(handle).done(function(){ appendLog('ack packet recieved'); });}

  // 命令パケット送信処理の失敗時はその時点で処理を終了
  }, function(){closeConnection(handle).done(function(){return;});});

}

// カードからの応答を検出し、捕捉したカードにカードIDと個別化カード鍵を書き込む関数
// jQueryのDeferredオブジェクトを利用してRC-S380との非同期通信を制御する
function write_cardId_RCS380(handle, data, timer, uniqueId, cardKeyVersion, masterKey){

  send_recieve_packet_RCS380(handle, data).then(function(recieveData){

    // データパケットを配列dataArrayに格納する
    var dataArray = recieveData;

    // データパケットの長さが16以上であればFelicaカードのIDmを取得したと判断する
    if(dataArray.length > 16){

      appendLog('detected Felica Lite-S Card');

      // pollingを実行するタイマーを解除
      clearInterval(timer);
      timer = 0;

      // データ配列内のIDmの先頭の配列位置を指定
      var dataIndex = 17;

      // 配列でIDmの値を格納する変数(初期化を兼ねて先頭の配列を取得)
      var IDmArray = [dataArray[dataIndex]];

      // extensionへの連携用にデータを16進数の表記に直し、ゼロパディングしてIDmHexStringに格納する
      var IDmHexString  = ("0" + dataArray[dataIndex].toString(16)).slice(-2);

      // 配列からIDmが格納されている18番目から25番目の配列のデータを抜き出す
      for(dataIndex = dataIndex + 1; dataIndex < 25; dataIndex++){

        // 配列にデータを順番に格納していく
        IDmArray = IDmArray.concat([dataArray[dataIndex]]);

        // IDmの最後尾まで順番にゼロパディングしながらIDmHexStringに格納する
        IDmHexString = IDmHexString + ("0" + dataArray[dataIndex].toString(16)).slice(-2);

      }

      // IDmと8バイト分ゼロパディングした独自IDからIDの16進表記の文字列を作成する
      // 独自IDの先頭2バイトはDFCコードだが利用しないので必ず00になる
      var uniqueIdString = IDmHexString + ("0000000000000000" + uniqueId.toString(16)).slice(-16);

      // 取得したIDmとextensionから受信したIDからカードへ書きこむIDの配列を作成
      var uniqueIdArray = setArray(uniqueIdString);

      // カードにIDを書き込む
      write_wo_encryption_RCS380(handle, IDmArray, [0x01], [0x82], uniqueIdArray).then(function(){
        
        // 書き込み内容の確認のため、カードからIDを読み出す
        read_wo_encryption_RCS380(handle, IDmArray, [0x01], [0x82]).then(function(recieveData){

          // 作成した書き込みデータとカードから読み出したデータが一致していれば成功と判定する
          // (読み出したデータからIDが格納されている箇所を切り出す)
          if(isSameArray(recieveData.subarray(28,44), uniqueIdArray)){

           appendLog("successed writing uniqueID to the Felica Lite-S card.");

           // 個別化マスター鍵とカード鍵バージョンが入力されている場合は個別化カード鍵を作成して書き込む
           if(masterKey && cardKeyVersion){

             // 書き込んだIDと個別化マスター鍵から個別化カード鍵を作成する(IVは0とする)
             var uniqueCardKeyArray = setArray(uniqueCardKey_generator(uniqueIdString, masterKey, 0));

             // カード鍵バージョンの書き込み配列を作成する
             var cardKeyVersionArray = setArray(("0000" + cardKeyVersion.toString(16)).slice(-4) + "0000000000000000000000000000");          

             // カードに個別化カード鍵を書き込む
             write_wo_encryption_RCS380(handle, IDmArray, [0x01], [0x87], uniqueCardKeyArray).then(function(){

               // カードに個別化カード鍵のバージョンを書き込む
               write_wo_encryption_RCS380(handle, IDmArray, [0x01], [0x86], cardKeyVersionArray).then(function(){

                 appendLog("successed writing UniqueCardKey to the Felica Lite-S card.");

                 // dataHexStringに格納したIDmをextensionに送信する
                 chrome.runtime.sendMessage(sendId, {felicaIDm: uniqueIdString}, function(response){
   
                   // extensionからのIDm受信成功メッセージを受信した場合
                   if(response.success){ closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;}); }

                 });

               // 命令パケット送信処理の失敗時はその時点で処理を終了
               }, function(){closeConnection(handle).done(function(){return;});});

             // 命令パケット送信処理の失敗時はその時点で処理を終了
             }, function(){closeConnection(handle).done(function(){return;});});

           // カードIDの書き込みのみならIDを拡張機能へ送信して終了する
           } else {

             // dataHexStringに格納したIDmをextensionに送信する
             chrome.runtime.sendMessage(sendId, {felicaIDm: uniqueIdString}, function(response){
    
               // extensionからのIDm受信成功メッセージを受信した場合
               if(response.success){ closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;}); }

             });

           }

         // 書き込み内容と読み出し結果が一致しない場合は処理失敗と判定
         } else {

           appendLog('error detected in written UniqueID in the card.');

           deferred_register_cardKey.reject();

           // RC-S380との接続を切断する
           closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});

         }

       // 命令パケット送信処理の失敗時はその時点で処理を終了
       }, function(){closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});});

     // 命令パケット送信処理の失敗時はその時点で処理を終了
     }, function(){closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});});


   // データパケットの長さが6であればackパケットを受信したと判断する
   // (この判定を行わないと、RC-S380からの受信パケットがずれた場合に正常パターンに戻れない)
   } else if(dataArray.length == 6){ recieve_packet_RCS380(handle).done(function(){ appendLog('ack packet recieved'); });}

  // 命令パケット送信処理の失敗時はその時点で処理を終了
  }, function(){closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});});

}

// カードからの応答を検出し、捕捉したカードにカード鍵を書き込む関数
// jQueryのDeferredオブジェクトを利用してRC-S380との非同期通信を制御する
function auth_cardKey_RCS380(handle, data, timer, randomNum){

  send_recieve_packet_RCS380(handle, data).then(function(recieveData){

    // データパケットを配列dataArrayに格納する
    var dataArray = recieveData;

    // データパケットの長さが16以上であればFelicaカードのIDmを取得したと判断する
    if(dataArray.length > 16){

      appendLog('detected FelicaCard');

      // pollingを実行するタイマーを解除
      clearInterval(timer);
      timer = 0;

      // データ配列内のIDmの先頭の配列位置を指定
      var dataIndex = 17;

      // 配列でIDmの値を格納する変数(初期化を兼ねて先頭の配列を取得)
      var IDmArray = [dataArray[dataIndex]];

      // extensionへの連携用にデータを16進数の表記に直し、ゼロパディングしてIDmHexStringに格納する
      var IDmHexString  = ("0" + dataArray[dataIndex].toString(16)).slice(-2);

      // 配列からIDmが格納されている18番目から25番目の配列のデータを抜き出す
      for(dataIndex = dataIndex + 1; dataIndex < 25; dataIndex++){

        // 配列にデータを順番に格納していく
        IDmArray = IDmArray.concat([dataArray[dataIndex]]);

        // IDmの最後尾まで順番にゼロパディングしながらIDmHexStringに格納する
        IDmHexString = IDmHexString + ("0" + dataArray[dataIndex].toString(16)).slice(-2);

      }

      // カードのランダムチャレンジブロックに乱数を書き込む
      write_wo_encryption_RCS380(handle, IDmArray, [0x01], [0x80], setArray(randomNum)).then(function(){
        
        // 書き込み内容の確認のため、カードからIDを読み出す
        read_wo_encryption_RCS380(handle, IDmArray, [0x03], [0x82, 0x86, 0x91]).then(function(recieveData){

          appendLog("random challenge response recieved from the card.");
  
          // MAC値をランダムチャレンジのレスポンスとして受信データから取得する
          var rcResponse = setHexString(recieveData.subarray(28,76));

          // dataHexStringに格納したIDmをextensionに送信する
          chrome.runtime.sendMessage(sendId, {"rcResponse":rcResponse }, function(response){
    
            // extensionからのIDm受信成功メッセージを受信した場合
            if(response.success){ closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;}); }

          });

        // 命令パケット送信処理の失敗時はその時点で処理を終了
        }, function(){closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});});

      // 命令パケット送信処理の失敗時はその時点で処理を終了
      }, function(){closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});});

    // データパケットの長さが6であればackパケットを受信したと判断する
    // (この判定を行わないと、RC-S380からの受信パケットがずれた場合に正常パターンに戻れない)
    } else if(dataArray.length == 6){recieve_packet_RCS380(handle).done(function(){ appendLog('ack packet recieved');}); }

  // 命令パケット送信処理の失敗時はその時点で処理を終了
  }, function(){closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});});

}