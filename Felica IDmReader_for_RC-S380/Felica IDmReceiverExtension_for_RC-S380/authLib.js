// ゼロパディング処理および平文で用いる8バイト分(16個)の文字列0
var zero8Bytes = "0000000000000000";

// CryptoJSを利用して3key-TripleDES暗号のCMAC値を計算し、個別化カード鍵を返す関数
// id、key、ivはutf-8の入力が前提
function uniqueCardKey_generator(id, key, iv){

  // 中間処理で使用する変数
  var l, k1, m1, m2, t1, t2;

  // CMAC値計算時のXOR処理で用いる定数
  var k1Xor = "000000000000001b";
  var m1Xor = "8000000000000000";

  // ivが0の場合3DESのIV(Initial Vector)が0として処理する
  if(iv == 0){ iv = zero8Bytes; }

  // CryptoJSで0を平文として3DES暗号化し暗号文をlに格納する
  l = tripleDES_encoder(zero8Bytes, key, iv);

  // lを2進数の表現に変換する(最上位が0の場合を考慮してゼロパディング)
  var lBynary = ("0" + parseInt(l, 16).toString(2)).slice(-64);

  // lを左に1ビットシフトする。シフト前のlの最上位ビットが1の場合はシフト後にXOR演算を追加する
  if(lBynary.slice(0,1) == "1"){ 

  // 文字列操作によりビットシフトと同等の処理を行い、16進数形式に変換してゼロパディングする
  k1 = (zero8Bytes + parseInt(lBynary.slice(-63) + "0", 2).toString(16)).slice(-16);

  // 定数k1XorとXOR演算を行う。
  k1 = xor_per_2bytes(k1, k1Xor);

  } else {

  // 文字列操作によりビットシフトと同等の処理を行い、16進数形式に変換してゼロパディングする
  k1 = (zero8Bytes + parseInt(lBynary.slice(-63) + "0", 2).toString(16)).slice(-16);

  }

  // idの上位8バイトをm1、idの下位8バイトとk1のXOR処理した結果をm2とする
  m1 = id.slice(0,16);
  m2 = xor_per_2bytes(id.slice(16,32), k1);

  // 個別化カード鍵の先頭8バイト分をt1、末尾8バイト分をt2としてそれぞれ計算する
  t1 = tripleDES_encoder(m2, key, tripleDES_encoder(m1, key, iv));
  t2 = tripleDES_encoder(m2, key, tripleDES_encoder(m1, key, m1Xor));
  
  // t1とt2を結合した結果を個別化カード鍵として返す
  return (t1 + t2);

}

// カードから送られたMAC_Aと計算したMAC_Aが一致すればtrueを、しなければfalseを返す関数 
// MAC_A算出処理ではカード内のエンディアンに合わせてバイト単位で値の順番を反転する
function calcAuthMAC_A(pt, key, rc, data){

  // 平文の値を反転
  var pt_inv = inverseByteString(pt);

  // 乱数の上位8バイトを取得して値を反転
  // この辺りの処理はテクニカルノートも確認する必要がある
  var rc1_inv = inverseByteString(rc.slice(0,16));
  var rc2_inv = inverseByteString(rc.slice(16,32));

  // 個別化カード鍵の上位8バイト、下位8バイトを取得して値を反転
  var ck1_inv = inverseByteString(key.slice(0,16));
  var ck2_inv = inverseByteString(key.slice(16,32));

  // セッション鍵の作成に用いる鍵を作成
  var skKey_inv = ck1_inv + ck2_inv + ck1_inv;

  // セッション鍵の上位8バイトおよび下位8バイトを作成する
  var sk1_inv = tripleDES_encoder(rc1_inv, skKey_inv, zero8Bytes);
  var sk2_inv = tripleDES_encoder(rc2_inv, skKey_inv, sk1_inv);

  // セッション鍵を作成する
  var sk_inv = sk1_inv + sk2_inv + sk1_inv;

  // MAC値の算出に用いる初期ベクトルを計算する
  // 以降の処理ではこの変数に暗号文を入れてIVとして用いる
  var maca_iv = tripleDES_encoder(pt_inv, sk_inv, rc1_inv);

  // 読み込んだブロックデータを8バイト毎にTripleDES暗号化してMAC値を求める
  // MAC_Aを除くブロックデータ数を求める
  var blockNum = data.length / 32;

  for(var i = 0; i < blockNum; i++){

    // ブロックデータの上位8バイトからMAC値を算出する(IVは前段の処理結果)
    maca_iv = tripleDES_encoder(inverseByteString(data.substr( 0 + (i * 32), 16)) , sk_inv, maca_iv);

    // ブロックデータの下位8バイトからMAC値を算出する(IVは前段の処理結果)
    maca_iv = tripleDES_encoder(inverseByteString(data.substr(16 + (i * 32), 16)) , sk_inv, maca_iv);

  }

  // 算出したMAC値とカードから送られたMAC値が一致するかを判定結果として返す
  return inverseByteString(maca_iv);

}

