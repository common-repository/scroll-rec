let		base_id = "siori_123581321"

// 主要な要素のセレクタ
///const	SEL_BASE = `#${base_id}`;
///const	SEL_MAINBUTTON = `#${base_id}>:first-child`;
///const	SEL_BTNFRAME = `#${base_id}>div:nth-child(2)`;
///const	SEL_BTNS = `#${base_id}>div:nth-child(2)>div`;
const	SEL_BASE = "#"+base_id;
const	SEL_MAINBUTTON = "#"+base_id+">:first-child";
const	SEL_BTNFRAME = "#"+base_id+">div:nth-child(2)";
const	SEL_BTNS = "#"+base_id+">div:nth-child(2)>div";

const	BTNWH = 64;
const	BTN_DISP_MAX = 4;					// 表示するボタンの最大数(きちんと整列したときの)
const	BTNFRAMEH = BTNWH * BTN_DISP_MAX;	// ボタンを表示するフレームの高さ
const	CLICK_LIMIT = 500;					// pointer downから upまでかかった時間でクリックとみなす上限
const	LONGPRESS = 1800;					// この値を超えたら長押し
const	DISTANCEMIN = BTNWH/4;				// この値を超えて動いたらクリックと認めない

const	TM_OPAQUE = 4000;					// pointer leave後に不透明でいる時間(ms)
const	BASE_OPA = 0.3;						// 半透明時の base透明度

const	SCROLL_INTERVAL = 20;				// 自前スクロールのタイマー呼び出し間隔(ms)
const	SCROLL_TIMES = 15;					// 自前スクロールのタイマー呼び出し回数(何回に分けてスクロールするか)

const	qstrS = "SRECSTART=";				// urlに加えるスクロールデータの開始文字列
const	qstrE = "SRECEND";					// 終端

///BaseBgCol = "";

//# oPointer
let oPointer = {
	dt_down: [],		// ポインターダウン時のデータ{el:要素, tm:time, cx:clientX, cy:clientY}
	lastX: null,		// 直近の座標 for move
	lastY: null,
	totalX: 0,			// 移動距離合計 for move
	totalY: 0,

	// ボタン上でdown開始処理
	pntDown: function(el, cx, cy){
		this.totalX = this.totalY = 0;
		if( !this.dt_down.length ){
			this.dt_down.push({el:el, tm:Date.now(), cx:cx, cy:cy});
			this.lastX = cx;
			this.lastY = cy;
		}
	},

	// up時の処理　戻り値 1:click, 2:slide, 3:長押し, 0:不明
	// slideは移動量の絶対値の合計を保存して、それで判定する
	// 長押しは、down時にタイマーを発行してLONGPRESSミリ秒後に長押し処理する
	pntUp: function(el, cx, cy){
		let r = 0, dt, tm;
		if( this.dt_down.length ){
			dt = this.dt_down.pop();
			if(dt.el == el){
				tm = Date.now();
				tm -= dt.tm;
				if(this.totalY < DISTANCEMIN){
					r = (tm < CLICK_LIMIT) ? 1 : 0;
				}else
					r = 2;
			}
		}
		return r;
	},

	pntMove: function(el, cx, cy){
		if(this.dt_down.length && el === this.dt_down[0].el){
			this.totalX += Math.abs(cx - this.lastX);
			this.lastX = cx;
			this.totalY += Math.abs(cy - this.lastY);
			this.lastY = cy;
		}
	},

	// slide中か
	isSlide: function(){
		return (this.totalX + this.totalY < DISTANCEMIN) ? 0 : 1;
	},

	// pointer down中か
	isDown: function(){
		return this.dt_down.length;
	},

	getDownY: function(){
		return this.dt_down[0].cy;
	},

	getDownElement: function(){
		return ( this.isDown() ) ? this.dt_down[0].el : null;
	},
	getDownLap: function(){
		return ( this.isDown() ) ?  Date.now() - this.dt_down[0].tm : -1;
	},
};

