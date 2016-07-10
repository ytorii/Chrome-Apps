// MIFARE UL UID Reciever Extension for RC-S380 (c) 2015 by Yosuke Torii. All rights reserved.

// localStorageのキー
var key = "uidReaderApp";

// ログを出力するHTML要素
var mifareLogField = document.getElementById("mifareLog");

// AppのIDを格納する変数
var appId;

$(function(){

    // 現在登録されているAppのIDを表示する
    showStorage();

    // putがクリックされた際にIDをローカルストレージに登録する
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

	// バックグラウンドページを経由してローカルストレージからAppのIDを取得する	
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

// localStorageの文字列をJSONで取得
var getAppId = function() {

    var str = localStorage.getItem(key);

    return JSON.parse(str);

};

// JSONを文字列でlocalStorageに保存
var setAppId = function(obj) {

    var str = JSON.stringify(obj);

    localStorage.setItem(key, str);

};

// localStorageに保存したIDを取得する
// デフォルトではUID Reader AppのIDとする
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
