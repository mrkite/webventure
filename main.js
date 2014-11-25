/********************** public functions *********************/

var gameState=0;	//init, playing, winning, losing, quiting
var gameChanged=false;	//save prompt
var lastViewed=0;	//last line viewed in text window

var selectedObjs,curSelection;
var selectedCtl=undefined;
var cmdReady=false;
var lastClick;
var lastClickTarget;
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
//		window.cefQuery({'request':"quit"});
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
	enableMenus();
}
function runEngine()
{
	if (haltedAtEnd)
	{
		haltedAtEnd=false;
		if (resume(false))
		{
			haltedAtEnd=true;
			return true;
		}
		return false;
	}
	if (haltedInSelection)
	{
		haltedInSelection=false;
		if (resume(false))
		{
			haltedInSelection=true;
			return true;
		}
		if (updateScreen(true))
			return true;
	}
	while (curSelection.length)
	{
		var obj=curSelection.shift();
		if ((gameState==0 || gameState==1) && isActiveObject(obj))
		{
			if (run(selectedCtl,obj,destObject,deltaPt))
			{
				haltedInSelection=true;
				return true;
			}
			if (updateScreen(true))
				return true;
		}
	}
	if (selectedCtl==1)
		gameChanged=false;
	else if (gameState==0 || gameState==1)
		if (run(3,selectedCtl,destObject,deltaPt))
		{
			haltedAtEnd=true;
			return true;
		}
	return false;
}
function isActiveObject(obj)
{
	if (!getAncestor(obj)) return false;
	if (numCmdObjs()>=2 && destObject>0 && !getAncestor(destObject))
		return false;
	if (selectedCtl!=5) return true;
	if (!isDraggable(obj)) return false;
	if (get(1,0)!=destObject) return true;
	var rect={top:0,left:0,width:mainWin.port.width(),height:mainWin.port.height()};
	rect.top-=get(obj,2) * XYScale + deltaPt.v * XYScale;
	rect.left-=get(obj,1) * XYScale + deltaPt.h * XYScale;
	return intersectObj(obj,rect);
}
function isDraggable(obj)
{
	return (get(obj,3)==0 &&
		get(obj,4)==0 &&
		get(obj,5)==0);
}
function getAncestor(obj)
{
	var root=get(1,0);
	while (obj!=0 && obj!=1 && obj!=root)
		obj=get(obj,0);
	return obj;
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
				case 3: //quit
					gameState=4;
					runMain();
					break;
				case 4: //load
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
		var p={h:get(obj,1) * XYScale,v:get(obj,2) * XYScale};
		getParentWin(obj).localToGlobal(p);
		globalToDesktop(p);
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
	var p={h:get(info.obj,1) * XYScale,v:get(info.obj,2) * XYScale};
	w.localToGlobal(p);
	globalToDesktop(p);
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
		old.x!=get(id,1) * XYScale ||
		old.y!=get(id,2) * XYScale)
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
	var pt={h:get(obj,1) * XYScale,v:get(obj,2) * XYScale};
	getParentWin(obj).localToGlobal(pt);
	globalToDesktop(pt);
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
	if (textEdit.get(0).scrollHeight==textEdit.innerHeight())
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
	lastViewed=y+canView+textLH;
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
      if (bmp != undefined)
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

function activateCommand(val)
{
	var cmd=commandsWin.find(val);
	if (cmd!=activeCmd)
	{
		if (activeCmd)
			activeCmd.deselect();
		activeCmd=cmd;
		if (cmd)
			cmd.select();
	}
}

function textEntry(txt,obj,target)
{
	targetObject=target;
	sourceObject=obj;
	var dialog=getTextDialog();
	dialog.param([getText(txt)]);
	var el=dialog.getItem(3);
	el.obj.keypress(function(event){
		if (event.which==13)
		{
			dialog.getItem(1).obj.mousedown();
			return false;
		}
		return true;
	});
	dialog.show(function(id){
		userInput=dialog.getItem(3).obj.val();
		if (id==1) //OK
			frames[0].state.push(0xffff);
		else
			frames[0].state.push(0);
		closeWindow(dialog);
		runMain();
	});
}

