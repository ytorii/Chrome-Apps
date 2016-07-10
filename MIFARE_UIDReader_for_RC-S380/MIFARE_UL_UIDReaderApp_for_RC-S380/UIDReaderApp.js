// MIFARE Ultralight UID Reader for RC-S380 (c) 2015 by Yosuke Torii. All rights reserved.

// polling���s�v���̑��M��ID���i�[����ϐ�
var sendId = 0; 

// �A�v���P�[�V�����N�����Ɏ��s���鏈��
$(function(){

  // RC-S380�Ƃ̃R�l�N�V�������i�[����ϐ�
  var connectionHandle = 0; 

  // polling���s���̃^�C�}�[���i�[����ϐ�
  var timer = 0; 
 
  // extension�������pageLoad���b�Z�[�W����M�����ꍇ��polling���J�n����C�x���g���X�i�[
  // �ipageLoad���b�Z�[�W��polling�����s�Ώۂ̃y�[�W���ǂݍ��܂ꂽ�ۂɑ��M�����j
  chrome.runtime.onMessageExternal.addListener(

	function(request, sender, sendResponse) {

		// startPolling���b�Z�[�W����M�����珈���J�n
		if (request.startMifarePolling) {

			// polling���s�v���̑��M��ID���擾	
			sendId = sender.id;

			appendLog('getIDrequest from : ' +  sender.id);

			// RC-S380�Ƃ̐ڑ��J�n���������s���A���������RC-S380�Ƃ̒ʐM�ݒ菈���Ɉڂ�
			openConnection().then(function(handle){
											
				// �擾�����ڑ�����ڑ����~���Ɏg���ϐ��Ɋi�[(���̊֐��̃X�R�[�v�O�Ŏg�p���邽��)
				connectionHandle = handle;

				// polling�����Ԋu�Ŏ��s����^�C�}�[��ݒ肷��
				timer = setInterval(function(){get_UID_RCS380(connectionHandle, reqaCommandBuffer, timer)}, pollingInterval);

				// polling�����s����(�^�C�}�[�͈��Ԋu��ɂ����ŏ��̏������J�n���Ȃ��̂Ő悸1����s����)
				get_UID_RCS380(connectionHandle, reqaCommandBuffer, timer);

				// extension��polling�J�n���b�Z�[�W��ԐM����
				sendResponse({"result":"App starts polling to get UID"});

				// extension����polling���J�n�������Ƃ����b�Z�[�W�Œʒm�iextension����polling�̏�Ԃ��Ǘ����邽�߁j
				chrome.runtime.sendMessage(sendId, {pollingStart: "true"}, function(response){});								
										
			});

		 // polling�v�����s����extension�����pageChange���b�Z�[�W����M�����ہApolling���ł���ꍇ�͒��~����
    		} else if(sender.id == sendId && request.pageChange && timer){

			appendLog('page Changed');

 		   	// isOpen�t���O��0�ɂ��Ĉȍ~��RC-S380�Ƃ̒ʐM�������s��Ȃ��悤�ɂ���
			isOpen = 0;

		    	// polling�����s����^�C�}�[����������я���������
			clearInterval(timer);
			timer = 0;

			appendLog('stopped Polling');

			// RC-S380�Ƃ̐ڑ���ؒf����
			closeConnection(connectionHandle).done(function(){

				// connectionHandle��������(��������Ȃ��Ƒ��̃C�x���g���X�i�[�Ƌ�������������)
				connectionHandle = 0;

				return;
			
			});

 		// �f�o�C�X���g�p���̏ꍇ�͏I������
 		}  else {

        		return;

    		}

	 }

    );

});