// 入力された平文3DES暗号化を行い、暗号文を返す関数
// 平文、鍵および初期ベクトルは16進数の文字列であることが前提
function tripleDES_encoder(pt, key, iv){

  // (入力形式はCryptoJSのフォーマットに変換する。また暗号処理結果の先頭16バイト文が平文の暗号文となる)
  return CryptoJS.TripleDES.encrypt(CryptoJS.enc.Hex.parse(pt), CryptoJS.enc.Hex.parse(key), {iv: CryptoJS.enc.Hex.parse(iv) }).ciphertext.toString().slice(0,16);

}

function tripleDES_16b_encoder(pt, key, iv){

  // (入力形式はCryptoJSのフォーマットに変換する。また暗号処理結果の先頭16バイト文が平文の暗号文となる)
  return CryptoJS.TripleDES.encrypt(CryptoJS.enc.Hex.parse(pt), CryptoJS.enc.Hex.parse(key), {iv: CryptoJS.enc.Hex.parse(iv) }).ciphertext.toString();

}

// 入力に対して2バイトずつに区切ってXORを行う関数
// 入力は両方とも2バイト以上の同一長の16進数文字列であることが前提
// javascriptでは処理できる桁数に限界があり、加えて4バイト以上だと2の補数表現と判定されるので区切って処理する
function xor_per_2bytes(input1, input2){

  // 2バイト(4ビット)毎のブロックに分けて処理するためブロック数を求める
  var blockNum = input1.length / 4;

  // 入力の長さが異なる場合はXOR処理ができないため終了する
  if(blockNum != (input2.length / 4)){

    appendLog('ERROR : The inputs lengths are different.')

    return;

  }

  // input1とinput2を2バイトごとに区切ってXORを求め、16進数表記の文字列に変換する
  // 初期化をかねて前読みする
  var result = (parseInt(input1.slice(0, 4), 16) ^ parseInt(input2.slice(0, 4), 16)).toString(16);

  // 4バイト毎にXOR処理をブロック数分だけ繰り返しresultに連結していく
  for(var i = 1; i < blockNum; i++){

    result += (parseInt(input1.slice(i * 4, i * 4 + 4),16) ^ parseInt(input2.slice(i * 4, i * 4 + 4),16)).toString(16); 
  
  }

  // ゼロパディングした結果を返す(8バイト分の0があればゼロパディングに十分と考える)
  return (zero8Bytes + result).slice(-(input1.length));

}

// 入力に対して1バイト単位(2文字ごと)で順番を入れ替える関数
// RC-S380とカード内ではエンディアンが違うため必要と思われる
function inverseByteString(inputString){

  // 入力の文字数が奇数の場合は先頭にゼロパディングする
  if(inputString.length % 2 != 0){

    inputString += "0";

  }

  // 1バイト毎(2文字ごと)に入れ替えるため長さ-2の値を取得する
  var index = inputString.length - 2;

  // 処理結果の初期化をかねて前読みする
  var result = inputString.substr(index, 2);

  // 2文字ずつ入力とは逆順にresultに格納していく
  for(var i = 2; index  > i - 2; i = i + 2){

    result += inputString.substr(index - i , 2);
  
  }

  return result;

}