function menuSelect(item)
{
	switch (item)
	{
		case 0x100: doAbout(); break; //gs about
		case 0x8000: doAbout(); break; //mac about
		case 0x8100: checkNew(); break;
		case 0x8102: checkOpen(); break;
		case 0x8103:
			afterSave=function(){}
			doSave();
			break
		case 0x8104:
			afterSave=function(){}
			saveDialog();
			break;
		case 0x8106: checkQuit(); break;
		case 0x900: doVolume(); break;
		case 0x901: window.cefQuery({'request':"moregames"}); break;
		case 0x902: gameState = 2; runMain(); break;
		case 0x903: window.open(helpURL); break;
		case 0x8200: break; //undo
		case 0x8202: break; //cut
		case 0x8203: break; //copy
		case 0x8204: break; //paste
		case 0x8205: break; //clear
		case 0x8300: cleanUp(wins[0]); break; //clean up
		case 0x8301: messUp(wins[0]); break; //mess up
		default:
			fatal("Unknown menuitem: "+item.toString(16));
	}
}
window['menuSelect']=menuSelect;

function buttonClicked(btn,event)
{
	var win=btn.win;
	if (win.kind==2)
		return win.done(btn.refcon);
	if (win==exitWin)
		exitClicked(btn,event);
	else
		commandClicked(btn);
}
function exitClicked(btn,event)
{
	if (isPaused) return;
	handleObjectSelect(btn.refcon,exitWin,event,false);
}
function commandClicked(btn)
{
	if (btn.refcon==0xff)
	{
		continueClicked();
		return;
	}
	if (isPaused) return;
	if (activeCmd && btn!=activeCmd)
		activeCmd.deselect();
	selectedCtl=btn.refcon;
	activateCommand(selectedCtl);
	switch (numCmdObjs())
	{
		case 0:
			cmdReady=true;
			break;
		case 1:
			cmdReady=curSelection.length!=0;
			break;
		case 2:
			if (destObject>0)
				cmdReady=true;
			break;
	}
	runMain();
}

