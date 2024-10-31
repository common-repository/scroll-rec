=== Scroll-Rec ===
Contributors: nigemizu
Donate link: https://cssroller.com/
Tags: scroll, top, bottom, anywhere, position, record
Requires at least: 4.0
Tested up to: 5.9
Requires PHP: 5.6
Stable tag: 1.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Record the position of the page and scroll to it. You can scroll anywhere.

== Description ==

Scroll-Recは、現在のページ上の位置を記録して、そこにすぐに移動できるようにするプラグインです。投稿・固定ページでのみ使えます。長いページが多いサイトや学習系のサイトで使っていただければうれしいです。


[使い方]

ブラウザでページを開いたら、Scroll-Recがあるか確認します。通常は半透明で画面右下にあります。
マウスオーバーまたはタッチするとはっきり表示されます。

Scroll Recと書かれた長方形のボタンをクリック(またはタッチ)します。
正方形のボタンが追加されページ上の位置が記録されます。追加されたボタンをクリックすると記録された位置に戻れます。
ボタンはいくつでも追加できます。

ボタンが増えてくると最初の方で記録したボタンが上にかくれてしまいます。
かくれたボタンを表示させるには、どれでもいいので正方形のボタンを押してそのまま下にずらします。ボタン全体がスライドして上にかくれていたボタンが出てきます。PCならポインターを乗せてマウスホイールを回すでもOKです。

使わなくなったボタンを削除したい場合は、そのボタンを長押しします。２秒弱押し続けるとボタンが消えます。


次回訪問時に記録した位置をまた使いたい場合は次のようにします。

いちばん上のScroll Recと書かれた長方形のボタンを長押しします。
Add scroll data to url ? と聞いてくるので、はいを押します。
位置データを加えた urlでページが開かれます。(ブラウザアドレス欄のurlにデータが入っているのを確認)
このままページをブックマークします。ブックマークに位置データが加えられたurlが保存されます。
ブックマークから上で保存したこのページを開けば、Scroll-Recに位置を記録したボタンが最初から反映されています。
ただし、同じブラウザで前回と同様な設定(ブラウザ幅やフォントサイズ)になってないと移動位置がずれます(記録しているのはスクロール位置なので)。ページの内容が変わっている場合も同様です。


== Installation ==

1. Upload `plugin-name.php` to the `/wp-content/plugins/` directory
1. Activate the plugin through the 'Plugins' menu in WordPress
1. Place `<?php do_action('plugin_name_hook'); ?>` in your templates

== Frequently asked questions ==

= A question that someone might have =

An answer to that question.

== Screenshots ==

1. 
2. 

== Changelog ==

1.0

== Upgrade notice ==

1.0

== Arbitrary section 1 ==
