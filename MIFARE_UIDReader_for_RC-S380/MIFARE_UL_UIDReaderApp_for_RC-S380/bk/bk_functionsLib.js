// RC-S380のID情報(業務用と個人用でプロダクトIDが異なる)
var vendorId  = 0x054c;
var productId = 0x06c1;
var productIdP = 0x06c3;

// FelicaカードIDmの送信先のChrome拡張機能のID
var whitelistedIds = "pgdohmilnbahhkhodcmnhpdoolfdmhip";

// コンソールにログを出力する必要がある場合に1とするフラグ
var debug = 1;

// USBとの通信させたい時だけ1とするフラグ
var isOpen = 0;

// Felicaカードへのpollingの実行間隔をミリ秒で設定
var pollingInterval = 500;

// RC-S380からの受信パケットの設定情報(全受信パケットで共通)
var commandRecieveInfo = { direction : 'in', endpoint : 0x01, length : 128 };

// RC-S380への通信時のプリアンブル
var prianbleBuffer = [0x00, 0x00, 0xff, 0xff, 0xff];	

// 以下、RC-S380に送信する命令パケットを格納するArrayBuffer
// 通信時に必ず同じデータとなるものはヘッダからCRCまで固定値として使用する

// RC-S380に内蔵のPort-100チップのコマンドタイプを取得する命令
var getCommandBuffer         = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x02, 0x00, 0xfe, 0xd6, 0x28, 0x02, 0x00]);       

// RC-S380に内蔵のPort-100チップのコマンドタイプを１に設定する命令
var setCommandBuffer         = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x2a, 0x01, 0xff, 0x00]);

// カードとの通信速度を106kbps、カードタイプはＡを指定する命令
var setRFBuffer              = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x00, 0x02, 0x03, 0x0f, 0x03, 0x13, 0x00]);

// 通信プロトコル設定値を、項目番号・設定値の順に指定する命令
// カードタイプＡの設定値
var setProtocolBuffer        = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x28, 0x00, 0xd8, 0xd6, 0x02, 0x00, 0x06, 0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x04, 0x00, 0x05, 0x01, 0x06, 0x00, 0x07, 0x07, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00, 0x0b, 0x00, 0x0c, 0x00, 0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06, 0x5f, 0x00]);
//reqa
var setProtocolBuffer1       = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x08, 0x00, 0xf8, 0xd6, 0x02, 0x04, 0x01, 0x06, 0x01, 0x07, 0x08, 0x0d, 0x00]);
// lv1 anticol
var setProtocolBuffer2       = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x08, 0x00, 0xf8, 0xd6, 0x02, 0x01, 0x01, 0x02, 0x01, 0x06, 0x00, 0x1d, 0x00]);
// lv1 select
//00:00:ff:ff:ff:08:00:f8:d6:02:01:00:02:00:06:01:1e:00
// lv2 anticol
//00:00:ff:ff:ff:08:00:f8:d6:02:01:01:02:01:06:00:1d:00
// lv2 select
//00:00:ff:ff:ff:04:00:fc:d6:02:02:00:26:00
// read
//00:00:ff:ff:ff:04:00:fc:d6:02:02:01:25:00


var setProtocolBuffer3       = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x0a, 0x00, 0xf6, 0xd6, 0x02, 0x01, 0x01, 0x02, 0x01, 0x04, 0x00, 0x07, 0x08, 0x15, 0x00]);

//00:00:ff:ff:ff:0a:00:f6:d6:02:01:01:02:01:04:01:07:08:0f:00
// lv1 select
// lv2 select
//00:00:ff:ff:ff:04:00:fc:d6:02:02:00:26:00
// read

// REQA命令
var reqaCommandBuffer        = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x05, 0x00, 0xfb, 0xd6, 0x04, 0x1e, 0x00, 0x26, 0xe2, 0x00]);

// WUPA命令
var wupaCommandBuffer        = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x05, 0x00, 0xfb, 0xd6, 0x04, 0x64, 0x00, 0x52, 0x70, 0x00]);

// cascade level1 anticollision命令
var lv1AnticolCommandBuffer  = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x04, 0xf4, 0x01, 0x93, 0x20, 0x7e, 0x00]);

// cascade level2 anticollision命令
var lv2AnticolCommandBuffer  = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x04, 0xf4, 0x01, 0x95, 0x20, 0x7c, 0x00]);

// アドレス0x00へのRead命令
var readAdr00CommmandBuffer  = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x04, 0x32, 0x00, 0x30, 0x00, 0xc4, 0x00]);

// cascade level1 select命令部分のみ
var lv1SelectCommand         = [0xd6, 0x04, 0x64, 0x00, 0x93, 0x70, 0x88];
var lv1SelectCommandBuffer   = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x0b, 0x00, 0xf5, 0xd6, 0x04, 0x64, 0x00, 0x93, 0x70, 0x88, 0x04, 0x1d, 0xa7, 0x36, 0x39, 0x00]);

