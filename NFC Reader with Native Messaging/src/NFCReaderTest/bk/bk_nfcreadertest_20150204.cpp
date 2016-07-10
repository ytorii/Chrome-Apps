#include <iostream>
#include <iomanip>
using namespace std;
#include <string>
#include <sstream>
#include <windows.h>
#include <winscard.h>

void sendNativeMessage(string inProperty, string inData);
void onSCardError(string inProperty, string inErrorMessage, SCARDCONTEXT inSCardContext, SCARDHANDLE inSCardHandle);

int main(int argc, char* argv[]) {

	// ���\�[�X�}�l�[�W���̃n���h��
	SCARDCONTEXT sCardContext = NULL;
	// ���[�_�^���C�^�̃n���h��
	SCARDHANDLE	sCardHandle = NULL;
	// ���[�_�^���C�^�̖���
	LPTSTR readerName;
	// �ʐM�Ɏg�p����v���g�R��
	DWORD activeProtocol;

	DWORD dwAutoAllocate = SCARD_AUTOALLOCATE;

	//��������
	LONG RC = 0;

	// chrome�g���@�\�ɑ��M����json�f�[�^�̃v���p�e�B��
	string jsonProperty = "id";

	// ID�̒���
	int idLength = 0;

	// ���\�[�X�}�l�[�W���̃n���h�����擾
	RC = SCardEstablishContext( SCARD_SCOPE_USER, NULL, NULL, &sCardContext );
	if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "EstablishContext", sCardContext, sCardHandle);	return 1;}

	// ���[�_�^���C�^�̖��O���擾�i�ڑ�����Ă��郊�[�_�^���C�^��1�̑O��j
	RC = SCardListReaders( sCardContext, NULL, (LPTSTR)&readerName, &dwAutoAllocate );
	if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "ListReaders", sCardContext, sCardHandle);	return 1;}

	// ���[�_�^���C�^�̏����i�[����ϐ�
	SCARD_READERSTATE sReaderState;

	// ���[�_�^���C�^�̖��O���i�[
    sReaderState.szReader = readerName;
	// ���[�_�^���C�^�̏�Ԃ��i�[
    sReaderState.dwCurrentState = SCARD_STATE_UNAWARE;
    sReaderState.dwEventState = SCARD_STATE_UNAWARE;

	// ���[�_�^���C�^�̏�Ԃ��擾����
	RC = SCardGetStatusChange(sCardContext, 30, &sReaderState, 1);
	if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "GetStatusChange", sCardContext, sCardHandle);	return 1;}

	// �J�[�h�����[�_�^���C�^�ɂ�������Ă��Ȃ����Polling�̃��[�v�����ɓ���
	if((sReaderState.dwEventState & SCARD_STATE_PRESENT) != SCARD_STATE_PRESENT){

        // �J�[�h�����������܂ł��̃��[�v���J��Ԃ�
        do{

			RC = SCardGetStatusChange(sCardContext, 30, &sReaderState, 1);
			if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "GetStatusChange", sCardContext, sCardHandle);	return 1;}

			Sleep(100);

        } while((sReaderState.dwEventState & SCARD_STATE_PRESENT) == 0);

    }

	// �J�[�h�Ƃ̒ʐM���J�n����
	RC = SCardConnect( sCardContext, readerName, SCARD_SHARE_SHARED, SCARD_PROTOCOL_T0 | SCARD_PROTOCOL_T1, &sCardHandle, &activeProtocol );	
	//�����ŃG���[���������ꍇ�A�v���g�R�����Ή��s�̎�ނ̏ꍇ�̓G���[���b�Z�[�W��chrome�g���@�\�ɑ��M���ďI������
	if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "Connect", sCardContext, sCardHandle);return 1;}
	else if(activeProtocol == SCARD_PROTOCOL_UNDEFINED){onSCardError( jsonProperty, "UndefinedProtocol", sCardContext, sCardHandle);return 1;}

	// ATR(Answer To Reset)���擾���J�[�h��ʂ𔻒肷��
	DWORD readerLength = sizeof( readerName );
	DWORD state;
	DWORD atrLength;
	BYTE  atr[64];	//ATR

	RC = SCardStatus( sCardHandle, NULL, &readerLength, &state, &activeProtocol, NULL, &atrLength );
	if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "GetATR", sCardContext, sCardHandle);	return 1;}

	RC = SCardStatus( sCardHandle, readerName, &readerLength, &state, &activeProtocol, atr, &atrLength );
	if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "GetATR", sCardContext, sCardHandle);	return 1;}

	// �J�[�h�̎�ނ𔻒肵�Ď擾����ID�̒��������肷��
	if(atr[13] == 0x00){
		
		// FeliCa�EFeliCaLite-S�J�[�h�̏ꍇ��IDm�̒�����8�o�C�g
		if( atr[14] == 0x3b){

			idLength = 8;

		// Mifare 1K�E4K�EUltraLight�J�[�h�̏ꍇ��UID�̒�����8�o�C�g
		} else if(atr[14] == 0x01 || atr[14] == 0x02 || atr[14] == 0x03){

			idLength = 7;

		}

	// ��L�ȊO�̃T�|�[�g���Ă��Ȃ��J�[�h�̏ꍇ�̓G���[���b�Z�[�W��chrome�g���@�\�ɑ��M���ďI������
	} else { onSCardError( jsonProperty, "UnsupportedCard", sCardContext, sCardHandle);return 0;}

	// polling�R�}���h
	BYTE pollingCommand[] = {0xFF, 0xCA, 0x00, 0x00, 0x00}; 
	// ��M�f�[�^���i�[����o�b�t�@����уo�b�t�@�T�C�Y
	BYTE recieveBuffer[256 + 2/* SW1+SW2 */];	
	DWORD recieveBufferSize = sizeof(recieveBuffer);

	// �J�[�h�ɃR�}���h���M���ăf�[�^����M����
	RC = SCardTransmit( sCardHandle, SCARD_PCI_T1, pollingCommand, sizeof(pollingCommand), NULL, recieveBuffer, &recieveBufferSize );
	if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "TransmitCommand", sCardContext, sCardHandle);	return 1;}

	// �J�[�h�Ƃ̒ʐM��ؒf
	SCardDisconnect( sCardHandle, SCARD_LEAVE_CARD );

	// ���\�[�X�}�l�[�W���̃n���h�������
	SCardReleaseContext( sCardContext );

	// ID���i�[����stringstream
	std::stringstream idstream;

	for(int i = 0; i < idLength; i++){

		idstream << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(recieveBuffer[i]);

	}

	::sendNativeMessage(jsonProperty, idstream.str());

	return 0;

}

