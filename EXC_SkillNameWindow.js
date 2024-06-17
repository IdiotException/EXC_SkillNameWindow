//=============================================================================
// 戦闘画面ウィンドウ情報変更プラグイン
// EXC_SkillNameWindow.js
// ----------------------------------------------------------------------------
// Copyright (c) 2024 IdiotException
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 1.0.0 2024-06-18
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 戦闘画面でスキル名、アイテム名を表示するウィンドウを追加します
 * @author IdiotException
 * @url https://github.com/IdiotException/EXC_SkillNameWindow
 * @help 戦闘画面でスキル名、アイテム名を表示するウィンドウを追加します
 * 
 * ゲームのデフォルトのフォント以外のフォントをスキル事に表示を変える場合は
 * スキルのメモ欄に以下のようなタグを追加してください
 * <NameFont:(フォント名)>
 * 
 * その際に、指定するフォントについては
 * プラグインパラメータ「使用するフォント」にすべて指定をしてください。
 * 
 * 追加されるウィンドウに表示するスキル名がツクール側と異なる場合には
 * スキルのメモ欄に以下のようなタグを追加してください
 * <DisplayName:(表示内容)>
 * 
 * ウィンドウに表示したくないスキル・アイテムには
 * スキルのメモ欄に以下のようなタグを追加してください
 * <Undisplay:true>
 * 
 * 利用規約
 *   MITライセンスです。
 *   作者に無断で改変、再配布が可能で、
 *   利用形態（商用、18禁利用等）についても制限はありません。
 * 
 * @param WindowPositionX
 * @text ウィンドウX位置
 * @desc ウィンドウの画面左端からの距離
 * @type number
 * @default 200
 * 
 * @param WindowPositionY
 * @text ウィンドウY位置
 * @desc ウィンドウの画面上端からの距離
 * @type number
 * @default 00
 * 
 * @param WindowHeight
 * @text ウィンドウ高さ
 * @desc ウィンドウの高さ
 * @type number
 * @default 60
 * 
 * @param WindowWidth
 * @text ウィンドウ幅
 * @desc ウィンドウの幅
 * @type number
 * @default 400
 * 
 * @param PaddingTop
 * @text 縦位置スペース
 * @desc ウィンドウ内で縦位置を調整するための値
 * @type number
 * @default 0
 * 
 * @param UsefontList
 * @text 使用するフォント
 * @desc 表示に使用するフォントの一覧
 * ゲーム側のデフォルトのみの場合は設定不要
 * @type struct<fontFile>[]
 */
 /*~struct~fontFile:
 *
 * @param fontName
 * @text フォント名
 * @desc タグ設定する際に指定する名称
 * @type string
 * 
 * @param fontfile
 * @text ファイル名
 * @desc 対象のフォントファイルのファイル名
 * fontsフォルダ内の拡張子含むファイル名を指定する
 * @type string
 * 
 */
const EXCSkillNameWindow = document.currentScript.src.match(/^.*\/(.+)\.js$/)[1];

(function() {
	"use strict";
	//--------------------------------------------------
	// 定数設定
	//--------------------------------------------------
	const FONT_NAME_PREFIX	= "EXC_SkillName_";
	const FONT_TAG			= "NameFont";
	const DISP_NAME_TAG 	= "DisplayName";
	const UNDISP_TAG		= "Undisplay";

	//パラメータ受取処理
	const parameters = PluginManager.parameters(EXCSkillNameWindow);
	const _windowX		= Number(parameters['WindowPositionX'] || 0);
	const _windowY		= Number(parameters['WindowPositionY'] || 0);
	const _windowWidth	= Number(parameters['WindowWidth'] || 0);
	const _windowHeight	= Number(parameters['WindowHeight'] || 0);
	const _topPadding	= Number(parameters['PaddingTop'] || 0);

	const _tempFontFileList	= JSON.parse(parameters.UsefontList || "[]");
	let _fontFileList = [];
	_tempFontFileList.forEach(el => _fontFileList.push(JSON.parse(el)));

	//--------------------------------------------------
	// 変数宣言
	//--------------------------------------------------
	// 追加するウィンドウを内部で使いまわすための宣言
	let _skillNameWindow;

	//--------------------------------------------------
	// Scene_Boot のオーバーライド
	//--------------------------------------------------
	// 使うフォントのロード
	const _EXC_Scene_Boot_loadGameFonts = Scene_Boot.prototype.loadGameFonts;
	Scene_Boot.prototype.loadGameFonts = function () {
		_EXC_Scene_Boot_loadGameFonts.call(this);
		for(let i = 0; i < _fontFileList.length; i++) {
			FontManager.load(FONT_NAME_PREFIX + _fontFileList[i].fontName, _fontFileList[i].fontfile);
		}
	};
	
	//--------------------------------------------------
	// Scene_Battle のオーバーライド
	//--------------------------------------------------
	// 表示用スプライトの追加
	const _EXC_Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
	Scene_Battle.prototype.createAllWindows = function() {
		_EXC_Scene_Battle_createAllWindows.call(this);

		// スキル名表示ウィンドウの追加
		_skillNameWindow = new Window_SkillName(new Rectangle(_windowX, _windowY, _windowWidth, _windowHeight));
		this.addWindow(_skillNameWindow);
		
		// 通常時は非表示
		_skillNameWindow.close();
	};

	//--------------------------------------------------
	// Window_BattleLog のオーバーライド
	//--------------------------------------------------
	const _EXC_Window_BattleLog_clear = Window_BattleLog.prototype.clear;
	Window_BattleLog.prototype.clear = function() {
		_EXC_Window_BattleLog_clear.call(this);
		// スキル名ウィンドウを非表示に
		if(_skillNameWindow.isOpen()){
			_skillNameWindow.close();
		}
	};

	const _EXC_Window_BattleLog_displayAction = Window_BattleLog.prototype.displayAction;
	Window_BattleLog.prototype.displayAction = function(subject, item) {
		_EXC_Window_BattleLog_displayAction.call(this, ...arguments);

		// スキル名ウィンドウを表示
		if (item.meta[UNDISP_TAG] != "true") {
			_skillNameWindow.contents.clear();
			// 特定フォントの指定がある場合切り替え
			if(item.meta[FONT_TAG]){
				_skillNameWindow.contents.fontFace = FONT_NAME_PREFIX + item.meta[FONT_TAG];
			} else {
				_skillNameWindow.resetFontSettings();
			}

			// 表示名勝指定がある場合切り替え
			let itemName = item.name;
			if(item.meta[DISP_NAME_TAG]){
				itemName = item.meta[DISP_NAME_TAG];
			}
			_skillNameWindow.drawText(itemName, 0, _topPadding, _skillNameWindow.itemWidth(), "center");
			_skillNameWindow.open();

		}
	};


	//-----------------------------------------------------------------------------
	// Window_SkillName
	//
	// 拡張性のため一応作っておく

	function Window_SkillName() {
		this.initialize(...arguments);
	}

	Window_SkillName.prototype = Object.create(Window_Base.prototype);
	Window_SkillName.prototype.constructor = Window_SkillName;

	Window_SkillName.prototype.initialize = function(rect) {
		Window_Base.prototype.initialize.call(this, rect);
	};

})();

