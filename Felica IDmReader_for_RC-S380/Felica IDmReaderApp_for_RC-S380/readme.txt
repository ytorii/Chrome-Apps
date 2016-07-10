Features:
*Reading IDm of Felica cards without native apps.
*Writing user ID and card key.
*Sending random challenge number and recieve response.

---------------------
Environments
---------------------
1.OS : Chrome browser for Windows(I haven't checked if it works in other OS.)

2.IC cards : Felica, Felica Lite-S

3.IC Reader : SONY's RC-S380(both enterprise and personal models available)

4.Driver : Please install WinUSB(this doesn't work with SONY's default drivers, so install WinUSB with 'zadig' soft and so on.)

---------------------
How to use
---------------------	
All request and response is based on chrome messaging with JSON format messages.
"Felica IDm Receiver Extension for RC-S380" helps you to utilize this app and send data to Web pages.
Of course, you can make your own extension to use this app.


*** Reading IDm ***
(Both felica and felica lite-s available)
input:
 startPolling : (1 or 0)
output:
 felicaIDm : (hex numbers string of felica IDm)


*** Reading user ID ***
(Only felica lite-s available)
input:
 getCardId : (1 or 0) 
output:
 felicaIDm: (hex numbers string of felica IDm)


*** Writing user ID and Key ***
(Only felica lite-s available)
If you don't enter master key and car key version, this writes only user ID.
You can't read card key written in the card directly.

input:
 writeCardId : (1 or 0)
 cardId : (0 - 281474976710655 integral number)
 cardKeyVersion : ( 0 - 65535 integral number)
 masterKey :  (24bytes hex number string)

output:
 felicaIDm: (hex numbers string of felica IDm)


*** Writing Random Challenge ***
(Only felica lite-s available) 

input:
 authCard : (1 or 0)
 randomNum : (16bytes hex number string)

output:
 rcResponse: (hex numbers string of 16 bytes felica IDm, 16bytes card key version, 8 bytes random challenge response(MAC_A value))


#####################
Cautions:
#####################
1.I won't take any responsibilities about installing and using this application, including changing drivers in your PCs.

2.The copyright of this application belongs to me, but you can check inside of this application from background pages.

3.The authentication functions are designed based on SONY's document(you can find on the web), but there is no guarantee about security.

This app is using CryptoJS, useful javascript encryption library, to write card key.
(https://code.google.com/p/crypto-js/)
Any comments would be appreciable.  


ソニー社のPaSoRi(RC-S380モデル)でFelicaカードのIDmを読み取るアプリです。
バージョン2.1からRC-S380の業務用・個人用の両モデルに対応しています。
バージョン2.2からFelicaLite-SカードのID領域の書き込み・読み出し機能を追加しました。

Webページ上のjavascriptにIDmやユーザ独自のIDを連携できるので、WebページやWebシステムへの連携に便利です。
WebページにIDを連携するにはIDm Reciever Extension for RC-S380をご利用下さい。
(詳細な使用方法はIDm Reciever Extension for RC-S380の説明文をご覧下さい。)

動作環境：
　1.対応OS：Windows版のChromeブラウザで動作を確認しています。
	　(その他のＯＳでは動作未確認です。モバイルアプリ版のChromeでは現時点で動作不可です。)

　2.対応ICカード：Felica、Felica Lite-Sカードで動作を確認しました。
　　　　　　　　(Mifareカードでは動作未確認です)

　3.ドライバ：WinUSBをインストールして下さい。
　　　　　　　(ソニー社のドライバでは動作しません。zadig等のツールで上書きしてインストールしてください)
　　　　　　　(zadigでoption⇒List all devicesでRC-S380を選択後にWinUSBをインストールして再起動してください)

留意事項および免責事項：
　1.このアプリのインストールや利用およびドライバの変更により発生するいかなる事故・損害について当方は一切責任を負いませんので、
　　ドライバの変更およびアプリのインストール・ご利用は自己責任で実施願います。

　2.このアプリの中身はご自由に閲覧して下さい。ただしこのアプリの著作権は当方に帰属いたします。
　　
改善点や不具合、その他ご意見あればご一報下さい。可能な限り対応します。
動作確認をして頂ける方がいらっしゃれば有難いです。

時々動かなくなることがあるかもしれませんが、ブラウザごと再起動して頂くと一番手っ取り早いと思います…。
なお現時点では未公開ですが、Felica Lite-Sカードに対応した非暗号化書き込み・読み出しおよびカードの認証(内部認証)の機能も作成しています。
ご要望があれば公開していきたいと思っています。

