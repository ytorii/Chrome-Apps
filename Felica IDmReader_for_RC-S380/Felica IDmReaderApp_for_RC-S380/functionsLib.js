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


// 以下、RC-S380に送信する命令パケットを格納するArrayBuffer
// 通信時に必ず同じデータとなるものはヘッダからCRCまで固定値として使用する

// RC-S380に内蔵のPort-100チップのコマンドタイプを取得する命令
var getCommandBuffer      = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x02, 0x00, 0xfe, 0xd6, 0x28, 0x02, 0x00]);       

// RC-S380に内蔵のPort-100チップのコマンドタイプを１に設定する命令
var setCommandBuffer      = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x2a, 0x01, 0xff, 0x00]);

// カードとの通信速度を212kbps、カードタイプはFを指定する命令
var setFelicaRFBuffer           = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x00, 0x01, 0x01, 0x0f, 0x01, 0x18, 0x00]);

// 通信プロトコル設定値を、項目番号・設定値の順に指定する命令
// カードタイプＦの設定値
var setFelicaProtocolBuffer     = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x2a, 0x00, 0xd6, 0xd6, 0x02, 0x00, 0x18, 0x01, 0x01, 0x02, 0x01, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00, 0x0b, 0x00, 0x0c, 0x00, 0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06, 0x14, 0x00, 0x37, 0x00]);

// 全種類のFelicaカードへのpollingを実行する命令
var pollingWildcardBuffer = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x0a, 0x00, 0xf6, 0xd6, 0x04, 0x50, 0x00, 0x06, 0x00, 0xff, 0xff, 0x00, 0x03, 0xcf, 0x00]);

// Felica-LiteSカードのみへのpollingを実行する命令
var pollingLiteSBuffer    = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x0a, 0x00, 0xf6, 0xd6, 0x04, 0xe8, 0x03, 0x06, 0x00, 0x88, 0xb4, 0x00, 0x00, 0xf9, 0x00]);  

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

          // Port-100チップのコマンドタイプを設定する命令
          send_recieve_packet_RCS380(handle, setCommandBuffer).then(function(){

            // Port-100チップとFelicaカードとの通信速度およびカードタイプを指定する命令
            send_recieve_packet_RCS380(handle, setFelicaRFBuffer).then(function(){

              // 通信対象のカードタイプの通信プロトコルを設定する命令
              send_recieve_packet_RCS380(handle, setFelicaProtocolBuffer).then(function(){

                // Deferredオブジェクトの状態を成功に設定する
                deferred_openConnection.resolve(handle);

              // RC-S380への各命令の実行が失敗した場合はその時点で終了する
              }, function(){closeConnection(handle).done(function(){return;});});
  
            }, function(){closeConnection(handle).done(function(){return;});});
        
          }, function(){closeConnection(handle).done(function(){return;});});
        
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