// RC-S380��polling�����s���A�ߑ������J�[�h��IDm����M����֐�
// jQuery��Deferred�I�u�W�F�N�g�𗘗p����RC-S380�Ƃ̔񓯊��ʐM�𐧌䂷��
function get_UID_RCS380(handle, data, timer){

	// REQA�R�}���h�𑗐M����
	send_recieve_packet_RCS380(handle, data).then(function(response){

		// ���X�|���X����19�Ń��X�|���X�R�[�h����������΃J�[�h��ߑ������Ɣ���
		if(response.length == 19 && response[15] == 0x44){

			appendLog('MIFARE card detected.');

		    	// polling�����s����^�C�}�[����������я���������
			clearInterval(timer);
			timer = 0;

			// read���߂����s���邽�߂̃v���g�R���ݒ�ɕύX����
			send_recieve_packet_RCS380(handle, setProtocolBuffer_read00).then(function(response){

				// UID���擾���邽�߁A�A�h���X0x00����ǂݎ��R�}���h�𑗐M����
				send_recieve_packet_RCS380(handle, readAdr00CommmandBuffer).then(function(response){

					// ���X�|���X����33�Ń��X�|���X�̐擪�l�����������(8�Ȃ��)UID����M�ł����Ɣ���
					if(response.length == 33 && response[14] == 0x08){

						appendLog('Recieved MIFARE Ultralight UID.');

						// �ǂݎ����UID���i�[����ϐ�
						var UIDHexString = "";
					
						// ��M�f�[�^����IDm�̑O���������i�[����Ă���16�Ԗڂ���18�Ԗڂ̔z��̃f�[�^�𔲂��o��
						for(var i = 15; i < 18; i++){

							// extension�ւ̘A�g�p�Ƀf�[�^��16�i���̕\�L�ɒ����A���ԂɃ[���p�f�B���O����UIDHexString�Ɋi�[����
							UIDHexString = UIDHexString + ("0" + response[i].toString(16)).slice(-2);

						}

						// ��M�f�[�^����IDm�̌㔼�������i�[����Ă���20�Ԗڂ���23�Ԗڂ̔z��̃f�[�^�𔲂��o��
						for(var i = 19; i < 23; i++){

							// extension�ւ̘A�g�p�Ƀf�[�^��16�i���̕\�L�ɒ����A���ԂɃ[���p�f�B���O����UIDHexString�Ɋi�[����
							UIDHexString = UIDHexString + ("0" + response[i].toString(16)).slice(-2);

						}
	
						// IDm���擾�����̂ŁA�ȍ~�̒ʐM�͒�~����
						isOpen = 0;

						appendLog("sending MIFARE Ultralight UID to " + sendId);

						// UIDHexString�Ɋi�[����IDm��extension�ɑ��M����
						chrome.runtime.sendMessage(sendId, {MifareulUID: UIDHexString}, function(response){

							// extension�����IDm��M�������b�Z�[�W����M�����ꍇ
							if(response.success){

								appendLog("successed sending MIFARE Ultralight UID");

								// RC-S380�Ƃ̐ڑ���ؒf���ď������I������
								closeConnection(handle).done(function(){return;});

							}

						});

					// �ǂݎ��Ɏ��s�����ꍇ�͍Ăу^�C�}�[���Z�b�g����REQA���߂����蒼��
					} else {

						// �v���g�R�������ɖ߂�
						send_recieve_packet_RCS380(handle, setProtocolBuffer_typeA).then(function(response){

							// polling�����Ԋu�Ŏ��s����^�C�}�[��ݒ肷
							// �J�[�h��HALT�X�e�[�g�Ȃ̂�WUPA�R�}���h�����s����
							timer = setInterval(function(){get_UID_RCS380(handle, wupaCommandBuffer, timer)}, pollingInterval);

						// ���߃p�P�b�g���M�����̎��s���͂��̎��_�ŏ������I��
						}, function(){closeConnection(handle).done(function(){return;});});

					}

				// ���߃p�P�b�g���M�����̎��s���͂��̎��_�ŏ������I��
				}, function(){closeConnection(handle).done(function(){return;});});

			// ���߃p�P�b�g���M�����̎��s���͂��̎��_�ŏ������I��
			}, function(){closeConnection(handle).done(function(){return;});});

		// �f�[�^�p�P�b�g�̒�����6�ł����ack�p�P�b�g����M�����Ɣ��f����
		// (���̔�����s��Ȃ��ƁARC-S380����̎�M�p�P�b�g�����ꂽ�ꍇ�ɐ���p�^�[���ɖ߂�Ȃ�)
		} else if(response.length == 6){

			recieve_packet_RCS380(handle).done(function(){

				appendLog('ack packet recieved');

			});

		}

	// ���߃p�P�b�g���M�����̎��s���͂��̎��_�ŏ������I��
	}, function(){closeConnection(handle).done(function(){return;});});

}