void onSCardError(string inProperty, string inErrorMessage, SCARDCONTEXT inSCardContext, SCARDHANDLE inSCardHandle){

	string errorMesage =  "Error occured : ";

	errorMesage.append(inErrorMessage);

	// ���[�_�Ƃ̒ʐM��ؒf����
	SCardDisconnect(inSCardHandle, SCARD_LEAVE_CARD);
	// ���\�[�X�}�l�[�W���̃n���h�������
	SCardReleaseContext( inSCardContext );

	::sendNativeMessage(inProperty, errorMesage);

}

void sendNativeMessage(string inProperty, string inMessage){

	// ���M���b�Z�[�W��json�`���ɕϊ�����
    std::string jsonString = "{\"";
	jsonString.append(inProperty).append("\": \"").append(inMessage).append( "\"}");
   
	// ���M���b�Z�[�W�̒������擾����
    unsigned int dataLength = jsonString.length();

    //���M���b�Z�[�W�̒�����4�o�C�g�̐����ŏo�͂���
    std::cout 
        << char(((dataLength >> 0) & 0xFF))
        << char(((dataLength >> 8) & 0xFF))
        << char(((dataLength >> 16) & 0xFF))
        << char(((dataLength >> 24) & 0xFF));

	// json�`���̑��M���b�Z�[�W���o��
	std::cout << jsonString;

}