function handleObjectSelect(obj,win,event,canDrag)
{
	if (win==exitWin)
		win=mainWin;
	if (event.shiftKey)
	{
		if (!obj)
		{
			if (win.kind==0xe)
				doLasso(win,event,canDrag);
			else
			{
				if (curSelection.length==0 ||
					win!=getParentWin(curSelection[0]))
				{
					if (curSelection.indexOf(win.refCon.id)!=-1)
						unselectObj(win.refCon.id);
					else
						selectObj(win.refCon.id);
				}
				runMain();
			}
		}
		else
		{
			if (curSelection.indexOf(obj)!=-1)
				unselectObj(obj);
			else
				selectObj(obj);
			runMain();
		}
	}
	else
	{
		if (selectedCtl && curSelection.length && numCmdObjs()>1)
		{
			if (!obj)
				primaryObject(win.refCon.id);
			else
				primaryObject(obj);
			runMain();
		}
		else
		{
			if (!obj)
			{
				unselectall();
				if (win.kind==0xe)
					doLasso(win,event,canDrag);
				else
					obj=win.refCon.id;
			}
			if (obj)
			{
				if (isDoubleClick(event))
				{
					if (curSelection.indexOf(obj)==-1)
						unselectall();
					selectObj(obj);
					doubleClickObject(obj,win,event,canDrag);
				}
				else
				{
					if (curSelection.indexOf(obj)==-1)
						unselectall();
					selectObj(obj);
					singleClickObject(obj,win,event,canDrag);
				}
			}
		}
	}
}
function isDoubleClick(event)
{
	if (event.timeStamp-lastClick<=300 && event.target==lastClickTarget)
	{
		lastClick=0;
		lastClickTarget=undefined;
		return true;
	}
	return false;
}
function doLasso(win,start,canDrag)
{
	var bounds={};
	var pt={h:win.refCon.x,v:win.refCon.y};
	win.localToGlobal(pt);
	globalToDesktop(pt);
	bounds.minx=pt.h;
	bounds.miny=pt.v;
	bounds.maxx=pt.h+win.port.width();
	bounds.maxy=pt.v+win.port.height();
	var lasso=$(document.createElement('div'));
	lasso.addClass('lasso');
	desktop.append(lasso);
	var stpt={h:Math.floor(start.pageX / pageZoom),v:Math.floor(start.pageY / pageZoom)};
	globalToDesktop(stpt);
	lasso.css('top',stpt.v+'px');
	lasso.css('left',stpt.h+'px');
	lasso.css('width','0px');
	lasso.css('height','0px');
	$(document).mousemove(function(event){
		var evpt={h:Math.floor(event.pageX / pageZoom),v:Math.floor(event.pageY / pageZoom)};
		globalToDesktop(evpt);
		var sx=Math.max(Math.min(stpt.h,evpt.h),bounds.minx);
		var sy=Math.max(Math.min(stpt.v,evpt.v),bounds.miny);
		var ex=Math.min(Math.max(stpt.h,evpt.h),bounds.maxx);
		var ey=Math.min(Math.max(stpt.v,evpt.v),bounds.maxy);
		lasso.css('top',sy+'px');
		lasso.css('left',sx+'px');
		lasso.css('width',(ex-sx)+'px');
		lasso.css('height',(ey-sy)+'px');
	});
	$(document).mouseup(function(event){
		$(document).unbind('mousemove');
		$(document).unbind('mouseup');
		var evpt={h:Math.floor(event.pageX / pageZoom),v:Math.floor(event.pageY / pageZoom)};
		globalToDesktop(evpt);
		var sx=Math.max(Math.min(stpt.h,evpt.h),bounds.minx);
		var sy=Math.max(Math.min(stpt.v,evpt.v),bounds.miny);
		var ex=Math.min(Math.max(stpt.h,evpt.h),bounds.maxx);
		var ey=Math.min(Math.max(stpt.v,evpt.v),bounds.maxy);
		lasso.remove();
		var pt={h:sx,v:sy};
		desktopToGlobal(pt);
		win.globalToLocal(pt);
		var select={top:pt.v,left:pt.h,width:ex-sx,height:ey-sy};
		var h=[];
		for (var i=0;i<win.refCon.children.length;i++)
		{
			var obj=win.refCon.children[i].id;
			if (!get(obj,4))
			{
				select.left=pt.h-get(obj,1) * XYScale;
				select.top=pt.v-get(obj,2) * XYScale;
				if (intersectObj(obj,select))
					h.push(obj);
			}
		}
		if (start.shiftKey)
		{
			if (h.length==0)
			{
				if (curSelection.length==0 ||
					win!=getParentWin(curSelection[0]))
				{
					if (curSelection.indexOf(win.refCon.id)!=-1)
						unselectObj(win.refCon.id);
					else
						selectObj(win.refCon.id);
				}
			}
			else while (h.length)
			{
				var sel=h.shift();
				if (curSelection.indexOf(sel)!=-1)
					unselectObj(sel);
				else
					selectObj(sel);
			}
			runMain();
		}
		else
		{
			var obj;
			if (h.length==0)
				obj=win.refCon.id;
			else while (h.length)
			{
				obj=h.shift();
				selectObj(obj);
			}
			handleObjectSelect(obj,win,start,canDrag);
		}
	});
}
function doubleClickObject(obj,win,event,canDrag)
{
	var lastX=Math.floor(event.pageX / pageZoom);
	var lastY=Math.floor(event.pageY / pageZoom);
	var start={h:0,v:0};
	var moved=false;
	dragObject=undefined;
	if (canDrag)
	{
		$(document).mousemove(function(event){
			if (dragObject==undefined)
			{
				if (Math.abs(Math.floor(event.pageX / pageZoom)-lastX)+Math.abs(Math.floor(event.pageY / pageZoom)-lastY)<=7) return false;
				moved=true;
				dragObject=createProxy(obj);
				var child=getChildIdx(win.refCon.children,obj);
				if (child)
				{
					child--;
					start.h=win.refCon.children[child].left;
					start.v=win.refCon.children[child].top;
				}
				win.localToGlobal(start);
				globalToDesktop(start);
				dragObject.css('top',start.v+'px');
				dragObject.css('left',start.h+'px');
			}
			var pos=dragObject.position();
			dragObject.css('top',(pos.top+(Math.floor(event.pageY / pageZoom)-lastY))+'px');
			dragObject.css('left',(pos.left+(Math.floor(event.pageX / pageZoom)-lastX))+'px');
			lastX=Math.floor(event.pageX / pageZoom);
			lastY=Math.floor(event.pageY / pageZoom);
			return false;
		});
	}
	$(document).mouseup(function(event){
		var pos;
		if (canDrag)
		{
			$(document).unbind('mousemove');
			if (dragObject)
			{
				pos=dragObject.position();
				dragObject.remove();
			}
		}
		$(document).unbind('mouseup');
		if (moved)
		{
			deltaPt.h=pos.left;
			deltaPt.v=pos.top;
			var loc=getWindowLocation(Math.floor(event.pageX / pageZoom),Math.floor(event.pageY / pageZoom));
			destObject=loc.id;
			deltaPt.h-=start.h;
			deltaPt.v-=start.v;
			if (loc.win!=win)
			{
				win.localToGlobal(deltaPt);
				if (loc.win)
					loc.win.globalToLocal(deltaPt);
			}
      deltaPt.h = Math.round(deltaPt.h / XYScale);
      deltaPt.v = Math.round(deltaPt.v / XYScale);
			selectedCtl=5;
			activateCommand(5);
			cmdReady=true;
		}
		if (!cmdReady)
		{
			primaryObject(obj);
			if (!selectedCtl)
			{
				selectedCtl=4;
				activateCommand(4);
				cmdReady=true;
			}
		}
		runMain();
	});
}
function singleClickObject(obj,win,event,canDrag)
{
	var lastX=Math.floor(event.pageX / pageZoom);
	var lastY=Math.floor(event.pageY / pageZoom);
	var start={h:0,v:0};
	var moved=false;
	dragObject=undefined;
	if (canDrag)
	{
		$(document).mousemove(function(event){
			if (dragObject==undefined)
			{
				if (Math.abs(Math.floor(event.pageX / pageZoom)-lastX)+Math.abs(Math.floor(event.pageY / pageZoom)-lastY)<=7) return false;
				moved=true;
				dragObject=createProxy(obj);
				var child=getChildIdx(win.refCon.children,obj);
				if (child)
				{
					child--;
					start.h=win.refCon.children[child].left;
					start.v=win.refCon.children[child].top;
				}
				win.localToGlobal(start);
				globalToDesktop(start);
				dragObject.css('top',start.v+'px');
				dragObject.css('left',start.h+'px');
			}
			var pos=dragObject.position();
			dragObject.css('top',(pos.top+(Math.floor(event.pageY / pageZoom)-lastY))+'px');
			dragObject.css('left',(pos.left+(Math.floor(event.pageX / pageZoom)-lastX))+'px');
			lastX=Math.floor(event.pageX / pageZoom);
			lastY=Math.floor(event.pageY / pageZoom);
			return false;
		});
	}
	$(document).mouseup(function(event){
		lastClick=event.timeStamp;
		lastClickTarget=event.target;
		var pos;
		if (canDrag)
		{
			$(document).unbind('mousemove');
			if (dragObject)
			{
				pos=dragObject.position();
				dragObject.remove();
			}
		}
		$(document).unbind('mouseup');
		if (moved)
		{
			deltaPt.h=pos.left;
			deltaPt.v=pos.top;
			var loc=getWindowLocation(Math.floor(event.pageX / pageZoom),Math.floor(event.pageY / pageZoom));
			destObject=loc.id;
			deltaPt.h-=start.h;
			deltaPt.v-=start.v;
			if (loc.win!=win)
			{
				win.localToGlobal(deltaPt);
				if (loc.win)
					loc.win.globalToLocal(deltaPt);
			}
      deltaPt.h = Math.round(deltaPt.h / XYScale);
      deltaPt.v = Math.round(deltaPt.v / XYScale);
			selectedCtl=5;
			activateCommand(5);
			cmdReady=true;
		}
		if (numCmdObjs()==1)
			cmdReady=true;
		runMain();
	});
}
function unselectall()
{
	while (curSelection.length)
		unselectObj(curSelection.shift());
}
function selectObj(obj)
{
	if (curSelection.length)
	{
		if (getParentWin(obj)!=getParentWin(curSelection[0]))
			unselectall();
	}
	if (curSelection.indexOf(obj)==-1)
		curSelection.push(obj);
	if (selectedObjs.indexOf(obj)==-1)
	{
		selectedObjs.push(obj);
		hiliteExit(obj);
	}
}
function unselectObj(obj)
{
	var idx=curSelection.indexOf(obj);
	if (idx!=-1) curSelection.splice(idx,1);
	if ((idx=selectedObjs.indexOf(obj))!=-1)
	{
		selectedObjs.splice(idx,1);
		hiliteExit(obj);
	}
}
function primaryObject(obj)
{
	if (obj==destObject) return;
	var idx;
	if (destObject>0 &&
		(idx=selectedObjs.indexOf(destObject))!=-1 &&
		curSelection.indexOf(destObject)==-1)
	{
		selectedObjs.splice(idx,1);
		hiliteExit(destObject);
	}
	destObject=obj;
	if (selectedObjs.indexOf(destObject)==-1)
	{
		selectedObjs.push(destObject);
		hiliteExit(destObject);
	}
	cmdReady=true;
}

