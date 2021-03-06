#include <iostream>
#include <iomanip>
using namespace std;
#include <string>
#include <sstream>
#include <windows.h>
#include <winscard.h>

string recieveNativeMessage();

// inProperty：送信するデータのプロパティ名
// inResult：処理結果コード(0:IDを取得 1:カード未検出 2:異常終了)
// inData：送信するデータ内容
void sendNativeMessage(string inProperty, string inResult, string inData);

void onSCardError(string inProperty, string inErrorMessage, SCARDCONTEXT inSCardContext, SCARDHANDLE inSCardHandle);

int main(int argc, char* argv[]) {

	//処理結果
	LONG RC = 0;

	// リソースマネージャのハンドル
	SCARDCONTEXT sCardContext = NULL;
	// リーダ／ライタのハンドル
	SCARDHANDLE	sCardHandle = NULL;
	// リーダ／ライタの名称
	LPTSTR readerName;
	// 通信に使用するプロトコル
	DWORD activeProtocol;

	DWORD dwAutoAllocate = SCARD_AUTOALLOCATE;

	// chrome拡張機能に送信するjsonデータのプロパティとメッセージ
	string jsonProperty = "id";
	string jsonString = "";

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

	// chrome拡張機能から標準入力によるメッセージを待ち受ける
	// recieveNativeMessage関数の結果が空の場合はchrome拡張機能が終了したと判断する
//	while(!(jsonString = recieveNativeMessage()).empty()){

//		if(jsonString.substr(9,5).compare("getId") == 0){
		if(true){

			// リーダ／ライタの状態を取得する
			RC = SCardGetStatusChange(sCardContext, 30, &sReaderState, 1);
			if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "GetStatusChange", sCardContext, sCardHandle);	return 1;}

			// カードがリーダ／ライタにかざされていれば接続処理を開始する
			if((sReaderState.dwEventState & SCARD_STATE_PRESENT) == SCARD_STATE_PRESENT){

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

//						idLength = 8;
						idLength = 18;

					// Mifare 1K・4K・UltraLightカードの場合はUIDの長さが7バイト
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

				// サービス指定コマンド
				BYTE selectCommand[] = {0xFF, 0xA4, 0x00, 0x01, 0x02, 0x0b00, 00}; 

				// カードにコマンド送信してデータを受信する
				RC = SCardTransmit( sCardHandle, SCARD_PCI_T1, selectCommand, sizeof(selectCommand), NULL, recieveBuffer, &recieveBufferSize );
				if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "TransmitCommand", sCardContext, sCardHandle);	return 1;}

				// readコマンド
				BYTE readCommand[] = {0xFF, 0xB0, 0x80, 0x01, 0x02, 0x8000, 00}; 

				// カードにコマンド送信してデータを受信する
				RC = SCardTransmit( sCardHandle, SCARD_PCI_T1, readCommand, sizeof(readCommand), NULL, recieveBuffer, &recieveBufferSize );
				if(RC != SCARD_S_SUCCESS){onSCardError( jsonProperty, "TransmitCommand", sCardContext, sCardHandle);	return 1;}


				// IDを格納するstringstream
				std::stringstream idstream;

				for(int i = 0; i < idLength; i++){

					idstream << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(recieveBuffer[i]);

				}

				::sendNativeMessage(jsonProperty, "0", idstream.str());

				// カードとの通信を切断
				SCardDisconnect( sCardHandle, SCARD_LEAVE_CARD );

//				break;


			} else {
		
				::sendNativeMessage(jsonProperty, "1", "NoCardFound");
	
			}

		} else if(jsonString.substr(9,5).compare("close") == 0){
		
//			break;
		
		}


//	}

	// リソースマネージャのハンドルを解放
	SCardReleaseContext( sCardContext );

	return RC;

}

void onSCardError(string inProperty, string inErrorMessage, SCARDCONTEXT inSCardContext, SCARDHANDLE inSCardHandle){

	string errorMesage =  "Error occured : ";

	errorMesage.append(inErrorMessage);

	// リーダとの通信を切断する
	SCardDisconnect(inSCardHandle, SCARD_LEAVE_CARD);
	// リソースマネージャのハンドルを解放
	SCardReleaseContext( inSCardContext );

	::sendNativeMessage(inProperty, "2", errorMesage);

}

string recieveNativeMessage(){

	//メッセージ長
	unsigned int jsonLength = 0;

	//JSON形式のメッセージ
	string jsonMessage = "";

	// 先頭4バイトからメッセージの長さを取得する
	jsonLength = getchar();

	// 先頭1バイト目がEOF(-1)の場合はchrome拡張機能側が終了した時はからのメッセージを返す
	if(jsonLength == EOF){

		return jsonMessage;

	}

	for (int i = 0; i < 3; i++){

		jsonLength += getchar();

	}


	//取得した長さのjson形式のメッセージをjsonStringに格納する
	for (int i = 0; i < jsonLength; i++){

		jsonMessage += getchar();

	}

	return jsonMessage;

};

void sendNativeMessage(string inProperty, string inResult, string inMessage){

	// 送信メッセージをjson形式に変換する
    std::string jsonString = "{\"result\": \"";
	jsonString.append(inResult).append( "\", \"");
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