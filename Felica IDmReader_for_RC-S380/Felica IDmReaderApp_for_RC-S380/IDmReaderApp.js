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

        // dataHexString�Ɋi�[����IDm��extension�ɑ��M����
        chrome.runtime.sendMessage(sendId, {felicaIDm: setHexString(recieveData.subarray(28,44))}, function(response){
 
          // extension�����IDm��M�������b�Z�[�W����M�����ꍇ
          if(response.success){

            // connectionHandle��������(��������Ȃ��Ƒ��̃C�x���g���X�i�[�Ƌ�������������)
            connectionHandle = 0;

            // RC-S380�Ƃ̐ڑ���ؒf����
            closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});

          }

        });

      // ���߃p�P�b�g���M�����̎��s���͂��̎��_�ŏ������I��
      }, function(){closeConnection(handle).done(function(){return;});});

    // �f�[�^�p�P�b�g�̒�����6�ł����ack�p�P�b�g����M�����Ɣ��f����
    // (���̔�����s��Ȃ��ƁARC-S380����̎�M�p�P�b�g�����ꂽ�ꍇ�ɐ���p�^�[���ɖ߂�Ȃ�)
    } else if(dataArray.length == 6){ recieve_packet_RCS380(handle).done(function(){ appendLog('ack packet recieved'); });}

  // ���߃p�P�b�g���M�����̎��s���͂��̎��_�ŏ������I��
  }, function(){closeConnection(handle).done(function(){return;});});

}