// cascade level2 select命令部分のみ
var lv2SelectCommand         = [0xd6, 0x04, 0x64, 0x00, 0x95, 0x70];

var swtRFBuffer           = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x06, 0x00, 0x24, 0x00]);

// RC-S380に命令パケットを送信し、ackおよびデータパケットを受信する関数
// jQueryのDeferredオブジェクトを利用してRC-S380との非同期通信を制御する
function send_recieve_packet_RCS380(handle, data){

	// Deferredオブジェクトを生成する
	var deferred_snd_rcv = $.Deferred();

	// isOpenフラグが１の時のみ実行する(extension側からのpolling停止要求の受信後は実行しないため)
	if(isOpen){

		// RC-S380へのデータパケット送信処理が成功したらackパケット受信処理を行う
		send_packet_RCS380(handle, data).then(function(){

			// RC-S380へのackパケット受信処理が成功したらデータ受信処理を行う
			recieve_packet_RCS380(handle).then(function(){

				appendLog('recieved ack packet');

				// RC-S380へのデータパケット受信処理が成功したらDeferredオブジェクトの状態を成功状態に設定する
				recieve_packet_RCS380(handle).then(function(recieveData){

					appendLog('recieved data packet');

					deferred_snd_rcv.resolve(recieveData);

				// RC-S380へのデータパケット受信処理が失敗したらDeferredオブジェクトの状態を成功状態に設定する
				}, function(){deferred_snd_rcv.reject();});

			// RC-S380へのackパケット受信処理が失敗したらDeferredオブジェクトの状態を成功状態に設定する
			}, function(){deferred_snd_rcv.reject();});

		// RC-S380へのデータパケット送信処理が失敗したらDeferredオブジェクトの状態を成功状態に設定する
		}, function(){deferred_snd_rcv.reject();});

	}

	// 状態が未決定のDeferredオブジェクトを返す（通信完了後に状態が決定する）
	return deferred_snd_rcv.promise();

}

// RC-S380に命令パケットを送信する関数
// jQueryのDeferredオブジェクトを利用してRC-S380との非同期通信を制御する
function send_packet_RCS380(handle, data){

	// Deferredオブジェクトを生成する
	var deferred_snd = $.Deferred();

	// 通信方向、送信先エンドポイント、送信内容を設定する
	var commandSendInfo = { direction : 'out', endpoint : 0x02, data : data.buffer };

	// isOpenフラグが１の時のみ実行する(extension側からのpolling停止要求の受信後は実行しないため)
	if(isOpen){

		// ChromeAppのUSB通信機能を利用してパケットを送信する
		chrome.usb.bulkTransfer(handle, commandSendInfo, function (info) {

			// 結果コードが0で無ければ通信が異常終了した
			if (info.resultCode !== 0) {

				// ログに結果コードを出力する
				appendLog('failed sending packet... result code was:' + info.resultCode);
						
				// Deferredオブジェクトの状態を失敗に設定する
				deferred_snd.reject();

			// 結果コードが0なら通信が正常終了した
			} else {

				// ログに成功メッセージを出力する
				appendLog('successed sending packet');

				// Deferredオブジェクトの状態を成功に設定する
				deferred_snd.resolve();

			}	

		});
	}

	// 状態が未決定のDeferredオブジェクトを返す（通信完了後に状態が決定する）
	return deferred_snd.promise();

}

// RC-S380からデータパケットを受信する関数
// jQueryのDeferredオブジェクトを利用してRC-S380との非同期通信を制御する
function recieve_packet_RCS380(handle){

	// Deferredオブジェクトを生成する
	var deferred_rcv = $.Deferred();

	// isOpenフラグが１の時のみ実行する(extension側からのpolling停止要求の受信後は実行しないため)
	if(isOpen){

		// ChromeAppのUSB通信機能を利用してパケットを受信する
		chrome.usb.bulkTransfer(handle, commandRecieveInfo, function (info) {
			
			// 結果コードが0で無ければ異常終了した
			if (info.resultCode !== 0) {
	
				// ログに結果コードを出力する
				appendLog('packet recieve failed : ' + info.resultCode);

				// Deferredオブジェクトの状態を失敗に設定する
				deferred_rcv.reject();

			// 結果コードが0なら通信が正常終了した
			} else {

				// 受信したデータを後続の処理に連携するための変数に格納する
				var recieveData = new Uint8Array(info.data);

				// Deferredオブジェクトの状態を成功に設定し、後続処理に受信データを連携する
				deferred_rcv.resolve(recieveData);

			}	

		});

	}

	// 状態が未決定のDeferredオブジェクトを返す（通信完了後に状態が決定する）
	return deferred_rcv.promise();

}

