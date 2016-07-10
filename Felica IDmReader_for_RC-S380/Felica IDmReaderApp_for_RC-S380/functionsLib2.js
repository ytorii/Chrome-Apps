// RC-S380�ւ̒ʐM���̃v���A���u��
var prianbleBuffer = [0x00, 0x00, 0xff, 0xff, 0xff];  

// polling�ŕߑ������J�[�h�ւ̖��߂̃w�b�_
var commandHeaderBuffer = [0xd6, 0x04, 0xe8, 0x03];  

// polling�ŕߑ������J�[�h�ւ�read/write without encryption���߂̃w�b�_
var readwoEncryptionCommand = [0x06];
var writewoEncryptionCommand = [0x08];

// �T�[�r�X�����w�肷��ϐ��iFelicaLite-S�ł͌Œ�j
var serviceNumber = [0x01];

// �T�[�r�X�R�[�h���X�g���w�肷��ϐ��iFelicaLite-S�ł͌Œ�j
var readServiceCodeList = [0x0b, 0x00];
var writeServiceCodeList = [0x09, 0x00];

// �ʉ��J�[�h���̃o�[�W�������w�肷��ϐ��i���̂Ƃ���Œ�j
var cardKeyVerArray = [0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

// �[���p�f�B���O��������ѕ����ŗp����8�o�C�g��(16��)�̕�����0
var zero8Bytes = "0000000000000000";

// RC-S380��polling���ĕߑ������J�[�h��read w/o encryption�����s����֐�
// jQuery��Deferred�I�u�W�F�N�g�𗘗p����RC-S380�Ƃ̔񓯊��ʐM�𐧌䂷��
function read_wo_encryption_RCS380(handle, IDmArray, blockNumber, blockList){

  // Deferred�I�u�W�F�N�g�𐶐�����
  var deferred_readwoEnc = $.Deferred();

  // ���߃p�P�b�g���i�[����z��(�����l�ɂ͓ǂݏo�����߂��w�肷��)
  var tempCommandArray = readwoEncryptionCommand;

  // IDm�A�T�[�r�X���A�T�[�r�X�R�[�h���X�g�A�u���b�N����tempCommandArray�Ɋi�[
  tempCommandArray = tempCommandArray.concat(IDmArray).concat(serviceNumber).concat(readServiceCodeList).concat(blockNumber)

  // �u���b�N�����̃u���b�N���X�g���쐬����tempCommandArray�Ɋi�[
  for(var i = 0; i < blockNumber; i++){

    // FelicaLite-S�̒ʐM�d�l�ɂ��0x80�̕����͌Œ�l
    tempCommandArray = tempCommandArray.concat([0x80]).concat(blockList[i]);

  }

  // �쐬�������߃f�[�^�Ƀw�b�_�[�����CRC��ǉ�����8�r�b�g���̔z��ɕϊ�����
  var readwoEncBuffer = new Uint8Array(setFrameArray(tempCommandArray));

  // RC-S380�ւ̃f�[�^�p�P�b�g���M���������s���A����������ack�p�P�b�g��M�����Ɉڂ�
  send_packet_RCS380(handle, readwoEncBuffer).then(function(){

    // RC-S380�ւ�ack�p�P�b�g��M���������s���A����������f�[�^��M�����Ɉڂ�
    recieve_packet_RCS380(handle).then(function(){

      appendLog('recieved ack packet');

      // RC-S380�ւ̃f�[�^�p�P�b�g��M����������������Deferred�I�u�W�F�N�g�̏�Ԃ𐬌���Ԃɐݒ肷��
      recieve_packet_RCS380(handle).then(function(recieveData){

        appendLog('recieved read_wo_encryption packet');

        deferred_readwoEnc.resolve(recieveData);

      // RC-S380�ւ̃f�[�^�p�P�b�g��M���������s������Deferred�I�u�W�F�N�g�̏�Ԃ𐬌���Ԃɐݒ肷��
      }, function(){deferred_readwoEnc.reject();});

    // RC-S380�ւ�ack�p�P�b�g��M���������s������Deferred�I�u�W�F�N�g�̏�Ԃ𐬌���Ԃɐݒ肷��
    }, function(){deferred_readwoEnc.reject();});

  // RC-S380�ւ̃f�[�^�p�P�b�g���M���������s������Deferred�I�u�W�F�N�g�̏�Ԃ𐬌���Ԃɐݒ肷��
  }, function(){deferred_readwoEnc.reject();});

  // ��Ԃ��������Deferred�I�u�W�F�N�g��Ԃ��i�ʐM������ɏ�Ԃ����肷��j
  return deferred_readwoEnc.promise();

}

// RC-S380��polling���ĕߑ������J�[�h��write w/o encryption�����s����֐�
// jQuery��Deferred�I�u�W�F�N�g�𗘗p����RC-S380�Ƃ̔񓯊��ʐM�𐧌䂷��
function write_wo_encryption_RCS380(handle, IDmArray, blockNumber, blockList, blockData){

  // Deferred�I�u�W�F�N�g�𐶐�����
  var deferred_writewoEnc = $.Deferred();

  // ���߃p�P�b�g���i�[����z��(�����l�ɂ͏������ݖ��߂��w�肷��)
  var tempCommandArray = writewoEncryptionCommand;

  // IDm�A�T�[�r�X���A�T�[�r�X�R�[�h���X�g�A�u���b�N����tempCommandArray�Ɋi�[
  tempCommandArray = tempCommandArray.concat(IDmArray).concat(serviceNumber).concat(writeServiceCodeList).concat(blockNumber)

  // �u���b�N�����̃u���b�N���X�g��tempCommandArray�Ɋi�[
  for(var i = 0; i < blockNumber; i++){

    tempCommandArray = tempCommandArray.concat([0x80]).concat(blockList[i]);

  }

  // �������ݓ��e�̃f�[�^��tempCommandArray�Ɋi�[
  tempCommandArray = tempCommandArray.concat(blockData);

  // �쐬�������߃f�[�^�Ƀw�b�_�[�����CRC��ǉ����A8�r�b�g���̔z��ɕϊ�����
  var writewoEncBuffer = new Uint8Array(setFrameArray(tempCommandArray));

  // RC-S380�ւ̃f�[�^�p�P�b�g���M����������������ack�p�P�b�g��M�������s��
  send_packet_RCS380(handle, writewoEncBuffer).then(function(){

    // RC-S380�ւ�ack�p�P�b�g��M����������������f�[�^��M�������s��
    recieve_packet_RCS380(handle).then(function(){

      appendLog('recieved ack packet');

      // RC-S380�ւ̃f�[�^�p�P�b�g��M����������������Deferred�I�u�W�F�N�g�̏�Ԃ𐬌���Ԃɐݒ肷��
      recieve_packet_RCS380(handle).then(function(){

        appendLog('recieved write_wo_encryption packet');

        deferred_writewoEnc.resolve();

      // RC-S380�ւ̃f�[�^�p�P�b�g��M���������s������Deferred�I�u�W�F�N�g�̏�Ԃ𐬌���Ԃɐݒ肷��
      }, function(){deferred_writewoEnc.reject();});

    // RC-S380�ւ�ack�p�P�b�g��M���������s������Deferred�I�u�W�F�N�g�̏�Ԃ𐬌���Ԃɐݒ肷��
    }, function(){deferred_writewoEnc.reject();});

  // RC-S380�ւ̃f�[�^�p�P�b�g���M���������s������Deferred�I�u�W�F�N�g�̏�Ԃ𐬌���Ԃɐݒ肷��
  }, function(){deferred_writewoEnc.reject();});

  // ��Ԃ��������Deferred�I�u�W�F�N�g��Ԃ��i�ʐM������ɏ�Ԃ����肷��j
  return deferred_writewoEnc.promise();

}

// CryptoJS�𗘗p����3key-TripleDES�Í���CMAC�l���v�Z���A�ʉ��J�[�h����Ԃ��֐�
// id�Akey�Aiv��utf-8�̓��͂��O��
function uniqueCardKey_generator(id, key, iv){

  // ���ԏ����Ŏg�p����ϐ�
  var l, k1, m1, m2, t1, t2;

  // CMAC�l�v�Z����XOR�����ŗp����萔
  var k1Xor = "000000000000001b";
  var m1Xor = "8000000000000000";

  // iv��0�̏ꍇ3DES��IV(Initial Vector)��0�Ƃ��ď�������
  if(iv == 0){ iv = zero8Bytes; }

  // CryptoJS��0�𕽕��Ƃ���3DES�Í������Í�����l�Ɋi�[����
  l = tripleDES_encoder(zero8Bytes, key, iv);

  // l��2�i���̕\���ɕϊ�����(�ŏ�ʂ�0�̏ꍇ���l�����ă[���p�f�B���O)
  var lBynary = ("0" + parseInt(l, 16).toString(2)).slice(-64);

  // l������1�r�b�g�V�t�g����B�V�t�g�O��l�̍ŏ�ʃr�b�g��1�̏ꍇ�̓V�t�g���XOR���Z��ǉ�����
  if(lBynary.slice(0,1) == "1"){ 

  // �����񑀍�ɂ��r�b�g�V�t�g�Ɠ����̏������s���A16�i���`���ɕϊ����ă[���p�f�B���O����
  k1 = (zero8Bytes + parseInt(lBynary.slice(-63) + "0", 2).toString(16)).slice(-16);

  // �萔k1Xor��XOR���Z���s���B
  k1 = xor_per_2bytes(k1, k1Xor);

  } else {

  // �����񑀍�ɂ��r�b�g�V�t�g�Ɠ����̏������s���A16�i���`���ɕϊ����ă[���p�f�B���O����
  k1 = (zero8Bytes + parseInt(lBynary.slice(-63) + "0", 2).toString(16)).slice(-16);

  }

  // id�̏��8�o�C�g��m1�Aid�̉���8�o�C�g��k1��XOR�����������ʂ�m2�Ƃ���
  m1 = id.slice(0,16);
  m2 = xor_per_2bytes(id.slice(16,32), k1);

  // �ʉ��J�[�h���̐擪8�o�C�g����t1�A����8�o�C�g����t2�Ƃ��Ă��ꂼ��v�Z����
  t1 = tripleDES_encoder(m2, key, tripleDES_encoder(m1, key, iv));
  t2 = tripleDES_encoder(m2, key, tripleDES_encoder(m1, key, m1Xor));
  
  // t1��t2�������������ʂ��ʉ��J�[�h���Ƃ��ĕԂ�
  return (t1 + t2);

}

// �J�[�h���瑗��ꂽMAC_A�ƌv�Z����MAC_A����v�����true���A���Ȃ����false��Ԃ��֐� 
// MAC_A�Z�o�����ł̓J�[�h���̃G���f�B�A���ɍ��킹�ăo�C�g�P�ʂŒl�̏��Ԃ𔽓]����
function calcAuthMAC_A(pt, key, rc, recieveData){

  // �����̒l�𔽓]
  var pt_inv = inverseByteString(pt);

  // �����̏��8�o�C�g���擾���Ēl�𔽓]
  // ���̕ӂ�̏����̓e�N�j�J���m�[�g���m�F����K�v������
  var rc1_inv = inverseByteString(rc.slice(0,16));
  var rc2_inv = inverseByteString(rc.slice(16,32));

  // �ʉ��J�[�h���̏��8�o�C�g�A����8�o�C�g���擾���Ēl�𔽓]
  var ck1_inv = inverseByteString(key.slice(0,16));
  var ck2_inv = inverseByteString(key.slice(16,32));

  // �Z�b�V�������̍쐬�ɗp���錮���쐬
  var skKey_inv = ck1_inv + ck2_inv + ck1_inv;

  // �Z�b�V�������̏��8�o�C�g����щ���8�o�C�g���쐬����
  var sk1_inv = tripleDES_encoder(rc1_inv, skKey_inv, zero8Bytes);
  var sk2_inv = tripleDES_encoder(rc2_inv, skKey_inv, sk1_inv);

  // �Z�b�V���������쐬����
  var sk_inv = sk1_inv + sk2_inv + sk1_inv;

  // MAC�l�̎Z�o�ɗp���鏉���x�N�g�����v�Z����
  // �ȍ~�̏����ł͂��̕ϐ��ɈÍ���������IV�Ƃ��ėp����
  var maca_iv = tripleDES_encoder(pt_inv, sk_inv, rc1_inv);

  // �ǂݍ��񂾃u���b�N�f�[�^��8�o�C�g����TripleDES�Í�������MAC�l�����߂�
  // MAC_A�������u���b�N�f�[�^�������߂�
  var blockNum = recieveData[27] -1;

  for(var i = 0; i < blockNum; i++){

    // �u���b�N�f�[�^�̏��8�o�C�g����MAC�l���Z�o����(IV�͑O�i�̏�������)
    maca_iv = tripleDES_encoder(inverseByteString(setHexString(recieveData.subarray(28 + (i * 16), 36 + (i * 16)))) , sk_inv, maca_iv);

    // �u���b�N�f�[�^�̉���8�o�C�g����MAC�l���Z�o����(IV�͑O�i�̏�������)
    maca_iv = tripleDES_encoder(inverseByteString(setHexString(recieveData.subarray(36 + (i * 16), 44 + (i * 16)))) , sk_inv, maca_iv);

  }

  // �Z�o����MAC�l�ƃJ�[�h���瑗��ꂽMAC�l����v���邩�𔻒茋�ʂƂ��ĕԂ�
  return ( inverseByteString(maca_iv) == (setHexString(recieveData.subarray(28 + (blockNum * 16), 36 + (blockNum * 16) ))) );

}

// ���͂��ꂽ����3DES�Í������s���A�Í�����Ԃ��֐�
// �����A������я����x�N�g����16�i���̕�����ł��邱�Ƃ��O��
function tripleDES_encoder(pt, key, iv){

  // (���͌`����CryptoJS�̃t�H�[�}�b�g�ɕϊ�����B�܂��Í��������ʂ̐擪16�o�C�g���������̈Í����ƂȂ�)
  return CryptoJS.TripleDES.encrypt(CryptoJS.enc.Hex.parse(pt), CryptoJS.enc.Hex.parse(key), {iv: CryptoJS.enc.Hex.parse(iv) }).ciphertext.toString().slice(0,16);

}

function tripleDES_16b_encoder(pt, key, iv){

  // (���͌`����CryptoJS�̃t�H�[�}�b�g�ɕϊ�����B�܂��Í��������ʂ̐擪16�o�C�g���������̈Í����ƂȂ�)
  return CryptoJS.TripleDES.encrypt(CryptoJS.enc.Hex.parse(pt), CryptoJS.enc.Hex.parse(key), {iv: CryptoJS.enc.Hex.parse(iv) }).ciphertext.toString();

}

// ���͂ɑ΂���2�o�C�g���ɋ�؂���XOR���s���֐�
// ���͂͗����Ƃ�2�o�C�g�ȏ�̓��꒷��16�i��������ł��邱�Ƃ��O��
// javascript�ł͏����ł��錅���Ɍ��E������A������4�o�C�g�ȏゾ��2�̕␔�\���Ɣ��肳���̂ŋ�؂��ď�������
function xor_per_2bytes(input1, input2){

  // 2�o�C�g(4�r�b�g)���̃u���b�N�ɕ����ď������邽�߃u���b�N�������߂�
  var blockNum = input1.length / 4;

  // ���͂̒������قȂ�ꍇ��XOR�������ł��Ȃ����ߏI������
  if(blockNum != (input2.length / 4)){

    appendLog('ERROR : The inputs lengths are different.')

    return;

  }

  // input1��input2��2�o�C�g���Ƃɋ�؂���XOR�����߁A16�i���\�L�̕�����ɕϊ�����
  // �����������˂đO�ǂ݂���
  var result = (parseInt(input1.slice(0, 4), 16) ^ parseInt(input2.slice(0, 4), 16)).toString(16);

  // 4�o�C�g����XOR�������u���b�N���������J��Ԃ�result�ɘA�����Ă���
  for(var i = 1; i < blockNum; i++){

    result += (parseInt(input1.slice(i * 4, i * 4 + 4),16) ^ parseInt(input2.slice(i * 4, i * 4 + 4),16)).toString(16); 
  
  }

  // �[���p�f�B���O�������ʂ�Ԃ�(8�o�C�g����0������΃[���p�f�B���O�ɏ\���ƍl����)
  return (zero8Bytes + result).slice(-(input1.length));

}

// ���͂ɑ΂���1�o�C�g�P��(2��������)�ŏ��Ԃ����ւ���֐�
// RC-S380�ƃJ�[�h���ł̓G���f�B�A�����Ⴄ���ߕK�v�Ǝv����
function inverseByteString(inputString){

  // ���͂̕���������̏ꍇ�͐擪�Ƀ[���p�f�B���O����
  if(inputString.length % 2 != 0){

    appendLog('Odd!')

    inputString += "0";

  }

  // 1�o�C�g��(2��������)�ɓ���ւ��邽�ߒ���-2�̒l���擾����
  var index = inputString.length - 2;

  // �������ʂ̏����������˂đO�ǂ݂���
  var result = inputString.substr(index, 2);

  // 2���������͂Ƃ͋t����result�Ɋi�[���Ă���
  for(var i = 2; index  > i - 2; i = i + 2){

    result += inputString.substr(index - i , 2);
  
  }

  return result;

}

// ���߃f�[�^�z��ɑ΂��ăt���[���̃w�b�_�A�t�b�^�̔z���ǉ�����֐�
function setFrameArray(dataArray){

  //���߃p�P�b�g�̃w�b�_�̔z��ƁA���߃f�[�^�����i�[����z���ǉ��i�����ɂ͒ǉ������z����܂߂邽��+1����j
  dataArray = commandHeaderBuffer.concat([dataArray.length + 0x01]).concat(dataArray);

  //�w�b�_���܂߂����߃p�P�b�g�̃f�[�^�����i�[����z���ǉ�(�w�b�_�ƃf�[�^���̃t�H�[�}�b�g�͌Œ�)
  dataArray = prianbleBuffer.concat([dataArray.length, 0x00, (0xff - dataArray.length + 0x01)]).concat(dataArray);

  // �f�[�^���e��CRC���v�Z����dataArray�Ɋi�[
  dataArray = dataArray.concat([sumDataCRC(dataArray)]).concat([0x00]);

  return dataArray;

}

// ���͂����������1�o�C�g���̔z��ɕϊ����ĕԂ��֐�
// ���͂����������16�i���\�L�ł��邱�Ƃ��O��
function setArray(inputString){

  // �Ǝ�ID��USB�ʐM�p�ɂP�o�C�g���Ƃ̐��l�̔z��ɕϊ�����(�z��Ƃ��ď����������˂đO�ǂ�)
  var tempArray = [parseInt("0x" + inputString.substr(0 , 2))];

  for(var i = 2; i < inputString.length; i = i + 2){

    tempArray = tempArray.concat([parseInt("0x" + inputString.substr(i , 2))]);
  
  }

  return tempArray;

}

// ���͂��������̔z���1�Ȃ���16�i���\�L�̕�����ɕϊ����ĕԂ��֐�
// ���͂͐����̔z��ł��邱�Ƃ��O��
function setHexString(inputArray){

  // �z��̐�����16�i���\�L�̕�����ɕϊ����ă[���p�f�B���O����(�����������˂đO�ǂ�)
  var tempString = ("0"  + inputArray[0].toString(16)).slice(-2);

  for(var i = 1; i < inputArray.length; i++){

    tempString += ("00"  + inputArray[i].toString(16)).slice(-2);
  
  }

  return tempString;

}

// �f�[�^��CRC���v�Z����֐�
// �f�[�^�̍��v�l��CRC�̘a��0�ƂȂ�悤�Ɍv�Z����
function sumDataCRC(dataArray){

  // �f�[�^�̍��v�l���i�[����ϐ�
  var crcSum = 0;

  // �w�b�_�[�̂W�o�C�g���������f�[�^�̍��v�l���v�Z����
  for(var i = 8; i < dataArray.length; i++){

    crcSum = crcSum + dataArray[i];

  }

  // �f�[�^�̍��v�l�̂Q�̕␔��CRC�Ƃ��ĕԂ�
  return ~crcSum + 1; 

}

// �Q�̔z��̒����E�f�[�^�������ł����true�A�Ⴆ��false��Ԃ��֐�
// �������݃f�[�^�̊m�F�ɗp����
function isSameArray(array0, array1){

  if( array0.length != array1.length){

    return false;

  }

  for(var i = 0; i < array0.length; i ++){

    if(array0[i] != array1[i] ){
  
      return false;

    }

  }

  return true;

}