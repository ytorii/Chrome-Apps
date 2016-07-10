To exchange data with felica cards, you need Felica IDm Reader App for RC-S380.
This extension helps you to sending and recieving data between web pages and reader app.

Features:
* Sending felica card IDm, random chalenge response to web pages from reader app.
* Writing felica card user ID and Key with reader app.
* The custom event 'getId' is fired when the data recieved, so you can run your own script when recieved data.
* Veryfing random challenge response from the card.(Only for testing)

---------------------
How to use
---------------------	
Please embed html elemnents with following id in your web pages.
The option page and script of this extension is an example of usage, so please check it.
"extension" means "Felica IDm Receiver Extension for RC-S380",
"app" means "Felica IDm Reader App for RC-S380".
Basically, extension sends requests to app, and recieves the result.


*** Reading IDm ***
(Both felica and felica lite-s available)
input:
 startPolling : When it's clicked,  extension makes app to start reading IDm.
output:
 felicaIDm : IDm is inserted to the value of this element by extension. This extension fires 'getID' event in this element.


*** Reading user ID ***
(Only felica lite-s available)
input:
 getCardId : When it's clicked, extension makes app to start reading IDm and user ID.
output:
 felicaIDm : IDm and user ID are inserted together to the value of this element by extension. 


*** Writing user ID and Key ***
(Only felica lite-s available)
If you don't enter master key and car key version, only user ID will be written.
You can't read card key written in the card directly.

input:
 felicaUserId : 0 - 281474976710655 integral number
 felicaCKVInput : 0 - 65535 integral number
 felicaMasterKey : 24bytes hex number string
 writeCardId :  When it's clicked, extension makes app to start writing user ID, card key version, and card key.

output:
 felicaIDm : IDm and user ID are inserted together to the value of this element by extension. 


*** Writing Random Challenge ***
(Only felica lite-s available) 

input:
 authCard : When it's clicked, extension sends 16bytes random numbers and makes app to start writing random challenges.

output:
 felicaIDm : IDm is inserted to the value of this element by extension. 
 felicaCKV : 16bytes hex numbers string including the card key version is inserted to the value of this element.
 felicaRandomNum : Random 16bytes hex numbers used in random challenge is inserted to the value of this element.
 felicaRandomRes : 16bytes hex numbers random challenge response is inserted to the value of this element.

*** Veryfing Random Challenge Response ***
(Only felica lite-s available)
Entering keys in web pages is NOT SAFE, so please use this feature only for testing!
After sending random challenge, enter master key and click 'verify' button,
extension calculates MAC_A value and compares it to response of thet card.

#####################
Cautions:
#####################
1.I won't take any responsibilities about installing and using this application, including changing drivers in your PCs.

2.The copyright of this application belongs to me, but you can check inside of this application from background pages.

3.The authentication functions are designed based on SONY's document(you can find on the web), but there is no guarantee about security.

This app is using CryptoJS, useful javascript encryption library, to write card key.
(https://code.google.com/p/crypto-js/)
Any comments would be appreciable.  

FelicaカードのIDmをWebページを連携するための拡張機能です。
またFelicaLite-Sカードへのユーザ独自IDの書き込み・読み出しを行います。
(IDmの読み取りにはFelica IDm Reader App for RC-S380が必要です)

使い方：
1. IDmを連携したいWebページにIDが'startPolling'のbutton要素とIDが'felicaIDm'のinput要素を埋め込んでください。
   (IDmとユーザ独自IDを取得する場合はIDが'getUserId'のbutton要素を埋めこんでください)
2. ボタンをクリックするとAppが読み取りを開始し、IDの読み取りが完了したらinput要素にIDが連携されます。
3. ページを移動したり閉じたりするとAppの動作を停止します。
4. ページ読み取り時に自動実行する場合はページ読み込み時にボタンを押すスクリプトを追加して下さい。

動作確認：
[IDmの読み出し]
1．WinUSBをインストールし、PCにRC-S380を接続する
2. 拡張機能の管理画面をChromeのメニューの「その他のツール」⇒「拡張機能」から開く
3. 「Felica IDm Reciever Extension for RC-S380」のオプション画面を開く
4. オプション画面で「get IDm」ボタンを押してカードをかざす
5. 読み出しが完了するとオプション画面にIDmが表示される

[FelicaLite-Sでのユーザ独自IDの書き込み・読み出し]
1. オプション画面でuserIDの入力フォームにIDを入力
2. カードをかざした状態で、「regist userID」ボタンを押す
3. IDm表示画面に表示されるIDmと入力したIDを確認する
4. IDの取得のみ行う場合は「get userID」ボタンを押してIDmとIDを取得する
※ユーザ独自IDは0～281474976710655の整数値以外は登録できません。またカード内では16進表記で登録されます。

デフォルトで「Felica IDm Reader App for RC-S380」と連携する設定ですが、オプション画面でAppのIDを変更できます。

動作環境：
　1.対応OS：Windows7およびXPのChromeブラウザで動作を確認しています。
	　(その他のＯＳでは動作未確認です。モバイルアプリ版のChromeでは現時点で動作不可です。)

　2.対応ICカード：Felica、Felica Lite-Sカードで動作を確認しました。
　　　　　　　　(Mifareカードでは動作未確認です)

　3.ドライバ：WinUSBをインストールして下さい。
　　　　　　　(ソニー社のNFCポートソフトウェアでは動作しません。zadig等のツールで上書きしてインストールしてください)

時々動かなくなることがあるかもしれませんが、ブラウザごと再起動して頂くと一番手っ取り早いと思います…。
なお現時点では未公開ですが、Felica Lite-Sカードに対応した非暗号化書き込み・読み出しおよびカードの認証(内部認証)の機能も作成しています。
ご要望があれば公開していきたいと思っています。

留意事項および免責事項：
　1.この拡張機能のインストールや利用およびドライバの変更により発生するいかなる事故・損害について当方は一切責任を負いませんので、
　　ドライバの変更およびアプリのインストール・ご利用は自己責任で実施願います。

　2.このアプリの著作権は当方に帰属いたしますが、中身はバックグラウンドページ等からご自由に閲覧して下さい。
　　
改善点や不具合、その他ご意見あればご一報下さい。可能な限り対応します。
動作確認をして頂ける方がいらっしゃれば有難いです。