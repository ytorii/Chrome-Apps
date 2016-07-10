// MIFARE UL UID Reciever Extension for RC-S380 (c) 2015 by Yosuke Torii. All rights reserved.

// localStorage�̃L�[
var key = "uidReaderApp";

// ���O���o�͂���HTML�v�f
var mifareLogField = document.getElementById("mifareLog");

// App��ID���i�[����ϐ�
var appId;

$(function(){

    // ���ݓo�^����Ă���App��ID��\������
    showStorage();

    // put���N���b�N���ꂽ�ۂ�ID�����[�J���X�g���[�W�ɓo�^����
    $('#put').on('click',function() {

        var key = $('#key').val();

        var value = $('#uidReaderAppId').val();

        var idObj = getAppId();

        if (!idObj) {

            idObj = new Object();

        }

        idObj[key] = value;

        setAppId(idObj);

        showStorage();

        alert("completed saving AppId. ");

    });

	// �o�b�N�O���E���h�y�[�W���o�R���ă��[�J���X�g���[�W����App��ID���擾����	
	chrome.runtime.sendMessage({"method": "getAppId"}, function(response) {

		uidReaderAppId = response.appId;

		$("#startMifarePolling").on("click", function(ev) {

			appendLog("start getting UID...");

			chrome.runtime.sendMessage( uidReaderAppId, {"startMifarePolling" : "true" }, function(response) { 

				appendLog(response.result);

			});

		});

		chrome.runtime.onMessage.addListener(

		   function(request, sender, sendResponse) {
   
		     if(request.recieve_message.length > 0){
     
			chrome.runtime.sendMessage( uidReaderAppId, {getIDmComplete: "true"}, function(response) {});

		        var cardId = $("[id $= mifareulUID]");

		        cardId.val(request.recieve_message.toUpperCase());

			appendLog("completed.");

		      }

		   }

		);
	});

});

// localStorage�̕������JSON�Ŏ擾
var getAppId = function() {

    var str = localStorage.getItem(key);

    return JSON.parse(str);

};

// JSON�𕶎����localStorage�ɕۑ�
var setAppId = function(obj) {

    var str = JSON.stringify(obj);

    localStorage.setItem(key, str);

};

// localStorage�ɕۑ�����ID���擾����
// �f�t�H���g�ł�UID Reader App��ID�Ƃ���
var showStorage = function() {

    var obj = getAppId();
    
    if(obj){

	appId = obj['uidReaderApp'];

    } else {

	appId = "lcmhhnojekallednfohmalghkemkabeo";

    }

    $('#currentAppId').html(appId);

};

var appendLog = function(message) {

    $("#mifareLog").html($("#mifareLog").html() + "<br/>" + message);

}
