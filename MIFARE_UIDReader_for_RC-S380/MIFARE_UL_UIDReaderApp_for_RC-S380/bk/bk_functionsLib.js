// RC-S380��ID���(�Ɩ��p�ƌl�p�Ńv���_�N�gID���قȂ�)
var vendorId  = 0x054c;
var productId = 0x06c1;
var productIdP = 0x06c3;

// Felica�J�[�hIDm�̑��M���Chrome�g���@�\��ID
var whitelistedIds = "pgdohmilnbahhkhodcmnhpdoolfdmhip";

// �R���\�[���Ƀ��O���o�͂���K�v������ꍇ��1�Ƃ���t���O
var debug = 1;

// USB�Ƃ̒ʐM��������������1�Ƃ���t���O
var isOpen = 0;

// Felica�J�[�h�ւ�polling�̎��s�Ԋu���~���b�Őݒ�
var pollingInterval = 500;

// RC-S380����̎�M�p�P�b�g�̐ݒ���(�S��M�p�P�b�g�ŋ���)
var commandRecieveInfo = { direction : 'in', endpoint : 0x01, length : 128 };

// RC-S380�ւ̒ʐM���̃v���A���u��
var prianbleBuffer = [0x00, 0x00, 0xff, 0xff, 0xff];	

// �ȉ��ARC-S380�ɑ��M���閽�߃p�P�b�g���i�[����ArrayBuffer
// �ʐM���ɕK�������f�[�^�ƂȂ���̂̓w�b�_����CRC�܂ŌŒ�l�Ƃ��Ďg�p����

// RC-S380�ɓ�����Port-100�`�b�v�̃R�}���h�^�C�v���擾���閽��
var getCommandBuffer         = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x02, 0x00, 0xfe, 0xd6, 0x28, 0x02, 0x00]);       

// RC-S380�ɓ�����Port-100�`�b�v�̃R�}���h�^�C�v���P�ɐݒ肷�閽��
var setCommandBuffer         = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x2a, 0x01, 0xff, 0x00]);

// �J�[�h�Ƃ̒ʐM���x��106kbps�A�J�[�h�^�C�v�͂`���w�肷�閽��
var setRFBuffer              = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x00, 0x02, 0x03, 0x0f, 0x03, 0x13, 0x00]);

// �ʐM�v���g�R���ݒ�l���A���ڔԍ��E�ݒ�l�̏��Ɏw�肷�閽��
// �J�[�h�^�C�v�`�̐ݒ�l
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

// REQA����
var reqaCommandBuffer        = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x05, 0x00, 0xfb, 0xd6, 0x04, 0x1e, 0x00, 0x26, 0xe2, 0x00]);

// WUPA����
var wupaCommandBuffer        = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x05, 0x00, 0xfb, 0xd6, 0x04, 0x64, 0x00, 0x52, 0x70, 0x00]);

// cascade level1 anticollision����
var lv1AnticolCommandBuffer  = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x04, 0xf4, 0x01, 0x93, 0x20, 0x7e, 0x00]);

// cascade level2 anticollision����
var lv2AnticolCommandBuffer  = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x04, 0xf4, 0x01, 0x95, 0x20, 0x7c, 0x00]);

// �A�h���X0x00�ւ�Read����
var readAdr00CommmandBuffer  = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x04, 0x32, 0x00, 0x30, 0x00, 0xc4, 0x00]);

// cascade level1 select���ߕ����̂�
var lv1SelectCommand         = [0xd6, 0x04, 0x64, 0x00, 0x93, 0x70, 0x88];
var lv1SelectCommandBuffer   = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x0b, 0x00, 0xf5, 0xd6, 0x04, 0x64, 0x00, 0x93, 0x70, 0x88, 0x04, 0x1d, 0xa7, 0x36, 0x39, 0x00]);

// cascade level2 select���ߕ����̂�
var lv2SelectCommand         = [0xd6, 0x04, 0x64, 0x00, 0x95, 0x70];

var swtRFBuffer           = new Uint8Array([0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x06, 0x00, 0x24, 0x00]);

