MIFARE UL UID Reader App for RC-S380(以下Appと呼びます)とWebページを連携するための拡張機能です。(UIDの読み取りにはMIFARE UL Reader App for RC-S380が必要です)

使い方：
1. UIDを連携したいWebページにIDが'startMifarePolling'のbutton要素とIDが'mifareulUID'のinput要素を埋め込んでください。
2. ボタンをクリックするとAppが読み取りを開始し、UIDの読み取りが完了したらinput要素にIDmが連携されます。
3. ページを移動したり閉じたりするとAppの動作を停止します。
4. ページ読み取り時に自動実行する場合はページ読み込み時にボタンを押すスクリプトを追加して下さい


動作確認する際は以下の様にオプション画面からIDmを読み出して下さい。
1．WinUSBをインストールし、PCにRC-S380を接続する
2. 拡張機能の管理画面をChromeのメニューの「その他のツール」⇒「拡張機能」から開く
3. 「MIFARE UL UID Reciever Extension for RC-S380」のオプション画面を開く
4. オプション画面で「get UID」ボタンを押してカードをかざす
5. 読み出しが完了するとオプション画面にUIDが表示される

デフォルトで「MIFARE UL UID Reader App for RC-S380」と連携する設定ですが、オプション画面でAppのIDを変更できます。

動作環境：
　1.対応OS：Windows7およびXPのChromeブラウザで動作を確認しています。
	　(その他のOSでは動作未確認です。モバイルアプリ版のChromeでは現時点で動作不可です。)

　2.対応ICカード：MIFARE Ultralightカードで動作を確認しました。
　　　　　　　　(MIFAREの他シリーズのカードでは動作未確認です)

　3.ドライバ：WinUSBをインストールして下さい。
　　　　　　　(ソニー社のNFCポートソフトウェアでは動作しません。zadig等のツールで上書きしてインストールしてください)

時々動かなくなることがあるかもしれませんが、ブラウザごと再起動して頂くと一番手っ取り早いと思います…。

留意事項および免責事項：
　1.この拡張機能のインストールや利用およびドライバの変更により発生するいかなる事故・損害について当方は一切責任を負いませんので、
　　ドライバの変更およびアプリのインストール・ご利用は自己責任で実施願います。

　2.このアプリの著作権は当方に帰属いたしますが、中身はバックグラウンドページ等からご自由に閲覧して下さい。
　　
改善点や不具合、その他ご意見あればご一報下さい。可能な限り対応します。
動作確認をして頂ける方がいらっしゃれば有難いです。


This extension is designed for sending UID from MIFARE UL Reader App for RC-S380(App) to Web pages. You need 'MIFARE UL Reader App for RC-S380' to read IDm.

How to use:
1. Embbed button element with 'startMifarePolling' id and input element with 'mifareulUID' id in your web page.
2. By clicking button with 'startPolling' id, this extension makes App to start getting UID.
3. The app will be stopped when page is moved or removed.
4. You can start polling automatically by embedding script clicking button when the page loaded.

Any comments would be appreciable.  

You can test this application as follow.
1．Finish installing WinUSB, and connect RC-S380 to your PCs.
2. Open extension page by Chrome Menu's 'More tools' > 'Extensions'.
3. Open option page of 'MIFARE UL UID Reciever Extension for RC-S380' .
4. Click 'get UID' button, and hold the card.
5. Check the UID value in the option page.

In option page, you can change App's ID cooperate with this extension.(By default, 'MIFARE UL Reader App for RC-S380' is selected)

Enviroments:
 1.OS : I checked Chrome browser for Windows7 and XP
        (I haven't checked if it works in other OS.)

 2.IC cards : MIFARE Ultralight
             (I haven't checked if it works with other MIFARE cards)

 3.Driver : Please install WinUSB
            (This app doesn't work with SONY's default drivers, so install WinUSB with 'zadig' soft and so on. If you use 'zadig', 'option' -> 'List All Devices' and choose RC-S380 and install WinUSB, then reboot your PCs)

Cautions:
 1.I won't take any responsibilities about installing and using this application, including changing drivers in your PCs.

 2.The copyright of this application belongs to me, but you can see inside of this application from back ground pages.

If this app freezed, the easiest way is to restart Chrome browser...