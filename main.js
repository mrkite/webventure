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

var titleWin,diplomaWin;
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

var dragObject=undefined;

function runMain()
{
	if (gameState==4) //quit
	{
		window.location="index.html";
		return;
	}
	if (!halted)
		updateScreen(false);
	if (cmdReady || halted)
	{
		halted=false;
		if (runEngine())
		{
			halted=true;
			isPaused=true;
			return;
		}
		isPaused=false;
		if (updateScreen(true))
			return;
		updateCtls();
	}
	if (gameState==2 || gameState==3)
		endGame();
}
function updateScreen(pause)
{
	runQueue();
	var wait=printTexts();
	if (playSounds(pause)) wait=true;
	return wait;
}
function endGame()
{
	if (gameState==2) //win
	{
		closeAllWindows();
		var diploma=getDiploma();
		diplomaWin=getDiplomaWin();
		diplomaWin.show();
		diploma.draw(diplomaWin.port,0,0);
		doDiploma();
		gameState=4;
	}
	else if (gameState==3) //lose
	{
		updateCtls();
		var dialog=getLoseDialog();
		dialog.show(function(id) {
			closeWindow(dialog);
			switch (id)
			{
				case 1: //restart
					doNew();
					break;
				case 2: //quit
					gameState=4;
					runMain();
					break;
				case 3: //load
					openDialog();
					break;
			}
		});
	}
}
function doDiploma()
{
	var link=document.createElement('link');
	link.type="text/css";
	link.rel="stylesheet";
	link.href="print.css";
	link.media="print";
	$('head').append(link);

	var dialog=getDiplomaDialog();
	isPaused=true;
	var te=getDiplomaSignature();
	diplomaWin.add(te);
	te.obj.focus();
	dialog.show(function(id){
		switch (id)
		{
			case 1: //print
				te.obj.blur();
				window.print();
				break;
			case 2: //quit
				runMain();
				break;
		}
	});
}
function runQueue()
{
	while (queue.length)
	{
		var index;
		var biggest=0;
		for (var i=0;i<queue.length;i++)
		{
			if (queue[i].id>biggest)
			{
				biggest=queue[i].id;
				index=i;
			}
		}
		var item=queue.splice(index,1)[0];
		switch (item.id)
		{
			case 0x2:
				focusObjWin(item.val);
				break;
			case 0x3:
				openObject(item.val);
				break;
			case 0x4:
				closeObject(item.val);
				break;
			case 0x7:
				checkObject(item.val);
				break;
			case 0x8:
				reflectSwap(item.val);
				break;
			case 0xc:
				set(mainWin.refCon.id,6,0);
				set(get(1,0),6,1);
				break;
			case 0xd:
				toggleExits();
				break;
			case 0xe:
				zoomObject(item.val);
				break;
		}
	}
}
function focusObjWin(obj)
{
	if (obj)
	{
		var win=getObjectWindow(obj);
		if (win)
			bringToFront(win);
	}
}
function openObject(obj)
{
	if (getObjectWindow(obj)) return;
	if (obj==get(1,0))
	{
		setRefCon(obj,mainWin);
		updateWindow(mainWin);
		drawExits();
		var title=getText(obj);
		mainWin.setTitle(capitalize(title));
	}
	else
	{
		var p={h:get(obj,1),v:get(obj,2)};
		getParentWin(obj).localToGlobal(p);
		var title=getText(obj);
		var iw=getInventoryWindow();
		iw.setTitle(title);
		setRefCon(obj,iw);
		iw.refCon.updateScroll=true;
		var zoom=$(document.createElement('div'));
		zoom.addClass('zoom');
		desktop.append(zoom);
		zoom.css('top',p.v+'px');
		zoom.css('left',p.h+'px');
		zoom.css('width','0px');
		zoom.css('height','0px');
		zoom.animate({
			top:iw.top+'px',
			left:iw.left+'px',
			width:iw.width+'px',
			height:iw.height+'px'
			},500,"swing",function() {
				zoom.remove();
				iw.show();
				updateWindow(iw);
			}
		);
	}
}
function closeObject(obj)
{
	var info=tryClose(getObjectWindow(obj));
	if (info==undefined) return;
	var w=getParentWin(info.obj);
	if (w==undefined) return;
	var zoom=$(document.createElement('div'));
	zoom.addClass('zoom');
	desktop.append(zoom);
	zoom.css('top',info.top+'px');
	zoom.css('left',info.left+'px');
	zoom.css('width',info.width+'px');
	zoom.css('height',info.height+'px');
	var p={h:get(info.obj,1),v:get(info.obj,2)};
	w.localToGlobal(p);
	zoom.animate({
		top:p.v+'px',
		left:p.h+'px',
		width:'0px',
		height:'0px'
		},500,"swing",function() {
			zoom.remove();
			inventory.num--;
		}
	);
}
function checkObject(old)
{
	var changed=false;
	var id=old.obj;
	var i=inQueue.indexOf(id);
	if (i!=-1) inQueue.splice(i,1);
	if (id==1)
	{
		if (old.parent!=get(id,0))
			queue.push({id:0xc});
		if (old.offscreen!=get(id,3) ||
			old.invisible!=get(id,4))
			updateWindow(getParentWin(id));
	}
	else if (old.parent!=get(id,0) ||
		old.x!=get(id,1) ||
		old.y!=get(id,2))
	{
		var oldwin=getObjectWindow(old.parent);
		if (oldwin)
		{
			removeChild(oldwin,id);
			changed=true;
		}
		var newwin=getParentWin(id);
		if (newwin)
		{
			addChild(newwin,id);
			changed=true;
		}
	}
	else if (old.offscreen!=get(id,3) ||
		old.invisible!=get(id,4))
		updateWindow(getParentWin(id));
	if (get(id,8))
	{
		if (changed ||
			old.hidden!=get(id,0xb) ||
			old.exitx!=get(id,9) ||
			old.exity!=get(id,0xa))
			drawExit(id);
	}
	var win=getObjectWindow(id);
	var cur=id;
	var root=get(1,0);
	while (cur!=root)
	{
		if (cur==0 || !get(cur,6)) break;
		cur=get(cur,0);
	}
	if (cur==root)
	{
		if (win) return;
		queue.push({id:0x3,val:id}); //open
	}
	else
	{
		if (!win) return;
		queue.push({id:0x4,val:id}); //close
	}
	var children=getChildren(id,true);
	for (i=0;i<children.length;i++)
		queueObject(children[i]);
}
function reflectSwap(swap)
{
	var from=getObjectWindow(swap.from);
	var to=getObjectWindow(swap.to);
	var win=to;
	if (!to) win=from;
	if (win)
	{
		var str=getText(swap.to);
		win.setTitle(str);
		setRefCon(swap.to,win);
		win.refCon.updateScroll=true;
		updateWindow(win);
	}
}
function toggleExits()
{
	while (selectedObjs.length)
		hiliteExit(selectedObjs.pop());
}
function hiliteExit(obj)
{
	var ctl=exitWin.find(obj);
	if (ctl)
	{
		if (selectedObjs.indexOf(obj)!=-1)
			ctl.select();
		else
			ctl.deselect();
	}
	if (obj==get(1,0))
	{
		if (selectedObjs.indexOf(obj)!=-1)
			exitWin.addClass('selected');
		else
			exitWin.removeClass('selected');
	}
	updateWindow(getParentWin(obj));
}
function zoomObject(obj)
{
	desktop.append(dragObject);
	var pt={h:get(obj,1),v:get(obj,2)};
	getParentWin(obj).localToGlobal(pt);
	dragObject.animate({
		top:pt.v+'px',
		left:pt.h+'px'
		},300,"swing",function(){
			dragObject.remove();
		}
	);
}
function printTexts()
{
	if (textEdit.get(0).scrollheight==textEdit.innerHeight())
		calculatePartialHeight();
	while (textQueue.length)
	{
		var item=textQueue.splice(0,1)[0];
		switch (item.id)
		{
			case 1: //print number
				textEdit.append(item.val);
				gameChanged=true;
				break;
			case 2:
				textEdit.append('<br/>');
				gameChanged=true;
				break;
			case 3:
				sourceObject=item.val[1];
				targetObject=item.val[0];
				textEdit.append(getText(item.val[2]));
				gameChanged=true;
				break;
		}
	}
	return checkScroll();
}
function checkScroll()
{
	var toView=textEdit.get(0).scrollHeight;
	var canView=textEdit.innerHeight();
	textEdit.scrollTop(lastViewed-(lastViewed%textLH));
	var y=textEdit.scrollTop();
	lastViewed=y+canView;
	textWin.setScrollBounds({left:0,right:0,top:0,bottom:toView});
	if (lastViewed<toView)
	{
		clickToContinue();
		return true;
	}
	return false;
}
function calculatePartialHeight()
{
	var el=textEdit.clone();
	el.css('height','');
	el.css('visibility','hidden');
	$('body').append(el);
	lastViewed=el.innerHeight();
	el.remove();
	delete el;
}
function playSounds(pause)
{
	var delay=0;
	while (soundQueue.length)
	{
		var item=soundQueue.splice(0,1)[0];
		switch (item.id)
		{
			case 1:
				playSound(item.val);
				break;
			case 2:
				delay=playSound(item.val);
				break;
			case 3:
				//wait for sound to finish?
				break;
		}
	}
	if (pause && delay)
	{
		setTimeout(runMain,delay*1000);
		return true;
	}
	return false;
}

