// MIFARE UL UID Reciever Extension for RC-S380 (c) 2015 by Yosuke Torii. All rights reserved.

 $(function(){

	// リクエスト送信先のAppのIDを格納する変数
	var uidReaderAppId;

	// バックグラウンドページを経由してローカルストレージからAppのIDを取得する	
	chrome.runtime.sendMessage({"method": "getAppId"}, function(response) {

		uidReaderAppId = response.appId;

		var mifareLogField = document.getElementById("mifareLog");

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

		var appendLog = function(message) {

			$("#mifareLog").html($("#mifareLog").html() + "<br/>" + message);

		}

	});	

});