// RC-S380をUSBデバイスとして接続を確立後、通信設定を行う関数
// jQueryのDeferredオブジェクトを利用してRC-S380との非同期通信を制御する
function openConnection(){

 	// Deferredオブジェクトを生成する
	var deferred_openConnection = $.Deferred();


	// RC-S380が業務用か個人用かを確認する（始めに業務用のデバイスがあるか確認）
	chrome.usb.getDevices({"vendorId": vendorId, "productId": productId},function(devices){

		// 業務用のデバイスがなければ個人用のデバイスのプロダクトIDに切り替える
		if(devices.length == 0){

			productId = productIdP;
		
		}

		// RC-S380への接続を試みる
		chrome.usb.findDevices({"vendorId": vendorId, "productId": productId}, function(handles) {
		
			// コネクションが取得できなかった場合はRC-S380が接続されていないと判断する
			if (handles.length == 0) {

				appendLog('No RC-S380 found...');

				// extensionにRC-S380が接続されていない旨のメッセージ
				var errorMessage = "The device is not connected or already used.";

				// Deferredオブジェクトの状態を失敗に設定する
				deferred_openConnection.reject(errorMessage);
	
				return;

			}
    
			appendLog('find Devices');

			// コネクションを変数handleに格納して後処理でも使用する
			var handle = handles[0];

			// RC-S380と接続してhandleを取得できたらisOpenフラグを1に設定
   			isOpen = 1;

			// デバイスの状態を一度リセットしてから通信を開始する
			chrome.usb.resetDevice(handle, function (result) {

				appendLog('reset Device');

				// インターフェースを取得して通信可能な状態にする
				chrome.usb.claimInterface(handle, 0, function () {				

					appendLog('claim Interface');				

					// Port-100チップのコマンドタイプを取得する命令
					//(現在は決め打ちでコマンドタイプを１に指定)
			       		//send_recieve_packet_RCS380(handle, getCommandBuffer).then(function(){

					// Port-100チップのコマンドタイプを設定する命令
			       		send_recieve_packet_RCS380(handle, setCommandBuffer).then(function(){

						// Port-100チップとFelicaカードとの通信速度およびカードタイプを指定する命令
			       			send_recieve_packet_RCS380(handle, setRFBuffer).then(function(){

							// 通信対象のカードタイプの通信プロトコルを設定する命令
			       				send_recieve_packet_RCS380(handle, setProtocolBuffer).then(function(){

							// Deferredオブジェクトの状態を成功に設定する
							deferred_openConnection.resolve(handle);

							// RC-S380への各命令の実行が失敗した場合はその時点で終了する
		       					}, function(){closeConnection(handle).done(function(){return;});});
	
						 }, function(){closeConnection(handle).done(function(){return;});});
				
	       				}, function(){closeConnection(handle).done(function(){return;});});
				
	       				//}, function(){closeConnection(handle).done(function(){return;});});
	
				});

			});

		});

	});

	// 状態が未決定のDeferredオブジェクトを返す（通信完了後に状態が決定する）
	return deferred_openConnection.promise();

}

// RC-S380との接続を切断する関数
// jQueryのDeferredオブジェクトを利用してRC-S380との非同期通信を制御する
function closeConnection(handle){

 	// Deferredオブジェクトを生成する
	var deferred_closeConnection = $.Deferred();

	if(isOpen = 1){

	    	// isOpenフラグを0にして以降のRC-S380との通信処理を行わないようにする
		isOpen = 0;

		// インターフェースを開放
		chrome.usb.releaseInterface(handle, 0, function(){
	
			appendLog("released Interface");			
	
			// デバイスとの接続を切断する
			chrome.usb.closeDevice(handle, function(){
			
				appendLog("closed Device");

				// handleを初期化（これをしないと複数回処理したときにエラーになる）
				handle = 0;			

				// Deferredオブジェクトの状態を成功に設定する
        			deferred_closeConnection.resolve();

			});

		});

	}

	return deferred_closeConnection.promise();

}

// コンソールにログを出力する関数
var appendLog = function(message) {

    if(debug){

	console.log(message);

    }

 };

// 命令データ配列に対してフレームのヘッダ、フッタの配列を追加する関数
function setFrameArray(dataArray){

	//命令パケットのヘッダの配列と、命令データ長を格納する配列を追加（長さには追加した配列も含めるため+1する）
	dataArray = commandHeaderBuffer.concat([dataArray.length + 0x01]).concat(dataArray);

	//ヘッダを含めた命令パケットのデータ長を格納する配列を追加(ヘッダとデータ長のフォーマットは固定)
	dataArray = prianbleBuffer.concat([dataArray.length, 0x00, (0xff - dataArray.length + 0x01)]).concat(dataArray);

	// データ内容のCRCを計算してdataArrayに格納
	dataArray = dataArray.concat([sumDataCRC(dataArray)]).concat([0x00]);

        return dataArray;

}

// データのCRCを計算する関数
// データの合計値とCRCの和が0となるように計算する
function sumDataCRC(dataArray){

	// データの合計値を格納する変数
	var crcSum = 0;

	// ヘッダーの８バイトを除いたデータの合計値を計算する
	for(var i = 8; i < dataArray.length; i++){

		crcSum = crcSum + dataArray[i];

	}

	// データの合計値の２の補数をCRCとして返す
	return ~crcSum + 1; 

}