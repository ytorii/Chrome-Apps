// Felica IDm Reciever for RC-S380 (c) 2015 by Yosuke Torii. All rights reserved.

var verifyRc  = document.getElementById('verifyRc');
var verifyKey = document.getElementById('verifyKey');

var felicaIDm  = document.getElementById('felicaIDm');
var felicaCKV  = document.getElementById('felicaCKV');
var felicaRandomNum = document.getElementById('felicaRandomNum');
var felicaRandomRes = document.getElementById('felicaRandomRes');
var felicaRandomCal = document.getElementById('felicaRandomCal');


verifyRc.addEventListener('click', function(){

  var request =  {"verifyRc" : "true", "verifyId" : felicaIDm.value, "verifyCKV" : felicaCKV.value , "verifyRandomNum" : felicaRandomNum.value , "verifyKey" : verifyKey.value }; 

  appendLog("start verify...");

  chrome.runtime.sendMessage(request, function(response) {

    felicaRandomCal.value = response.verifyMAC;

    if(felicaRandomRes.value == felicaRandomCal.value){

      alert("MACTHED!!");
    
    } else {

      alert("NOT MACTHED...");

    }

  }); 

},false);

felicaIDm.addEventListener('getId', function(){alert("completed");});





// localStorage�̃L�[
var key = "idmReaderApp";
var appId;

// localStorage�ɕۑ�����ID���擾����
// �f�t�H���g�ł�IDm Reader App��ID�Ƃ���
var showStorage = function() {

    var obj = JSON.parse(localStorage.getItem(key));
    
    if(obj){

	appId = obj['idmReaderApp'];

    } else {

	appId = "oocaofoepnenfidojplahcdelmemhklc";

    }

    var currentAppId  = document.getElementById('currentAppId');

    currentAppId.innerText = appId;

};

// ���ݓo�^����Ă���App��ID��\������
showStorage();

var put = document.getElementById('put');

// put���N���b�N���ꂽ�ۂ�ID�����[�J���X�g���[�W�ɓo�^����
put.addEventListener('click', function(){

  var key = document.getElementById('key').value;
  var value = document.getElementById('idmReaderAppId').value;
  var idObj = JSON.parse(localStorage.getItem(key));

  if (!idObj) { idObj = new Object(); }

  idObj[key] = value;

  localStorage.setItem(key, JSON.stringify(idObj));

  showStorage();

  alert("completed saving AppId. ");

},false);

