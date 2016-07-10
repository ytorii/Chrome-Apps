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

	// リソースマネージャのハンドル
	SCARDCONTEXT sCardContext = NULL;
	// リーダ／ライタのハンドル
	SCARDHANDLE	sCardHandle = NULL;
	// リーダ／ライタの名称
	LPTSTR readerName;
	// 通信に使用するプロトコル
	DWORD activeProtocol;

	DWORD dwAutoAllocate = SCARD_AUTOALLOCATE;

	//処理結果
	LONG RC = 0;

	// chrome拡張機能に送信するjsonデータのプロパティ名
	string jsonProperty = "id";

	// IDの長さ
	int idLength = 0;

	// リソースマネージャのハンドルを取得
	RC = SCardEstablishContext( SCARD_SCOPE_USER, NULL, NULL, &sCardContext );
	if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "EstablishContext", sCardContext, sCardHandle);	return 1;}

	// リーダ／ライタの名前を取得（接続されているリーダ／ライタは1個の前提）
	RC = SCardListReaders( sCardContext, NULL, (LPTSTR)&readerName, &dwAutoAllocate );
	if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "ListReaders", sCardContext, sCardHandle);	return 1;}

	// リーダ／ライタの情報を格納する変数
	SCARD_READERSTATE sReaderState;

	// リーダ／ライタの名前を格納
    sReaderState.szReader = readerName;
	// リーダ／ライタの状態を格納
    sReaderState.dwCurrentState = SCARD_STATE_UNAWARE;
    sReaderState.dwEventState = SCARD_STATE_UNAWARE;

	// リーダ／ライタの状態を取得する
	RC = SCardGetStatusChange(sCardContext, 30, &sReaderState, 1);
	if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "GetStatusChange", sCardContext, sCardHandle);	return 1;}

	// カードがリーダ／ライタにかざされていなければPollingのループ処理に入る
	if((sReaderState.dwEventState & SCARD_STATE_PRESENT) != SCARD_STATE_PRESENT){

        // カードがかざされるまでこのループを繰り返す
        do{

			RC = SCardGetStatusChange(sCardContext, 30, &sReaderState, 1);
			if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "GetStatusChange", sCardContext, sCardHandle);	return 1;}

			Sleep(100);

        } while((sReaderState.dwEventState & SCARD_STATE_PRESENT) == 0);

    }

	// カードとの通信を開始する
	RC = SCardConnect( sCardContext, readerName, SCARD_SHARE_SHARED, SCARD_PROTOCOL_T0 | SCARD_PROTOCOL_T1, &sCardHandle, &activeProtocol );	
	//処理でエラーがあった場合、プロトコルが対応不可の種類の場合はエラーメッセージをchrome拡張機能に送信して終了する
	if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "Connect", sCardContext, sCardHandle);return 1;}
	else if(activeProtocol == SCARD_PROTOCOL_UNDEFINED){onSCardError( jsonProperty, "UndefinedProtocol", sCardContext, sCardHandle);return 1;}

	// ATR(Answer To Reset)を取得しカード種別を判定する
	DWORD readerLength = sizeof( readerName );
	DWORD state;
	DWORD atrLength;
	BYTE  atr[64];	//ATR

	RC = SCardStatus( sCardHandle, NULL, &readerLength, &state, &activeProtocol, NULL, &atrLength );
	if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "GetATR", sCardContext, sCardHandle);	return 1;}

	RC = SCardStatus( sCardHandle, readerName, &readerLength, &state, &activeProtocol, atr, &atrLength );
	if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "GetATR", sCardContext, sCardHandle);	return 1;}

	// カードの種類を判定して取得するIDの長さを決定する
	if(atr[13] == 0x00){
		
		// FeliCa・FeliCaLite-Sカードの場合はIDmの長さが8バイト
		if( atr[14] == 0x3b){

			idLength = 8;

		// Mifare 1K・4K・UltraLightカードの場合はUIDの長さが8バイト
		} else if(atr[14] == 0x01 || atr[14] == 0x02 || atr[14] == 0x03){

			idLength = 7;

		}

	// 上記以外のサポートしていないカードの場合はエラーメッセージをchrome拡張機能に送信して終了する
	} else { onSCardError( jsonProperty, "UnsupportedCard", sCardContext, sCardHandle);return 0;}

	// pollingコマンド
	BYTE pollingCommand[] = {0xFF, 0xCA, 0x00, 0x00, 0x00}; 
	// 受信データを格納するバッファおよびバッファサイズ
	BYTE recieveBuffer[256 + 2/* SW1+SW2 */];	
	DWORD recieveBufferSize = sizeof(recieveBuffer);

	// カードにコマンド送信してデータを受信する
	RC = SCardTransmit( sCardHandle, SCARD_PCI_T1, pollingCommand, sizeof(pollingCommand), NULL, recieveBuffer, &recieveBufferSize );
	if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "TransmitCommand", sCardContext, sCardHandle);	return 1;}

	// カードとの通信を切断
	SCardDisconnect( sCardHandle, SCARD_LEAVE_CARD );

	// リソースマネージャのハンドルを解放
	SCardReleaseContext( sCardContext );

	// IDを格納するstringstream
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

	// リーダとの通信を切断する
	SCardDisconnect(inSCardHandle, SCARD_LEAVE_CARD);
	// リソースマネージャのハンドルを解放
	SCardReleaseContext( inSCardContext );

	::sendNativeMessage(inProperty, errorMesage);

}

void sendNativeMessage(string inProperty, string inMessage){

	// 送信メッセージをjson形式に変換する
    std::string jsonString = "{\"";
	jsonString.append(inProperty).append("\": \"").append(inMessage).append( "\"}");
   
	// 送信メッセージの長さを取得する
    unsigned int dataLength = jsonString.length();

    //送信メッセージの長さを4バイトの数字で出力する
    std::cout 
        << char(((dataLength >> 0) & 0xFF))
        << char(((dataLength >> 8) & 0xFF))
        << char(((dataLength >> 16) & 0xFF))
        << char(((dataLength >> 24) & 0xFF));

	// json形式の送信メッセージを出力
	std::cout << jsonString;

}