//# oSlide
// 利用オブジェクト　oPointer, oButtons
let oSlide = {
	top: 0,			// btns.style.topの値(px)
	moveY: 0,		// pointer moveのY座標

	// スライド終了処理(y:カーソルの最終Y座標)
	end: function(y){
		let bcnt, dy;
		// 必要ならボタンの表示位置を調整する
		bcnt = oButtons.getCount();
		dy = oPointer.getDownY();
		this.top += y - dy;
		this.adjust(0);
	},

	move: function(y){
		if( oPointer.isDown() ){
			let dy, top;
			dy = oPointer.getDownY();
			top = this.top + (y - dy);
			document.getElementById("btns").style.top = top+"px";
		}
	},

	// 現在の表示位置からボタンをoy分移動する
	moveBy: function(oy){
		this.top += oy;
		document.getElementById("btns").style.top = this.top+"px";
	},

	// ボタンの表示位置を調整する
	// 上部に空きがある場合は、一番上のボタンが上部にぴったりつくように
	// 下部に空きがある or ボタンを追加した場合は、一番下のボタンが底部にぴったりつくように(ボタン数>=BTN_DISP_MAXの場合)
	adjust: function(f){		// f 1:ボタンを追加した, 0:それ以外
		let bcnt = oButtons.getCount();
		if(this.top > 0 || bcnt < BTN_DISP_MAX){
			// 上が空いた場合の処理
			this.top = 0;
			document.getElementById("btns").style.top = 0;
		}else if(bcnt >= BTN_DISP_MAX && (f || bcnt * BTNWH + this.top < BTNFRAMEH)){
			// 下が空いた場合の処理
			this.top = (BTN_DISP_MAX - bcnt)*BTNWH;
			document.getElementById("btns").style.top = this.top + "px";
		}
	},

	// 以下の条件が成立するとき btnsの底がBTNFRAMEの底になるように表示する
	// ボタン数が BTN_DISP_MAX以上 かつ BTNFRAME底部に空きがある
	// ただしボタン追加時は、底部の空きに関係なく追加したボタンを底部に表示したいので fに1を入れて呼び出す
	toBottom: function(f){
		let bcnt = oButtons.getCount(f);
		// 表示されているボタン底位置
		if(bcnt >= BTN_DISP_MAX && (f || bcnt * BTNWH + this.top < BTNFRAMEH)){
			this.top = (BTN_DISP_MAX - bcnt) * BTNWH;
			document.getElementById("btns").style.top = this.top +"px";
		}
	},
};

//# oBase
let oBase = {
	stat: 0,			// 状態　0:半透明 1:はっきり
	tmTranslucent: 0,	// 半透明にする時間(leave で設定, enter or 半透明処理後で最大)

	toTranslucent: function(){
		document.querySelector(SEL_BASE).style.opacity = "" + BASE_OPA;
		this.tmTranslucent = Number.MAX_SAFE_INTEGER;			// 9007199254740991
		this.stat = 0;
	},
	toOpaque: function(el){
		this.tmTranslucent = Number.MAX_SAFE_INTEGER;			// 9007199254740991
		el.style.opacity = "1";
		this.stat = 1;
	},
};


//# oScroll
let oScroll = {
	// ボタンNoに対応したスクロール位置(配列インデックスがボタンNo {x:clientX, y:clientY}で保存)
	bno_xy: [],

	// ボタンNoに対応した位置へページをスクロールする
	moveBnoXY: function(bno){
///		let {x, y} = this.bno_xy[bno];
		let x = this.bno_xy[bno].x;
		let y = this.bno_xy[bno].y;
///		window.scrollTo({top:y, left:x, behavior: 'smooth'});		// IE NG(動かない)
		tmScroll(x, y, 0);											// 自前スクロール
	},

	// 指定されたボタンNoに対応した bno_xy[]に、スクロール量をセットする
	setBnoXY: function(bno){
		this.bno_xy[bno] = {x:window.pageXOffset, y:window.pageYOffset};
	},
	setBnoXYQ: function(bno, sx, sy){
		this.bno_xy[bno] = {x:sx, y:sy};
	},

	// ボタンNoに対応したスクロール量を取得する
	getBnoXY: function(bno){
		return this.bno_xy[bno];
	},

	// ボタンに登録された位置 bno_xy[]をクエリ用の文字列にする
	getQueryStr: function(){
		// "pganc=ブラウザ幅_(x,y)_(x,y)～PGANCEND"の文字列に
		let i, s, bn, ar;
		ar = oButtons.getOrderArray();
		if(!ar.length)
			return "";
		s = qstrS+window.innerWidth;
		for(i=0; i<ar.length; i++){
			bn = ar[i];
			s += "_b"+Math.round(this.bno_xy[bn].x)+"-"+Math.round(this.bno_xy[bn].y)+"b";
		}
		return s+qstrE;
	},

};

