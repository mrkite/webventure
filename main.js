/********************** public functions *********************/

var gameState=0;	//init, playing, winning, losing, quiting
var gameChanged=false;	//save prompt
var lastViewed=0;	//last line viewed in text window

var selectedObjs,curSelection;
var selectedCtl=undefined;
var cmdReady=false;
var lastClick;
var cmdNumObjs,cmds,inQueue;
var queue,soundQueue,textQueue;

var titleWin;
var mainWin,commandsWin,textWin,selfWin,exitWin;
var textEdit;

var numObjects,numGlobals,numCmds,numAttrs,numGroups;
var attrShifts,attrMasks,attrIdxs;
var inventory;
var game;
var globals;

var activeCmd,destObject,deltaPt;

var saveName='';
var afterSave=function(){}

var halted=false;
var haltedAtEnd=false,haltedInSelection=false;
var isPaused=false;

function runMain()
{
	fatal("runmain");
	//TODO: runmain
}

function set(a,b,c)
{
	fatal("set");
}
function get(a,b)
{
	fatal("get");
	return 0;
}


function updateWindow(win)
{
	if (win==undefined) return;
	if (win.refCon==undefined) return;
	if (win==selfWin || get(win.refCon.id,6)==1)
	{
		if (win==mainWin)
		{
			var bmp=getGraphic(win.refCon.id*2);
			bmp.draw(mainWin.port,0,0);
		}
		else
			fill(win.port,winbg);
		for (var i=0;i<win.refCon.children.length;i++)
		{
			var bounds=drawObject(win.refCon.children[i].id,win,0);
			win.refCon.children[i].top=bounds.top;
			win.refCon.children[i].left=bounds.left;
			win.refCon.children[i].width=bounds.width;
			win.refCon.children[i].height=bounds.height;
		}
		if (win.kind==0xe && win.refCon.updateScroll)
			adjustScrolls(win);
	}
}

function menuSelect(item)
{
	switch (item)
	{
		case 0x100: doAbout(); break;
		case 0x101: checkNew(); break;
		case 0x102: checkOpen(); break;
		case 0x103:
			afterSave=function(){}
			doSave();
			break
		case 0x104:
			afterSave=function(){}
			saveDialog();
			break;
		case 0x105: checkQuit(); break;
		case 0x900: doVolume(); break;
		default:
			fatal("Unknown menuitem: "+item.toString(16));
	}
}

/********************** private functions *********************/

function drawObject(obj,win,flag)
{
	var x=get(obj,1);
	var y=get(obj,2);
	var off=get(obj,3);
	if (flag || !off || !get(obj,4))
	{
		var mode=1;
		if (off || flag)
			mode=0;
		else if (selectedObjs.indexOf(obj)!=-1)
			mode=2;
		var r=draw(obj,x-win.refCon.x,y-win.refCon.y,win.port,mode);
		r.top+=win.refCon.y;
		r.left+=win.refCon.x;
		return r;
	}
	return {top:0,left:0,width:0,height:0};
}

// calculates the bounds of the objects in the window, sends bounds to window
function adjustScrolls(win)
{
	var rect={top:0,left:0,right:0,bottom:0};
	win.refCon.updateScroll=false;
	for (var i=0;i<win.refCon.children.length;i++)
	{
		var child=win.refCon.children[i];
		if (rect.right==rect.left || rect.bottom==rect.top)
		{
			rect.top=child.top;
			rect.left=child.left;
			rect.bottom=child.top+child.height;
			rect.right=child.left+child.width;
		}
		else
		{
			rect.top=Math.min(rect.top,child.top);
			rect.left=Math.min(rect.left,child.left);
			rect.bottom=Math.max(rect.bottom,child.top+child.height);
			rect.right=Math.max(rect.right,child.left+child.width);
		}
	}
	if (rect.right==rect.left || rect.bottom==rect.top)
	{
		rect.top=win.refCon.y;
		rect.left=win.refCon.x;
		rect.bottom=win.refCon.y;
		rect.right=win.refCon.x;
	}
	else
	{
		if (rect.left>win.refCon.x)
			rect.left=win.refCon.x;
		if (rect.right<win.refCon.x)
			rect.right=win.refCon.x;
		if (rect.top>win.refCon.y)
			rect.top=win.refCon.y;
		if (rect.bottom<win.refCon.y)
			rect.bottom=win.refCon.y;
	}
	win.setScrollBounds(rect);
}

function doAbout()
{
	var dialog=getAboutWin();
	isPaused=true;
	dialog.show(function(){
		closeWindow(dialog);
		isPaused=false;
	});
}
function doVolume()
{
	var dialog=getVolumeWin();
	var vol=getSetting('volume');
	if (vol==null) vol=50;
	dialog.getItem(2).setValue(vol);
	isPaused=true;
	dialog.show(function(id){
		setSetting('volume',dialog.getItem(2).value);
		closeWindow(dialog);
		isPaused=false;
	});
}