function inRect(pt,rect)
{
	if (pt.h>=rect.left && pt.v>=rect.top &&
		pt.h<rect.left+rect.width &
		pt.v<rect.top+rect.height) return true;
	return false;
}


/********************** private functions *********************/

function drawObject(obj,win,flag)
{
	var x=get(obj,1) * XYScale;
	var y=get(obj,2) * XYScale;
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
				case 3: //no
					doNew();
					break;
				case 2: //cancel
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
				case 3: //no
					openDialog();
					break;
				case 2: //cancel
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
		if (g['game']!=gamename) continue;
		var item=$(document.createElement('div'));
		item.addClass('listitem');
		item.mousedown(function(event){return false;});
		item.click(function(event){
			if (selectedItem) selectedItem.removeClass('active');
			selectedItem=$(event.target);
			selectedItem.addClass('active');
		});
		item.dblclick(function(event){
			dialog.getItem(1).obj.mousedown();
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
	game=g['gamedata'];
	globals=g['globals'];
	reset();
	calculateRelations();
	textWin.setTitle(saveName);
	textEdit.html(g['text']);
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
	el.obj.keypress(function(event){
		if (event.which==13)
		{
			dialog.getItem(1).obj.mousedown();
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
		if (game['game']!=gamename) continue;
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
			dialog.getItem(1).obj.mousedown();
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
	window.localStorage.setItem(saveName,window.JSON.stringify({'game':gamename,'gamedata':game,'globals':globals,'text':textEdit.html()}));
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
				case 3: //no
					gameState=4;
					runMain();
					break;
				case 2: //cancel
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
		item.x=get(obj,1) * XYScale;
		item.y=get(obj,2) * XYScale;
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
function neg8(v)
{
	if (v&0x80)
		v=-((v^0xff)+1);
	return v;
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

function getFamily(obj,recurs)
{
	var rels=[obj];
	return rels.concat(getChildren(obj,recurs));
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
				var x=get(children[i],1) * XYScale;
				var y=get(children[i],2) * XYScale;
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
function updateCtls()
{
	if (activeCmd!=undefined)
		activeCmd.deselect();
	toggleExits();
	initVars();
}
function getWindowLocation(x,y)
{
	var info=findWindow(x,y);
	var kind=0;
	if (info.win!=undefined) kind=info.win.kind;
	if (info.id==3 && (kind==0xe || kind==0xa)) //content
		info.id=info.win.refCon.id;
	else switch (kind)
	{
		case 0x9: info.id=-1; break;
		case 0xb: info.id=-2; break;
		case 0xc: info.id=-3; break;
		case 0xd: info.id=-4; break;
		default:
			switch (info.id)
			{
				case 0: info.id=-5; break; //nohit
				case 1: info.id=-6; break; //menubar
				case 2: info.id=-7; break; //dialog
				case 3: info.id=-8; break; //content
				case 4: info.id=-9; break; //indrag
				case 5: info.id=-10; break; //grow
				case 6: info.id=-11; break; //goaway
				default: info.id=-12; break; //zoom
			}
			break;
	}
	return info;
}
function desktopToGlobal(pt)
{
	var pos=desktop.offset();
	pt.v+=pos.top;
	pt.h+=pos.left;
}
function globalToDesktop(pt)
{
	var pos=desktop.offset();
	pt.v-=pos.top;
	pt.h-=pos.left;
}
function hasLocalStorage()
{
	try {
		return 'localStorage' in window && window['localStorage']!==null;
	} catch (e) {
		return false;
	}
}
function enableFeatureMenus()
{
	if (hasLocalStorage())
	{
		enableMenu(0x8102); //open
		enableMenu(0x8103); //save
		enableMenu(0x8104); //save as
	}
	else
	{
		disableMenu(0x8102); //open
		disableMenu(0x8103); //save
		disableMenu(0x8104); //save as
	}
	if (soundSupport)
		enableMenu(0x900); //volume
	else
		disableMenu(0x900); //volume
}
function enableMenus()
{
	if (wins[0].kind==0xe) //inventory
	{
		enableMenu(0x8300); //cleanup
		enableMenu(0x8301); //messup
	}
	else
	{
		disableMenu(0x8300); //cleanup
		disableMenu(0x8301); //messup
	}
	disableMenu(0x8200); //undo
	disableMenu(0x8202); //cut
	disableMenu(0x8203); //copy
	disableMenu(0x8204); //paste
	disableMenu(0x8205); //clear
}
function newLayout()
{
	return {width:8,items:[]};
}
function appendLayout(layout,child,children)
{
	layout.width+=8+children[child].width;
	layout.items.push(child);
}
function removeLayout(layout,idx,children)
{
	var child=layout.items[idx];
	layout.width-=8+children[child].width;
	layout.items.splice(idx,1);
	return child;
}
function removeOutlier(layout,flag,children,rect)
{
	var max=flag?0x7fff:-0x8000;
	var first=true;
	var outlier=-1;
	for (var i=0;i<layout.items.length;i++)
	{
		var child=layout.items[i];
		var oob=(children[child].top+children[child].height>
			rect.top+rect.height ||
			children[child].top>rect.top);
		if (flag) oob=!oob;
		if (first && oob)
		{
			first=false;
			max=flag?0x7fff:-0x8000;
		}
		if (first || oob)
		{
			var center=children[child].width/2|0;
			var over=false;
			if (flag)
				over=(max>=center);
			else
				over=(max<=center);
			if (over)
			{
				outlier=i;
				max=center;
			}
		}
	}
	return removeLayout(layout,outlier,children);
}
function cleanUp(win)
{
	var rect={};
	rect.top=win.refCon.y;
	rect.left=win.refCon.x;
	rect.width=win.port.width();
	rect.height=win.port.height();

	var children=win.refCon.children;

	var newLocs=[];

	var onScreen=newLayout();
	var offScreen=newLayout();
	var line=newLayout();
	var overflow=newLayout();

	for (var i=children.length-1;i>=0;i--)
	{
		var child=children[i];
		if (child.top+child.height>rect.top+rect.height ||
			child.top<rect.top)
			appendLayout(offScreen,i,children);
		else if (16+child.width>rect.width)
			appendLayout(offScreen,i,children);
		else
			appendLayout(onScreen,i,children);
	}
	var y=rect.top+8;
	while (onScreen.items.length || offScreen.items.length)
	{
		var min=0x7fff;
		var minidx=-1;
		var height=0;
		//find highest element onscreen
		for (var i=onScreen.items.length-1;i>=0;i--)
		{
			var child=onScreen.items[i];
			if (children[child].top<min)
			{
				min=children[child].top;
				height=children[child].height;
				minidx=i;
			}
		}
		if (minidx!=-1)
		{
			//remove it and put it on line
			appendLayout(line,removeLayout(onScreen,minidx,children),children);
			//along with all elements in same line
			var done;
			do {
				done=true;
				for (var i=onScreen.items.length-1;i>=0;i--)
				{
					var child=onScreen.items[i];
					if (children[child].top<min+height)
					{
						if (height<children[child].height)
						{
							done=false;
							height=children[child].height;
						}
						appendLayout(line,removeLayout(onScreen,i,children),children);
					}
				}
			} while (!done);
		}
		//line too long?  put items back onscreen
		while (line.items.length && line.width>rect.width)
			appendLayout(onScreen,removeOutlier(line,false,children,rect),children);
		//find line height
		height=0;
		for (var i=line.items.length-1;i>=0;i--)
		{
			var child=line.items[i];
			if (height<children[child].height)
				height=children[child].height;
		}
		//while there's room, add offscreen items
		while (offScreen.items.length && line.width<rect.width)
		{
			var idx=removeOutlier(offScreen,true,children,rect);
			if (onScreen.items.length && children[idx].height>height)
				appendLayout(overflow,idx,children);
			else if (line.width+8+children[idx].width<=rect.width)
			{
				//adjust line height
				if (height<children[idx].height)
					height=children[idx].height;
				appendLayout(line,idx,children);
			}
			else
				appendLayout(overflow,idx,children);
		}
		//move all overflow back offscreen
		while (overflow.items.length)
			appendLayout(offScreen,removeLayout(overflow,0,children),children);
		//is line empty? put one offscreen item on there
		if (!line.items.length && offScreen.items.length)
		{
			var idx=removeLayout(offScreen,0,children);
			if (height<children[idx].height)
				height=children[idx].height;
			appendLayout(line,idx,children);
		}
		var x=rect.left+8;
		//now add line to new positions
		while (line.items.length)
		{
			var idx=removeOutlier(line,true,children,rect);
			newLocs.push({id:children[idx].id,left:x,
				top:y+(height-children[idx].height)/2|0});
			x+=children[idx].width+8;
		}
		y+=height+8;
	}
	moveItems(newLocs,win);
}
function messUp(win)
{
	var rect={};
	rect.top=win.refCon.y;
	rect.left=win.refCon.x;
	rect.width=win.port.width();
	rect.height=win.port.height();

	var children=win.refCon.children;
	var newLocs=[];

	for (var i=0;i<children.length;i++)
	{
		var scale=rect.height-children[i].height;
		if (scale<0) scale=0;
		var y=(Math.random()*scale|0)+rect.top;
		scale=rect.width-children[i].width;
		if (scale<0) scale=0;
		var x=(Math.random()*scale|0)+rect.left;
		newLocs.push({id:children[i].id,left:x,top:y});
	}
	moveItems(newLocs,win);
}
// this should animate the items to their new location
// but it's really unnecessary
function moveItems(locs,win)
{
	for (var i=0;i<locs.length;i++)
	{
		var pt=getObjBounds(locs[i].id);
		if (pt.top!=locs[i].top || pt.left!=locs[i].left)
		{
			set(locs[i].id,1,Math.round(locs[i].left / XYScale));
			set(locs[i].id,2,Math.round(locs[i].top / XYScale));

		}
	}
	win.refCon.updateScroll=true;
	updateWindow(win);
}