// RC-S380�ɖ��߃p�P�b�g�𑗐M���Aack����уf�[�^�p�P�b�g����M����֐�
// jQuery��Deferred�I�u�W�F�N�g�𗘗p����RC-S380�Ƃ̔񓯊��ʐM�𐧌䂷��
function send_recieve_packet_RCS380(handle, data){

	// Deferred�I�u�W�F�N�g�𐶐�����
	var deferred_snd_rcv = $.Deferred();

	// isOpen�t���O���P�̎��̂ݎ��s����(extension�������polling��~�v���̎�M��͎��s���Ȃ�����)
	if(isOpen){

		// RC-S380�ւ̃f�[�^�p�P�b�g���M����������������ack�p�P�b�g��M�������s��
		send_packet_RCS380(handle, data).then(function(){

			// RC-S380�ւ�ack�p�P�b�g��M����������������f�[�^��M�������s��
			recieve_packet_RCS380(handle).then(function(){

				appendLog('recieved ack packet');

				// RC-S380�ւ̃f�[�^�p�P�b�g��M����������������Deferred�I�u�W�F�N�g�̏�Ԃ𐬌���Ԃɐݒ肷��
				recieve_packet_RCS380(handle).then(function(recieveData){

					appendLog('recieved data packet');

					deferred_snd_rcv.resolve(recieveData);

				// RC-S380�ւ̃f�[�^�p�P�b�g��M���������s������Deferred�I�u�W�F�N�g�̏�Ԃ𐬌���Ԃɐݒ肷��
				}, function(){deferred_snd_rcv.reject();});

			// RC-S380�ւ�ack�p�P�b�g��M���������s������Deferred�I�u�W�F�N�g�̏�Ԃ𐬌���Ԃɐݒ肷��
			}, function(){deferred_snd_rcv.reject();});

		// RC-S380�ւ̃f�[�^�p�P�b�g���M���������s������Deferred�I�u�W�F�N�g�̏�Ԃ𐬌���Ԃɐݒ肷��
		}, function(){deferred_snd_rcv.reject();});

	}

	// ��Ԃ��������Deferred�I�u�W�F�N�g��Ԃ��i�ʐM������ɏ�Ԃ����肷��j
	return deferred_snd_rcv.promise();

}

// RC-S380�ɖ��߃p�P�b�g�𑗐M����֐�
// jQuery��Deferred�I�u�W�F�N�g�𗘗p����RC-S380�Ƃ̔񓯊��ʐM�𐧌䂷��
function send_packet_RCS380(handle, data){

	// Deferred�I�u�W�F�N�g�𐶐�����
	var deferred_snd = $.Deferred();

	// �ʐM�����A���M��G���h�|�C���g�A���M���e��ݒ肷��
	var commandSendInfo = { direction : 'out', endpoint : 0x02, data : data.buffer };

	// isOpen�t���O���P�̎��̂ݎ��s����(extension�������polling��~�v���̎�M��͎��s���Ȃ�����)
	if(isOpen){

		// ChromeApp��USB�ʐM�@�\�𗘗p���ăp�P�b�g�𑗐M����
		chrome.usb.bulkTransfer(handle, commandSendInfo, function (info) {

			// ���ʃR�[�h��0�Ŗ�����ΒʐM���ُ�I������
			if (info.resultCode !== 0) {

				// ���O�Ɍ��ʃR�[�h���o�͂���
				appendLog('failed sending packet... result code was:' + info.resultCode);
						
				// Deferred�I�u�W�F�N�g�̏�Ԃ����s�ɐݒ肷��
				deferred_snd.reject();

			// ���ʃR�[�h��0�Ȃ�ʐM������I������
			} else {

				// ���O�ɐ������b�Z�[�W���o�͂���
				appendLog('successed sending packet');

				// Deferred�I�u�W�F�N�g�̏�Ԃ𐬌��ɐݒ肷��
				deferred_snd.resolve();

			}	

		});
	}

	// ��Ԃ��������Deferred�I�u�W�F�N�g��Ԃ��i�ʐM������ɏ�Ԃ����肷��j
	return deferred_snd.promise();

}

// RC-S380����f�[�^�p�P�b�g����M����֐�
// jQuery��Deferred�I�u�W�F�N�g�𗘗p����RC-S380�Ƃ̔񓯊��ʐM�𐧌䂷��
function recieve_packet_RCS380(handle){

	// Deferred�I�u�W�F�N�g�𐶐�����
	var deferred_rcv = $.Deferred();

	// isOpen�t���O���P�̎��̂ݎ��s����(extension�������polling��~�v���̎�M��͎��s���Ȃ�����)
	if(isOpen){

		// ChromeApp��USB�ʐM�@�\�𗘗p���ăp�P�b�g����M����
		chrome.usb.bulkTransfer(handle, commandRecieveInfo, function (info) {
			
			// ���ʃR�[�h��0�Ŗ�����Έُ�I������
			if (info.resultCode !== 0) {
	
				// ���O�Ɍ��ʃR�[�h���o�͂���
				appendLog('packet recieve failed : ' + info.resultCode);

				// Deferred�I�u�W�F�N�g�̏�Ԃ����s�ɐݒ肷��
				deferred_rcv.reject();

			// ���ʃR�[�h��0�Ȃ�ʐM������I������
			} else {

				// ��M�����f�[�^���㑱�̏����ɘA�g���邽�߂̕ϐ��Ɋi�[����
				var recieveData = new Uint8Array(info.data);

				// Deferred�I�u�W�F�N�g�̏�Ԃ𐬌��ɐݒ肵�A�㑱�����Ɏ�M�f�[�^��A�g����
				deferred_rcv.resolve(recieveData);

			}	

		});

	}

	// ��Ԃ��������Deferred�I�u�W�F�N�g��Ԃ��i�ʐM������ɏ�Ԃ����肷��j
	return deferred_rcv.promise();

}