function checkNew()
{
	if (!gameChanged)
		doNew();
	else
	{
		var dialog=getAskSave(0); //0=new
		isPaused=true;
		dialog.show(function(id){
			closeWindow(dialog);
			switch (id)
			{
				case 1: //yes
					afterSave=checkNew;
					doSave();
					break;
				case 2: //no
					doNew();
					break;
				case 3: //cancel
					isPaused=false;
					break;
			}
		});
	}
}
function doNew()
{
	saveName='';
	var g=getFile(resGetDefault());
	for (var i=0;i<numGroups;i++)
	{
		for (var o=0;o<numObjects;o++)
			game[i][o]=g.r16();
	}
	for (var i=0;i<numGlobals;i++)
		globals[i]=g.r16();
	reset();
	calculateRelations();
	textWin.setTitle(resGetUntitled());
	textEdit.html('');
	selectedCtl=1;
	curSelection=[get(1,0)];
	gameState=1;
	set(get(1,0),6,1);
	gameChanged=false;
	halted=false;
	haltedAtEnd=false;
	haltedInSelection=false;
	resetEngine();
	cmdReady=true;
	runMain();
}
function checkOpen()
{
	if (!gameChanged)
		openDialog();
	else
	{
		var dialog=getAskSave(1); //1=open
		isPaused=true;
		dialog.show(function(id){
			closeWindow(dialog);
			switch (id)
			{
				case 1: //yes
					afterSave=checkOpen;
					doSave();
					break;
				case 2: //no
					openDialog();
					break;
				case 3: //cancel
					isPaused=false;
					break;
			}
		});
	}
}
function openDialog()
{
	var dialog=getOpenDialog();
	isPaused=true;
	var list=dialog.getItem(3);
	var selectedItem=undefined;
	for (var i=0;i<window.localStorage.length;i++)
	{
		var title=window.localStorage.key(i);
		if (title==null) continue;
		var g=window.JSON.parse(window.localStorage.getItem(title).toString());
		if (g.game!=gamename) continue;
		var item=$(document.createElement('div'));
		item.addClass('listitem');
		item.mousedown(function(event){return false;});
		item.click(function(event){
			if (selectedItem) selectedItem.removeClass('active');
			selectedItem=$(event.target);
			selectedItem.addClass('active');
		});
		item.dblclick(function(event){
			dialog.getItem(1).obj.click();
		});
		item.text(title.toString());
		list.obj.append(item);
	}
	dialog.show(function(id){
		switch (id)
		{
			case 1: //open
				if (selectedItem==undefined) break;
				saveName=selectedItem.text();
				closeWindow(dialog);
				isPaused=false;
				doOpen();
				break;
			case 2: //cancel
				closeWindow(dialog);
				isPaused=false;
				break;
		}
	});
}
function doOpen()
{
	var g=window.JSON.parse(window.localStorage.getItem(saveName).toString());
	game=g.gamedata;
	globals=g.globals;
	reset();
	calculateRelations();
	textWin.setTitle(saveName);
	textEdit.html(g.text);
	lastViewed=textEdit.get(0).scrollHeight;
	textEdit.scrollTop(lastViewed);
	gameState=1;
	halted=false;
	haltedAtEnd=false;
	haltedInSelection=false;
	curSelection=[];
	selectedCtl=0;
	resetEngine();
	set(get(1,0),6,1);
	gameChanged=false;
	runMain();
}
function doSave()
{
	if (saveName=='')
		saveDialog();
	else
		save();
}
function saveDialog()
{
	var dialog=getSaveDialog();
	isPaused=true;
	var el=dialog.getItem(3);
	el.obj.focus();
	el.obj.keypress(function(event){
		if (event.which==13)
		{
			dialog.getItem(1).obj.click();
			return false;
		}
		return true;
	});
	var list=dialog.getItem(4);
	var selectedItem=undefined;
	for (var i=0;i<window.localStorage.length;i++)
	{
		var title=window.localStorage.key(i);
		if (title==null) continue;
		var game=window.JSON.parse(window.localStorage.getItem(title).toString());
		if (game.game!=gamename) continue;
		var item=$(document.createElement('div'));
		item.addClass('listitem');
		item.mousedown(function(event){return false;});
		item.click(function(event){
			if (selectedItem) selectedItem.removeClass('active');
			selectedItem=$(event.target);
			selectedItem.addClass('active');
			dialog.getItem(3).obj.val(selectedItem.text());
		});
		item.dblclick(function(event){
			dialog.getItem(1).obj.click();
		});
		item.text(title.toString());
		list.obj.append(item);
	}
	dialog.show(function(id){
		switch (id)
		{
			case 1: //save
				saveName=dialog.getItem(3).obj.val();
				closeWindow(dialog);
				isPaused=false;
				doSave();
				break;
			case 2: //cancel
				closeWindow(dialog);
				isPaused=false;
				afterSave();
				break;
		}
	});
}
function save()
{
	window.localStorage.setItem(saveName,window.JSON.stringify({game:gamename,gamedata:game,globals:globals,text:textEdit.html()}));
	textWin.setTitle(saveName);
	gameChanged=false;
	afterSave();
}
function checkQuit()
{
	if (!gameChanged)
	{
		gameState=4;
		runMain();
	}
	else
	{
		var dialog=getAskSave(2);	//2=quit
		isPaused=true;
		dialog.show(function(id){
			closeWindow(dialog);
			switch (id)
			{
				case 1: //yes
					afterSave=checkQuit;
					doSave();
					break;
				case 2: //no
					gameState=4;
					runMain();
					break;
				case 3: //cancel
					isPaused=false;
					break;
			}
		});
	}
}


function getSetting(key)
{
	var ca=document.cookie.split(';');
	var keysub='webventure_'+key+'=';
	for (var i=0;i<ca.length;i++)
	{
		var c=ca[i];
		while (c.charAt(0)==' ') c=c.substring(1,c.length);
		if (c.indexOf(keysub)==0) return unescape(c.substring(keysub.length,c.length));
	}
	return null;
}
function setSetting(key,value)
{
	var date=new Date();
	date.setTime(date.getTime()+365*24*60*60*1000);
	document.cookie="webventure_"+key+"="+escape(value)+"; expires="+date.toGMTString()+"; path=/";
}

function initVars()
{
	selectedCtl=0;
	activeCmd=undefined;
	curSelection=[];
	destObject=0;
	deltaPt={h:0,v:0};
	userInput='';
	cmdReady=false;
	lastClick=0;
}
