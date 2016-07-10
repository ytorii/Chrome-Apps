// �[���p�f�B���O��������ѕ����ŗp����8�o�C�g��(16��)�̕�����0
var zero8Bytes = "0000000000000000";

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
function calcAuthMAC_A(pt, key, rc, data){

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
  var blockNum = data.length / 32;

  for(var i = 0; i < blockNum; i++){

    // �u���b�N�f�[�^�̏��8�o�C�g����MAC�l���Z�o����(IV�͑O�i�̏�������)
    maca_iv = tripleDES_encoder(inverseByteString(data.substr( 0 + (i * 32), 16)) , sk_inv, maca_iv);

    // �u���b�N�f�[�^�̉���8�o�C�g����MAC�l���Z�o����(IV�͑O�i�̏�������)
    maca_iv = tripleDES_encoder(inverseByteString(data.substr(16 + (i * 32), 16)) , sk_inv, maca_iv);

  }

  // �Z�o����MAC�l�ƃJ�[�h���瑗��ꂽMAC�l����v���邩�𔻒茋�ʂƂ��ĕԂ�
  return inverseByteString(maca_iv);

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