// �J�[�h����̉��������o���A�ߑ������J�[�h�ɃJ�[�hID�ƌʉ��J�[�h�����������ފ֐�
// jQuery��Deferred�I�u�W�F�N�g�𗘗p����RC-S380�Ƃ̔񓯊��ʐM�𐧌䂷��
function write_cardId_RCS380(handle, data, timer, uniqueId, cardKeyVersion, masterKey){

  send_recieve_packet_RCS380(handle, data).then(function(recieveData){

    // �f�[�^�p�P�b�g��z��dataArray�Ɋi�[����
    var dataArray = recieveData;

    // �f�[�^�p�P�b�g�̒�����16�ȏ�ł����Felica�J�[�h��IDm���擾�����Ɣ��f����
    if(dataArray.length > 16){

      appendLog('detected Felica Lite-S Card');

      // polling�����s����^�C�}�[������
      clearInterval(timer);
      timer = 0;

      // �f�[�^�z�����IDm�̐擪�̔z��ʒu���w��
      var dataIndex = 17;

      // �z���IDm�̒l���i�[����ϐ�(�����������˂Đ擪�̔z����擾)
      var IDmArray = [dataArray[dataIndex]];

      // extension�ւ̘A�g�p�Ƀf�[�^��16�i���̕\�L�ɒ����A�[���p�f�B���O����IDmHexString�Ɋi�[����
      var IDmHexString  = ("0" + dataArray[dataIndex].toString(16)).slice(-2);

      // �z�񂩂�IDm���i�[����Ă���18�Ԗڂ���25�Ԗڂ̔z��̃f�[�^�𔲂��o��
      for(dataIndex = dataIndex + 1; dataIndex < 25; dataIndex++){

        // �z��Ƀf�[�^�����ԂɊi�[���Ă���
        IDmArray = IDmArray.concat([dataArray[dataIndex]]);

        // IDm�̍Ō���܂ŏ��ԂɃ[���p�f�B���O���Ȃ���IDmHexString�Ɋi�[����
        IDmHexString = IDmHexString + ("0" + dataArray[dataIndex].toString(16)).slice(-2);

      }

      // IDm��8�o�C�g���[���p�f�B���O�����Ǝ�ID����ID��16�i�\�L�̕�������쐬����
      // �Ǝ�ID�̐擪2�o�C�g��DFC�R�[�h�������p���Ȃ��̂ŕK��00�ɂȂ�
      var uniqueIdString = IDmHexString + ("0000000000000000" + uniqueId.toString(16)).slice(-16);

      // �擾����IDm��extension�����M����ID����J�[�h�֏�������ID�̔z����쐬
      var uniqueIdArray = setArray(uniqueIdString);

      // �J�[�h��ID����������
      write_wo_encryption_RCS380(handle, IDmArray, [0x01], [0x82], uniqueIdArray).then(function(){
        
        // �������ݓ��e�̊m�F�̂��߁A�J�[�h����ID��ǂݏo��
        read_wo_encryption_RCS380(handle, IDmArray, [0x01], [0x82]).then(function(recieveData){

          // �쐬�����������݃f�[�^�ƃJ�[�h����ǂݏo�����f�[�^����v���Ă���ΐ����Ɣ��肷��
          // (�ǂݏo�����f�[�^����ID���i�[����Ă���ӏ���؂�o��)
          if(isSameArray(recieveData.subarray(28,44), uniqueIdArray)){

           appendLog("successed writing uniqueID to the Felica Lite-S card.");

           // �ʉ��}�X�^�[���ƃJ�[�h���o�[�W���������͂���Ă���ꍇ�͌ʉ��J�[�h�����쐬���ď�������
           if(masterKey && cardKeyVersion){

             // ��������ID�ƌʉ��}�X�^�[������ʉ��J�[�h�����쐬����(IV��0�Ƃ���)
             var uniqueCardKeyArray = setArray(uniqueCardKey_generator(uniqueIdString, masterKey, 0));

             // �J�[�h���o�[�W�����̏������ݔz����쐬����
             var cardKeyVersionArray = setArray(("0000" + cardKeyVersion.toString(16)).slice(-4) + "0000000000000000000000000000");          

             // �J�[�h�Ɍʉ��J�[�h������������
             write_wo_encryption_RCS380(handle, IDmArray, [0x01], [0x87], uniqueCardKeyArray).then(function(){

               // �J�[�h�Ɍʉ��J�[�h���̃o�[�W��������������
               write_wo_encryption_RCS380(handle, IDmArray, [0x01], [0x86], cardKeyVersionArray).then(function(){

                 appendLog("successed writing UniqueCardKey to the Felica Lite-S card.");

                 // dataHexString�Ɋi�[����IDm��extension�ɑ��M����
                 chrome.runtime.sendMessage(sendId, {felicaIDm: uniqueIdString}, function(response){
   
                   // extension�����IDm��M�������b�Z�[�W����M�����ꍇ
                   if(response.success){ closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;}); }

                 });

               // ���߃p�P�b�g���M�����̎��s���͂��̎��_�ŏ������I��
               }, function(){closeConnection(handle).done(function(){return;});});

             // ���߃p�P�b�g���M�����̎��s���͂��̎��_�ŏ������I��
             }, function(){closeConnection(handle).done(function(){return;});});

           // �J�[�hID�̏������݂݂̂Ȃ�ID���g���@�\�֑��M���ďI������
           } else {

             // dataHexString�Ɋi�[����IDm��extension�ɑ��M����
             chrome.runtime.sendMessage(sendId, {felicaIDm: uniqueIdString}, function(response){
    
               // extension�����IDm��M�������b�Z�[�W����M�����ꍇ
               if(response.success){ closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;}); }

             });

           }

         // �������ݓ��e�Ɠǂݏo�����ʂ���v���Ȃ��ꍇ�͏������s�Ɣ���
         } else {

           appendLog('error detected in written UniqueID in the card.');

           deferred_register_cardKey.reject();

           // RC-S380�Ƃ̐ڑ���ؒf����
           closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});

         }

       // ���߃p�P�b�g���M�����̎��s���͂��̎��_�ŏ������I��
       }, function(){closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});});

     // ���߃p�P�b�g���M�����̎��s���͂��̎��_�ŏ������I��
     }, function(){closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});});


   // �f�[�^�p�P�b�g�̒�����6�ł����ack�p�P�b�g����M�����Ɣ��f����
   // (���̔�����s��Ȃ��ƁARC-S380����̎�M�p�P�b�g�����ꂽ�ꍇ�ɐ���p�^�[���ɖ߂�Ȃ�)
   } else if(dataArray.length == 6){ recieve_packet_RCS380(handle).done(function(){ appendLog('ack packet recieved'); });}

  // ���߃p�P�b�g���M�����̎��s���͂��̎��_�ŏ������I��
  }, function(){closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});});

}

