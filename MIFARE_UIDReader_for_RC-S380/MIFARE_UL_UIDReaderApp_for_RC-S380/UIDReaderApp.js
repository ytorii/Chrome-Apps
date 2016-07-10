// MIFARE Ultralight UID Reader for RC-S380 (c) 2015 by Yosuke Torii. All rights reserved.

// polling実行要求の送信元IDを格納する変数
var sendId = 0; 

// アプリケーション起動時に実行する処理
$(function(){

  // RC-S380とのコネクションを格納する変数
  var connectionHandle = 0; 

  // polling実行時のタイマーを格納する変数
  var timer = 0; 
 
  // extension側からのpageLoadメッセージを受信した場合にpollingを開始するイベントリスナー
  // （pageLoadメッセージはpollingを実行対象のページが読み込まれた際に送信される）
  chrome.runtime.onMessageExternal.addListener(

	function(request, sender, sendResponse) {

		// startPollingメッセージを受信したら処理開始
		if (request.startMifarePolling) {

			// polling実行要求の送信元IDを取得	
			sendId = sender.id;

			appendLog('getIDrequest from : ' +  sender.id);

			// RC-S380との接続開始処理を実行し、成功すればRC-S380との通信設定処理に移る
			openConnection().then(function(handle){
											
				// 取得した接続情報を接続中止時に使う変数に格納(この関数のスコープ外で使用するため)
				connectionHandle = handle;

				// pollingを一定間隔で実行するタイマーを設定する
				timer = setInterval(function(){get_UID_RCS380(connectionHandle, reqaCommandBuffer, timer)}, pollingInterval);

				// pollingを実行する(タイマーは一定間隔後にしか最初の処理を開始しないので先ず1回実行する)
				get_UID_RCS380(connectionHandle, reqaCommandBuffer, timer);

				// extensionへpolling開始メッセージを返信する
				sendResponse({"result":"App starts polling to get UID"});

				// extension側にpollingを開始したことをメッセージで通知（extension側でpollingの状態を管理するため）
				chrome.runtime.sendMessage(sendId, {pollingStart: "true"}, function(response){});								
										
			});

		 // polling要求を行ったextensionからのpageChangeメッセージを受信した際、polling中である場合は中止する
    		} else if(sender.id == sendId && request.pageChange && timer){

			appendLog('page Changed');

 		   	// isOpenフラグを0にして以降のRC-S380との通信処理を行わないようにする
			isOpen = 0;

		    	// pollingを実行するタイマーを解除および初期化する
			clearInterval(timer);
			timer = 0;

			appendLog('stopped Polling');

			// RC-S380との接続を切断する
			closeConnection(connectionHandle).done(function(){

				// connectionHandleを初期化(これをやらないと他のイベントリスナーと競合が発生する)
				connectionHandle = 0;

				return;
			
			});

 		// デバイスが使用中の場合は終了する
 		}  else {

        		return;

    		}

	 }

    );

});

// RC-S380でpollingを実行し、捕捉したカードのIDmを受信する関数
// jQueryのDeferredオブジェクトを利用してRC-S380との非同期通信を制御する
function get_UID_RCS380(handle, data, timer){

	// REQAコマンドを送信する
	send_recieve_packet_RCS380(handle, data).then(function(response){

		// レスポンス長が19でレスポンスコードが正しければカードを捕捉したと判定
		if(response.length == 19 && response[15] == 0x44){

			appendLog('MIFARE card detected.');

		    	// pollingを実行するタイマーを解除および初期化する
			clearInterval(timer);
			timer = 0;

			// read命令を実行するためのプロトコル設定に変更する
			send_recieve_packet_RCS380(handle, setProtocolBuffer_read00).then(function(response){

				// UIDを取得するため、アドレス0x00から読み取るコマンドを送信する
				send_recieve_packet_RCS380(handle, readAdr00CommmandBuffer).then(function(response){

					// レスポンス長が33でレスポンスの先頭値が正しければ(8ならば)UIDを受信できたと判定
					if(response.length == 33 && response[14] == 0x08){

						appendLog('Recieved MIFARE Ultralight UID.');

						// 読み取ったUIDを格納する変数
						var UIDHexString = "";
					
						// 受信データからIDmの前半部分が格納されている16番目から18番目の配列のデータを抜き出す
						for(var i = 15; i < 18; i++){

							// extensionへの連携用にデータを16進数の表記に直し、順番にゼロパディングしてUIDHexStringに格納する
							UIDHexString = UIDHexString + ("0" + response[i].toString(16)).slice(-2);

						}

						// 受信データからIDmの後半部分が格納されている20番目から23番目の配列のデータを抜き出す
						for(var i = 19; i < 23; i++){

							// extensionへの連携用にデータを16進数の表記に直し、順番にゼロパディングしてUIDHexStringに格納する
							UIDHexString = UIDHexString + ("0" + response[i].toString(16)).slice(-2);

						}
	
						// IDmを取得したので、以降の通信は停止する
						isOpen = 0;

						appendLog("sending MIFARE Ultralight UID to " + sendId);

						// UIDHexStringに格納したIDmをextensionに送信する
						chrome.runtime.sendMessage(sendId, {MifareulUID: UIDHexString}, function(response){

							// extensionからのIDm受信成功メッセージを受信した場合
							if(response.success){

								appendLog("successed sending MIFARE Ultralight UID");

								// RC-S380との接続を切断して処理を終了する
								closeConnection(handle).done(function(){return;});

							}

						});

					// 読み取りに失敗した場合は再びタイマーをセットしてREQA命令からやり直し
					} else {

						// プロトコルを元に戻す
						send_recieve_packet_RCS380(handle, setProtocolBuffer_typeA).then(function(response){

							// pollingを一定間隔で実行するタイマーを設定す
							// カードはHALTステートなのでWUPAコマンドを実行する
							timer = setInterval(function(){get_UID_RCS380(handle, wupaCommandBuffer, timer)}, pollingInterval);

						// 命令パケット送信処理の失敗時はその時点で処理を終了
						}, function(){closeConnection(handle).done(function(){return;});});

					}

				// 命令パケット送信処理の失敗時はその時点で処理を終了
				}, function(){closeConnection(handle).done(function(){return;});});

			// 命令パケット送信処理の失敗時はその時点で処理を終了
			}, function(){closeConnection(handle).done(function(){return;});});

		// データパケットの長さが6であればackパケットを受信したと判断する
		// (この判定を行わないと、RC-S380からの受信パケットがずれた場合に正常パターンに戻れない)
		} else if(response.length == 6){

			recieve_packet_RCS380(handle).done(function(){

				appendLog('ack packet recieved');

			});

		}

	// 命令パケット送信処理の失敗時はその時点で処理を終了
	}, function(){closeConnection(handle).done(function(){return;});});

}