// RC-S380��USB�f�o�C�X�Ƃ��Đڑ����m����A�ʐM�ݒ���s���֐�
// jQuery��Deferred�I�u�W�F�N�g�𗘗p����RC-S380�Ƃ̔񓯊��ʐM�𐧌䂷��
function openConnection(){

 	// Deferred�I�u�W�F�N�g�𐶐�����
	var deferred_openConnection = $.Deferred();


	// RC-S380���Ɩ��p���l�p�����m�F����i�n�߂ɋƖ��p�̃f�o�C�X�����邩�m�F�j
	chrome.usb.getDevices({"vendorId": vendorId, "productId": productId},function(devices){

		// �Ɩ��p�̃f�o�C�X���Ȃ���Όl�p�̃f�o�C�X�̃v���_�N�gID�ɐ؂�ւ���
		if(devices.length == 0){

			productId = productIdP;
		
		}

		// RC-S380�ւ̐ڑ������݂�
		chrome.usb.findDevices({"vendorId": vendorId, "productId": productId}, function(handles) {
		
			// �R�l�N�V�������擾�ł��Ȃ������ꍇ��RC-S380���ڑ�����Ă��Ȃ��Ɣ��f����
			if (handles.length == 0) {

				appendLog('No RC-S380 found...');

				// extension��RC-S380���ڑ�����Ă��Ȃ��|�̃��b�Z�[�W
				var errorMessage = "The device is not connected or already used.";

				// Deferred�I�u�W�F�N�g�̏�Ԃ����s�ɐݒ肷��
				deferred_openConnection.reject(errorMessage);
	
				return;

			}
    
			appendLog('find Devices');

			// �R�l�N�V������ϐ�handle�Ɋi�[���Č㏈���ł��g�p����
			var handle = handles[0];

			// RC-S380�Ɛڑ�����handle���擾�ł�����isOpen�t���O��1�ɐݒ�
   			isOpen = 1;

			// �f�o�C�X�̏�Ԃ���x���Z�b�g���Ă���ʐM���J�n����
			chrome.usb.resetDevice(handle, function (result) {

				appendLog('reset Device');

				// �C���^�[�t�F�[�X���擾���ĒʐM�\�ȏ�Ԃɂ���
				chrome.usb.claimInterface(handle, 0, function () {				

					appendLog('claim Interface');				

					// Port-100�`�b�v�̃R�}���h�^�C�v���擾���閽��
					//(���݂͌��ߑł��ŃR�}���h�^�C�v���P�Ɏw��)
			       		//send_recieve_packet_RCS380(handle, getCommandBuffer).then(function(){

					// Port-100�`�b�v�̃R�}���h�^�C�v��ݒ肷�閽��
			       		send_recieve_packet_RCS380(handle, setCommandBuffer).then(function(){

						// Port-100�`�b�v��Felica�J�[�h�Ƃ̒ʐM���x����уJ�[�h�^�C�v���w�肷�閽��
			       			send_recieve_packet_RCS380(handle, setRFBuffer).then(function(){

							// �ʐM�Ώۂ̃J�[�h�^�C�v�̒ʐM�v���g�R����ݒ肷�閽��
			       				send_recieve_packet_RCS380(handle, setProtocolBuffer).then(function(){

							// Deferred�I�u�W�F�N�g�̏�Ԃ𐬌��ɐݒ肷��
							deferred_openConnection.resolve(handle);

							// RC-S380�ւ̊e���߂̎��s�����s�����ꍇ�͂��̎��_�ŏI������
		       					}, function(){closeConnection(handle).done(function(){return;});});
	
						 }, function(){closeConnection(handle).done(function(){return;});});
				
	       				}, function(){closeConnection(handle).done(function(){return;});});
				
	       				//}, function(){closeConnection(handle).done(function(){return;});});
	
				});

			});

		});

	});

	// ��Ԃ��������Deferred�I�u�W�F�N�g��Ԃ��i�ʐM������ɏ�Ԃ����肷��j
	return deferred_openConnection.promise();

}

// RC-S380�Ƃ̐ڑ���ؒf����֐�
// jQuery��Deferred�I�u�W�F�N�g�𗘗p����RC-S380�Ƃ̔񓯊��ʐM�𐧌䂷��
function closeConnection(handle){

 	// Deferred�I�u�W�F�N�g�𐶐�����
	var deferred_closeConnection = $.Deferred();

	if(isOpen = 1){

	    	// isOpen�t���O��0�ɂ��Ĉȍ~��RC-S380�Ƃ̒ʐM�������s��Ȃ��悤�ɂ���
		isOpen = 0;

		// �C���^�[�t�F�[�X���J��
		chrome.usb.releaseInterface(handle, 0, function(){
	
			appendLog("released Interface");			
	
			// �f�o�C�X�Ƃ̐ڑ���ؒf����
			chrome.usb.closeDevice(handle, function(){
			
				appendLog("closed Device");

				// handle���������i��������Ȃ��ƕ����񏈗������Ƃ��ɃG���[�ɂȂ�j
				handle = 0;			

				// Deferred�I�u�W�F�N�g�̏�Ԃ𐬌��ɐݒ肷��
        			deferred_closeConnection.resolve();

			});

		});

	}

	return deferred_closeConnection.promise();

}

// �R���\�[���Ƀ��O���o�͂���֐�
var appendLog = function(message) {

    if(debug){

	console.log(message);

    }

 };

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