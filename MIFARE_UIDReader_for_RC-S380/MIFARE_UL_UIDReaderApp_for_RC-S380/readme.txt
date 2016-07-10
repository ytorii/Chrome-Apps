ソニー社のPaSoRi(RC-S380モデル)でMIFARE UltralightカードのUIDを読み取るアプリです。バージョン2.1からRC-S380の業務用・個人用の両モデルに対応しています。
Webページ上のjavascriptにIDmを連携できるので、WebページやWebシステムへの連携に便利です。複数枚のカードを同時にかざした場合は正しく読み取りができません。
WebページにIDmを連携するにはMIFARE Ultralight UID Reciever Extension for RC-S380をご利用下さい。

動作環境：
　1.対応OS：Windows版のChromeブラウザで動作を確認しています。
	　(その他のＯＳでは動作未確認です。モバイルアプリ版のChromeでは現時点で動作不可です。)

　2.対応ICカード：MIFARE Ultralightカードで動作を確認しました。
　　　　　　　　(MIFAREの他シリーズのカードでは動作未確認です)

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
FelicaカードのIDm読み取りにはFelica IDm reader App for RC-S380をご利用下さい。


This application gets UID from MIFARE Ultralight with PaSoRi(model:RC-S380).From version 2.1, both enterprise and personal models of RC-S380 are available.
This app can send the UID to scripts in web pages, so useful for tranferring UID to the web sites and web systems. This app can't work correctlly when more than two cards are holded.
To tranfer UID to web pages, please install 'MIFARE Ultralight UID Reciever Extension for RC-S380'.
Any comments would be appreciable.  

Enviroments:

 1.OS : Chrome browser for Windows
        (I haven't checked if it works in other OS.)

 2.IC cards : MIFARE Ultralight
             (I haven't checked if it works with other MIFARE cards)

 3.Driver : Please install WinUSB
            (this app doesn't work with SONY's default drivers, so install WinUSB with 'zadig' soft and so on.)

Cautions:
 1.I won't take any responsibilities about installing and using this application, including changing drivers in your PCs.

 2.The copyright of this application belongs to me, but you can check inside of this application.

If this app freezed, the easiest way is to restart Chrome browser...