function set(obj,attr,val)
{
	if (attr==1 || attr==2) //x,y
		val=Math.round(val/XYScale);
	if (attr==0)
		setParent(obj,val);
	if (attr<0xc)
		queueObject(obj);
	var idx=attrIdxs[attr];
	val<<=attrShifts[attr];
	val&=attrMasks[attr];
	var oldval=game[idx][obj]&~attrMasks[attr];
	game[idx][obj]=val|oldval;
	gameChanged=true;
}
function get(obj,attr)
{
	var val;
	var idx=attrIdxs[attr];
	if (!(idx&0x80))
		val=game[idx][obj];
	else
	{
		var p=getObject(0,obj);
		if (p.length==0) return 0;
		idx&=0x7f;
		val=(p.charCodeAt(idx*2)&0xff)<<8;
		val|=p.charCodeAt(idx*2+1)&0xff;
	}
	val&=attrMasks[attr];
	var r=neg16(val>>attrShifts[attr]);
	if (attr==1 || attr==2) //x,y
		r*=XYScale;
	return r;
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
function drawExits()
{
	exitWin.killControls();
	var exits=getChildren(get(1,0),true);
	for (var i=0;i<exits.length;i++)
		drawExit(exits[i]);
}
function drawExit(obj)
{
	if (!get(obj,8)) return;
	var ctl=exitWin.find(obj);
	if (ctl)
		exitWin.remove(ctl);
	if (!get(obj,0xb) && get(obj,0)==get(1,0))
	{
		var left=get(obj,9);
		var top=get(obj,0xa);
		exitWin.add(getExit(left,top,obj));
	}
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

function queueObject(obj)
{
	if (inQueue.indexOf(obj)==-1)
	{
		inQueue.push(obj);
		var item={obj:obj};
		item.parent=get(obj,0);
		item.x=get(obj,1);
		item.y=get(obj,2);
		item.exitx=get(obj,9);
		item.exity=get(obj,0xa);
		item.hidden=get(obj,0xb);
		item.offscreen=get(obj,3);
		item.invisible=get(obj,4);
		queue.push({id:0x7,val:item});
	}
}
function setParent(obj,val)
{
	var o=game[0][obj];
	if (val==obj) return;
	var p=o*2;
	o=relations[p];
	while (o!=obj)
	{
		p=o*2+1;
		o=relations[p];
	}
	relations[p]=relations[o*2+1];
	p=val*2;
	o=relations[p];
	while (o && o<=obj)
	{
		p=o*2+1;
		o=relations[p];
	}
	relations[obj*2+1]=o;
	relations[p]=obj;
}

function neg16(v)
{
	if (v&0x8000)
		v=-((v^0xffff)+1);
	return v;
}
function getObjectWindow(obj)
{
	switch (obj)
	{
		case 0xfffc: return exitWin;
		case 0xfffd: return selfWin;
		case 0xfffe: return textWin;
		case 0xffff: return commandsWin;
	}
	return findObjectWindow(obj);
}

function getChildren(obj,recurs)
{
	var rels=[];
	var v=relations[obj*2];
	while (v)
	{
		rels.push(v);
		if (!recurs)
			rels=rels.concat(getChildren(v,false));
		v=relations[v*2+1];
	}
	return rels;
}
function getChildIdx(children,obj)
{
	var i;
	for (i=0;i<children.length && children[i].id!=obj;i++) {}
	if (i==children.length) return 0;
	return i+1;
}
function addChild(win,obj)
{
	if (win.refCon==undefined) return;
	var i;
	for (i=0;i<win.refCon.children.length && obj>win.refCon.children[i].id;i++) {}
	if (i==win.refCon.children.length || obj!=win.refCon.children[i].id)
	{
		var child={id:obj,top:0,left:0,width:0,height:0}
		win.refCon.children.splice(i,0,child);
		win.refCon.updateScroll=true;
		updateWindow(win);
	}
}
function removeChild(win,obj)
{
	if (win.refCon==undefined) return;
	var idx=getChildIdx(win.refCon.children,obj);
	if (idx==0) return;
	win.refCon.children.splice(idx-1,1);
	win.refCon.updateScroll=true;
	updateWindow(win);
}
function getParentWin(obj)
{
	if (obj==1) return selfWin;
	var parent=get(obj,0);
	if (!parent) return undefined;
	return getObjectWindow(parent);
}
function getInventoryRect()
{
	var x=inventory.left;
	var y=inventory.top;
	for (var i=0;i<inventory.num;i++)
	{
		x+=inventory.stepx;
		y+=inventory.stepy;
		if (y>=400-12)
			y=inventory.top;
		if (x>=640-12)
			x=inventory.left;
	}
	inventory.num++;
	return {top:y,left:x,width:inventory.width,height:inventory.height};
}
function setRefCon(obj,w)
{
	var children=getChildren(obj,true);
	w.refCon={id:obj,x:0,y:0,updateScroll:false,children:[]};
	var originx=0x7fff;
	var originy=0x7fff;
	for (var i=0;i<children.length;i++)
	{
		if (children[i]!=1)
		{
			var child={id:children[i],top:0,left:0,width:0,height:0};
			if (w!=mainWin)
			{
				var x=get(child,1);
				var y=get(child,2);
				if (originx>x) originx=x;
				if (originy>y) originy=y;
			}
			w.refCon.children.push(child);
		}
	}
	if (originx!=0x7fff) w.refCon.x=originx;
	if (originy!=0x7fff) w.refCon.y=originy;
	if (w!=mainWin) w.refCon.updateScroll=true;
}