// �J�[�h����̉��������o���A�ߑ������J�[�h�ɃJ�[�h�����������ފ֐�
// jQuery��Deferred�I�u�W�F�N�g�𗘗p����RC-S380�Ƃ̔񓯊��ʐM�𐧌䂷��
function auth_cardKey_RCS380(handle, data, timer, randomNum){

  send_recieve_packet_RCS380(handle, data).then(function(recieveData){

    // �f�[�^�p�P�b�g��z��dataArray�Ɋi�[����
    var dataArray = recieveData;

    // �f�[�^�p�P�b�g�̒�����16�ȏ�ł����Felica�J�[�h��IDm���擾�����Ɣ��f����
    if(dataArray.length > 16){

      appendLog('detected FelicaCard');

      // polling�����s����^�C�}�[������
      clearInterval(timer);
      timer = 0;

      // �f�[�^�z�����IDm�̐擪�̔z��ʒu���w��
      var dataIndex = 17;

      // �z���IDm�̒l���i�[����ϐ�(�����������˂Đ擪�̔z����擾)
      var IDmArray = [dataArray[dataIndex]];

      // extension�ւ̘A�g�p�Ƀf�[�^��16�i���̕\�L�ɒ����A�[���p�f�B���O����IDmHexString�Ɋi�[����
      var IDmHexString  = ("0" + dataArray[dataIndex].toString(16)).slice(-2);

      // �z�񂩂�IDm���i�[����Ă���18�Ԗڂ���25�Ԗڂ̔z��̃f�[�^�𔲂��o��
      for(dataIndex = dataIndex + 1; dataIndex < 25; dataIndex++){

        // �z��Ƀf�[�^�����ԂɊi�[���Ă���
        IDmArray = IDmArray.concat([dataArray[dataIndex]]);

        // IDm�̍Ō���܂ŏ��ԂɃ[���p�f�B���O���Ȃ���IDmHexString�Ɋi�[����
        IDmHexString = IDmHexString + ("0" + dataArray[dataIndex].toString(16)).slice(-2);

      }

      // �J�[�h�̃����_���`�������W�u���b�N�ɗ�������������
      write_wo_encryption_RCS380(handle, IDmArray, [0x01], [0x80], setArray(randomNum)).then(function(){
        
        // �������ݓ��e�̊m�F�̂��߁A�J�[�h����ID��ǂݏo��
        read_wo_encryption_RCS380(handle, IDmArray, [0x03], [0x82, 0x86, 0x91]).then(function(recieveData){

          appendLog("random challenge response recieved from the card.");
  
          // MAC�l�������_���`�������W�̃��X�|���X�Ƃ��Ď�M�f�[�^����擾����
          var rcResponse = setHexString(recieveData.subarray(28,76));

          // dataHexString�Ɋi�[����IDm��extension�ɑ��M����
          chrome.runtime.sendMessage(sendId, {"rcResponse":rcResponse }, function(response){
    
            // extension�����IDm��M�������b�Z�[�W����M�����ꍇ
            if(response.success){ closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;}); }

          });

        // ���߃p�P�b�g���M�����̎��s���͂��̎��_�ŏ������I��
        }, function(){closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});});

      // ���߃p�P�b�g���M�����̎��s���͂��̎��_�ŏ������I��
      }, function(){closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});});

    // �f�[�^�p�P�b�g�̒�����6�ł����ack�p�P�b�g����M�����Ɣ��f����
    // (���̔�����s��Ȃ��ƁARC-S380����̎�M�p�P�b�g�����ꂽ�ꍇ�ɐ���p�^�[���ɖ߂�Ȃ�)
    } else if(dataArray.length == 6){recieve_packet_RCS380(handle).done(function(){ appendLog('ack packet recieved');}); }

  // ���߃p�P�b�g���M�����̎��s���͂��̎��_�ŏ������I��
  }, function(){closeConnection(connectionHandle).done(function(){connectionHandle = 0; return;});});

}