let icons = [
///		"circle(30% at 50% 50%)",
///		"circle(15% at 75% 25%)",
///		"polygon(50% 18%, 15% 82%, 85% 82%)",
///		"polygon(50% 14%, 86% 50%, 50% 86%, 14% 50%)",
///		"polygon(50% 15%, 85% 42%, 73% 85%, 27% 85%, 15% 42%)",
///		"polygon(15% 15%, 15% 85%, 35% 85%, 35% 35%, 65% 35%, 65% 65%, 35% 65%, 35% 85%, 85% 85%, 85% 15%)",
///		"polygon(15% 15%, 85% 85%, 85% 15%, 15% 85%)",
///		"ellipse(37% 24% at 50% 50%)",
///		"polygon(50% 9%, 61% 35%, 90% 36%, 68% 57%, 75% 87%, 50% 74%, 24% 87%, 32% 57%, 7% 37%, 39% 35%)"
];

//# oButtons
//利用オブジェクト　oPointer(getDownButtonで)
let oButtons = {
	// ボタンの要素 生成された順に登録する 削除されることはない
	els: [],

	// 表示されているボタンの並び順(上からのボタンNo)
	order: [],

	// 追加されたボタンの数
	addcnt: 0,

	// ボタンを生成する
	create: function(){		// アロー関数は thisでNG
		let bno, btn, btns, ico, bcnt, top, bgcol, clip;

		bno = this.els.length;
		bcnt = this.order.length;

		// btnsの子要素として btnを生成
		btns = document.querySelector(SEL_BTNS);
		btn = cEle("div");
		top = bcnt * (BTNWH - 1);
		btn.style.cssText = "position:relative; display:block; width:"+BTNWH+"px; height:"+BTNWH+"px; background-color:rgba(255,255,255,0); margin:0; padding:0; border:solid 1px rgba(255,255,255,0.55); border-radius:6px; box-sizing:border-box; overflow:hidden; background-image: linear-gradient(to bottom right,transparent, hsla(0,0%,20%,1)); background-image: linear-gradient(to bottom right,transparent, 65%, hsla(0,0%,20%,1)); cursor:pointer; backdrop-filter: blur(4px);";
		aChl(btns, btn);
		// btnの子要素として icoを生成
		ico = cEle("div");
		bgcol = "rgba(0,0,0,0.72)";
		clip = icons[bno];
		if(bcnt >= icons.length){
			bgcol = "transparent";
			clip = "none";
			ico.textContent = ""+(this.addcnt);
		}
ico.style.cssText = "position:static; width:100%; height:100%; background-color:"+bgcol+"; clip-path:${clip}; pointer-events:none; font-size:14px; font-weight:400; font-family:sans-serif; text-align:right; padding:5px; box-sizing:border-box;";
		aChl(btn, ico);

		// 使用フラグ・並び順・要素をプロパティにセットしてボタンNoを返す
		this.els.push(btn);
		this.order.push(bno);

		return bno;
	},

	// 使われてないボタンをさがす	戻り値 -1:空きなし else 空いているボタンNo
	search: function(){
		let ar, bn = -1;

		// order[]の数(表示ボタン数)が els[](生成したボタン数)より少なければ未使用ボタンがある
		if(this.order.length < this.els.length){
			// order[]を ar[]にコピーして昇順でソート
			ar = this.order.concat();
			ar.sort(function(a,b){
				return a-b;
			});
			// 空いているボタンを見つける
			//	ar = [0,1,2,4,5] なら 3が空いている
			//	ar = [0,1,2,3,4] で els.lengthが 6以上なら 5が空き
			for(bn=0; bn<ar.length; bn++){
				if(ar[bn] !== bn)
					break;
			}
		}
		return bn;
	},

	// 使われてないボタンを再利用する
	recycle: function(bno){
		let el, btns;
		el = this.getEleByNo(bno);
		el.style.display = "block";
		this.order.push(bno);
		el.firstElementChild.textContent = ""+(this.addcnt);
		// appendChildで存在する要素を一番最後に追加
		btns = document.querySelector(SEL_BTNS);
		aChl(btns, el);
	},

	// ボタンを追加する(新規生成 or 再利用)		上限超えるまで再利用しない　にする？
	add: function(){
		this.addcnt++;
		let bn = this.search();
		if( bn >= 0 )
			this.recycle(bn);
		else
			bn = this.create();
		oSlide.adjust(1);
		return bn;
	},

	del: function(bno){
		let el, idx;
		el = this.getEleByNo(bno);
		el.style.display = "none";
		// order
		idx = this.order.indexOf(bno);
		if(idx >= 0){
			this.order.splice(idx, 1);
			// 削除後、ボタンの数が４以上で下が空いていたら空きを無くす
			oSlide.adjust(0);
		}
	},

	// 指定されたボタンNoのボタン要素を返す
	getEleByNo: function(bno){
		return this.els[bno];
	},
	// 指定されたボタン要素のボタンNoを返す
	getNoByEle: function(el){
		return this.els.indexOf(el);
	},
	getCount: function(){
		return this.order.length;
	},
	getOrderArray: function(){
		return this.order;
	},

	// downしているボタンNoを返す(なければマイナス値)
	getDownButton: function(){
		let el;
		if( el = oPointer.getDownElement() ){
			return this.getNoByEle(el);
		}
		return -1;
	},

	// urlに付加されたクエリ文字列からデータを取り出しボタンに反映させる
	QueryApplyToButtons: function(){
		// クエリを取得しデータを抜き出す
		let i, s="", w, ar, arr, que;
		if( que = location.search ){
			if( s = strSlice(que, qstrS, qstrE) ){
				ar = s.split("_");
				// 記録時のブラウザ幅と現在のブラウザの幅を比較
///				i = ar[0]*1;
///				w = Math.round(window.innerWidth);
///				if( w < i )
///					s = (i-w)+"px小さく";
///				else if(w > i)
///					s = (w-i)+"px大きく";
///				if(s)
///					alert("記録時よりブラウザ幅が"+s+"なっています");
				//
				for(i=1; i<ar.length; i++){
					if( ar[i].charAt(0) === 'b' ){
						s = ar[i].slice(1,-1);
						arr = s.split("-");
						if(arr.length === 2){
							// 現在のスクロール量を登録
							oScroll.setBnoXYQ(i-1, arr[0], arr[1]);
							// ボタンを追加
							this.add();
						}
					}
				}
			}
		}
	},
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//# UI作成
(function(){
	let el, btns, base, tb="bottom", lr="right", offx="10px", offy="10px";

	// 自身のScriptファイルのパスからパラメーターを読み取り表示位置を得る(あれば)
	if( el = getCurrentScript() ){
		let i, arr, ar = el.src.split("?");
		if(ar.length > 1){
			ar = ar[1].split("&");
			for(i=0; i<ar.length; i++){
				arr = ar[i].split("=");
				if(arr[0] === "top" || arr[0] === "bottom"){
					tb = arr[0];
					if(arr[1])
						offy = arr[1]+"px";
				}else if(arr[0] === "left" || arr[0] === "right"){
					lr = arr[0];
					if(arr[1])
						offx = arr[1]+"px";
				}
			}
		}
	}

	// -- baseを生成(子要素によりサイズ可変)
	base = cEle("div");
	base.className = base.id = base_id;
	base.style.cssText = "position:fixed; "+tb+":"+offy+"; "+lr+":"+offx+"; padding:4px; font-family:sans-serif; font-size:14px; color:rgba(255,255,255,0.8); background-color:transparent; border: 1px solid rgba(255,255,255,0.55); border-radius:8px; box-shadow:inset 0px 0px 0px 1px rgba(0,0,0,0.3); margin:0; box-sizing:border-box; z-index:2147483647; transition:opacity 0.8s;";
	aChl(document.body, base);
	//
	// -- アンカーボタンを生成
	el = cEle("div");
	el.innerHTML = "Scroll<br>Rec";
	el.style.cssText = "position:static; width:"+BTNWH+"px; height:44px; background-color:transparent; border: 1px solid rgba(255,255,255,0.55); border-radius:6px; background-image: linear-gradient(to bottom right,rgba(0,0,0,0), hsla(0,0%,20%,1)); background-image: linear-gradient(to bottom right,rgba(0,0,0,0), 65%, hsla(0,0%,20%,1)); box-sizing:border-box; cursor:pointer; backdrop-filter: blur(4px); font:12px normal sans-serif; color:rgba(255,255,255,0.6); text-align:center; padding:2px; overflow:hidden;";
	aChl(base, el);
	//
	// -- 位置ボタンbase(btns)の親要素を生成
	el = cEle("div");
	el.style.cssText = "position:relative; height:"+BTNFRAMEH+"px; background-color:transparent; margin:12px 0 0 0; padding:0; box-sizing:border-box; overflow:hidden; outline: 1px solid rgba(0,0,0,0.1);";
	aChl(base, el);
	//
	// -- ボタンを入れる btnsを生成
	btns = cEle("div");
	btns.style.cssText = "position:absolute; top:0; left:0;";
	btns.id = "btns";
	aChl(el, btns);
}());

oButtons.QueryApplyToButtons();
timerTranslucent();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//# タイマー関連

// 自前スムーススクロール x,y:最終位置, cnt:カウンタ(0から）
function tmScroll(x,y, cnt){
	if(cnt === 0){
		// CSSのスクロール動作を瞬時にしておく(smoothになってる場合があるため)
		document.querySelector("html").style.scrollBehavior = "auto";
	}
	if(cnt < SCROLL_TIMES){
		let nx = (x - window.pageXOffset) / (SCROLL_TIMES - cnt);
		let ny = (y - window.pageYOffset) / (SCROLL_TIMES - cnt);
		scrollBy(nx, ny);
		setTimeout(function(){tmScroll(x,y, cnt+1)}, SCROLL_INTERVAL);
	}else{
		// 終了処理　CSSのスクロール動作を元に戻す
		document.querySelector("html").style.scrollBehavior = "";
	}
}

// baseを半透明にするか１秒毎にチェックする
function timerTranslucent(){
	let tm = Date.now();
	if(tm >= oBase.tmTranslucent){
		oBase.toTranslucent();
	}
	setTimeout(timerTranslucent, 1000);
}

// 位置ボタン長押し　長押し中(limitを超えでボタンを縮める)・完了・中止(ボタンUP, slide, leaveでの)処理もここで行っている
function longPress(el){
	let h, bno, lap;
	if( oPointer.isDown() ){
		lap = oPointer.getDownLap();
		if(lap < LONGPRESS){
			if( !oPointer.isSlide() ){
				if(lap > CLICK_LIMIT){
					// 長押し中 ボタンの高さを縮める baseの背景色を変更する
					h = 1 - (lap - CLICK_LIMIT) / (LONGPRESS - CLICK_LIMIT);
					el.style.transform = "scaleY("+h+")";
					document.querySelector(SEL_BASE).style.backgroundColor = "hsla("+~~(h*360)+", 90%, 65%, "+(1-h)+")";
				}
				setTimeout(function(){longPress(el)},50);
			}else{
				// slideに入ったので ボタンが縮んでいたら元に戻す
				if(lap >= CLICK_LIMIT){
					el.style.transform = "scaleY(1)";
					document.querySelector(SEL_BASE).style.backgroundColor = "transparent";
				}
			}
		}else{
			// 長押し完了 ボタン削除
			el.style.transform = "scaleY(1)";
			bno = oButtons.getDownButton();
			oButtons.del(bno);
			oPointer.pntUp(null, 0, 0);
			document.querySelector(SEL_BASE).style.backgroundColor = "transparent";
		}
	}else{
		// 中止処理
		el.style.transform = "scaleY(1)";
		document.querySelector(SEL_BASE).style.backgroundColor = "transparent";
	}
}

// メインボタンの長押し
function longPressM(el){
	let h, bno, lap;
	if( oPointer.isDown() ){
		lap = oPointer.getDownLap();
		if(lap < LONGPRESS){
			if( !oPointer.isSlide() ){
				if(lap >= CLICK_LIMIT){
					// 内側に影をつけて最後には完全に埋める
					h = (lap - CLICK_LIMIT) / (LONGPRESS - CLICK_LIMIT);
					el.style.boxShadow = "inset 0px 0px 4px "+Math.round(h*22)+"px hsla(57,100%,0%,1)";
					document.querySelector(SEL_BASE).style.backgroundColor = "hsla("+~~((1-h)*360)+", 90%, 65%, "+h+")";
				}
				setTimeout(function(){longPressM(el)},50);
			}else{
				// slideに入ったので 元に戻す
				if(lap >= CLICK_LIMIT){
					el.style.boxShadow = "none";
					document.querySelector(SEL_BASE).style.backgroundColor = "transparent";
				}
			}
		}else{
			// 長押し完了
			el.style.boxShadow = "none";
			document.querySelector(SEL_BASE).style.backgroundColor = "transparent";
			if( confirm("Add scroll data to URL ?") ){
				let re, ar, data;
				// urlに自分のデータが入っていたら削除
				ar = location.href.split("?");
				ar[1] = (ar.length > 1) ? ar[1].replace(new RegExp('&?'+qstrS+'.+'+qstrE, ''), "") : "";
				data = oScroll.getQueryStr();
				if(data)
					location.href = ar[0] + "?" + ar[1] + (ar[1] ? "&" : "") + data;
				else
					alert("No data!");
			}
		}
	}else{
		// 中止処理
		el.style.boxShadow = "none";
		document.querySelector(SEL_BASE).style.backgroundColor = "transparent";
	}
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//# イベント関連

document.ontouchstart = function(){};		// for iOS

// ベースでタッチイベントのデフォルト動作を無効にする
document.querySelector(SEL_BASE).addEventListener("touchstart", function(e){
	e.preventDefault();
});

// base
document.querySelector(SEL_BASE).addEventListener("pointerenter", function(e){
	oBase.toOpaque(e.currentTarget);
});

document.querySelector(SEL_BASE).addEventListener("pointerleave", function(e){
	// 半透明になる時間をセット
	oBase.tmTranslucent = Date.now() + TM_OPAQUE;
});

// メインボタン DOWN
document.querySelector(SEL_MAINBUTTON).addEventListener("pointerdown", function(e){
	e.preventDefault();
	if(oBase.stat){
		oPointer.pntDown(e.target, e.clientX, e.clientY);
		longPressM(e.target);
		// ボタンの背景色を変更　＆　??msec後に透明に
		e.target.style.backgroundColor = "hsla(0,0%,80%,0.6)";
		setTimeout(function(el){
			el.style.backgroundColor = "transparent";
		}, CLICK_LIMIT-100, e.target);
	}
});

// メインボタン UP
document.querySelector(SEL_MAINBUTTON).addEventListener("pointerup", function(e){
	e.preventDefault();
	if(!oBase.stat)
		return;
	let a, bn;
	a = oPointer.pntUp(e.target, e.clientX, e.clientY);
	if(a === 1){
		bn = oButtons.add();
		oScroll.setBnoXY(bn);
	}
});

// メインボタン LEAVE for PC
document.querySelector(SEL_MAINBUTTON).addEventListener("pointerleave", function(e){
	e.preventDefault();
	oPointer.pntUp(null, e.clientX, e.clientY);
});

// メインボタン MOVE
document.querySelector(SEL_MAINBUTTON).addEventListener("pointermove", function(e){
	e.preventDefault();
	oPointer.pntMove(e.target, e.clientX, e.clientY);
});

// btns
document.querySelector(SEL_BTNS).addEventListener("pointerdown", function(e){
	e.preventDefault();
	if(oBase.stat){
		oPointer.pntDown(e.target, e.clientX, e.clientY);
		longPress(e.target);
		// ボタンの背景色を変更　＆　??msec後に透明に
		e.target.style.backgroundColor = "hsla(0,0%,80%,0.6)";
		setTimeout(function(el){
			el.style.backgroundColor = "transparent";
		}, CLICK_LIMIT-100, e.target);
	}
});

// btns
document.querySelector(SEL_BTNS).addEventListener("pointerup", function(e){
	if(!oBase.stat)
		return;
	e.preventDefault();
	if( oPointer.isDown() ){
		e.stopPropagation();
		oSlide.end(e.clientY);		// oPointer.pntUp()の前に
		let a = oPointer.pntUp(e.target, e.clientX, e.clientY);
		if(a === 1){
			let bn = oButtons.getNoByEle(e.target);
			oScroll.moveBnoXY(bn);
		}
	}
}, false);

// スライド中にポインターがボタンエリアから出た場合		スマホ用(PCは要素出るとイベント来ない)
document.querySelector(SEL_BTNFRAME).addEventListener("pointermove", function(e){
	if( oPointer.isDown() ){
		e.preventDefault();
		e.stopPropagation();
		let rect = e.currentTarget.getBoundingClientRect();
		if(e.clientX >= rect.left && e.clientX < rect.right && e.clientY >= rect.top && e.clientY < rect.bottom){
			oPointer.pntMove(e.target, e.clientX, e.clientY);
			oSlide.move(e.clientY);
			oSlide.moveY = e.clientY;	// 要素内で最後に動いたYを使うため保存(for PC)
		}else{
			oSlide.end(oSlide.moveY);
			oPointer.pntUp(null, e.clientX, e.clientY);
		}
	}
}, false);

// スライド中にポインターがボタンエリアから出た場合		PC用(タッチデバイスは leave駄目なので moveで監視)
///document.querySelector(`#${oBase.base_id}>div:nth-child(2)`).addEventListener("pointerleave", function(e){
document.querySelector(SEL_BTNFRAME).addEventListener("pointerleave", function(e){
	if( oPointer.isDown() ){
		oSlide.end(oSlide.moveY);
		oPointer.pntUp(null, e.clientX, e.clientY);
	}
});

document.querySelector(SEL_BTNFRAME).addEventListener("wheel", function(e){
	e.preventDefault();
	let delta = getDelta(e);
	oSlide.moveBy(delta*BTNWH/2);
	oSlide.adjust(0);
});


function getDelta(e){
	var delta;

	if(e.deltaY)
		delta = (e.deltaY > 0) ? 1:-1;
	else
		delta = (e.wheelDelta > 0) ? -1:1;
	return -delta;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//# 関数

// 要素を生成する
function cEle(e){
	return document.createElement(e);
}
// 親要素に子要素を追加する
function aChl(pe,ce){
	return pe.appendChild(ce);
}
// テキストノードを生成する
function cTxn(t){
	return document.createTextNode(t);
}


// 文字列(ss)から指定した２つの文字(fs,es)の間の文字列を切り取る
function strSlice(ss, fs, es){
	var idx0, idx1;
	idx0 = ss.indexOf(fs);
	if(idx0 < 0 || idx0 == ss.length-1)
		return "";
	idx1 = ss.indexOf(es, idx0+1);
	if(idx1 < 0)
		return "";
	return ss.slice(idx0+fs.length, idx1-ss.length);
}

// 自身のスクリプトタグを得る
function getCurrentScript(){
	if ( !document.currentScript ) {
		let scripts = document.getElementsByTagName('script');
		return scripts[scripts.length-1];
	}else
		return document.currentScript;
}
