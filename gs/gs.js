/********************** public functions *********************/
var startImage; //icom splash img object
var textLH=15; //line height of text window
var MBHeight=24; //height of menubar
var XYScale=2; //scale x,y objects by 2

function initialize()
{
	var link=document.createElement('link');
	link.type="text/css";
	link.rel="stylesheet";
	link.href="gs.css";
	$('head').append(link);
	startImage=$(document.createElement('img'));
	startImage.attr('src','images/gs/start.png');
	startImage.css('width','100%');
	startImage.css('height','100%');
	desktop.append(startImage);

	loadGame(gamename);
	setTimeout(waitForLoad,10);
}

function showTitle()
{
	var title=resGetPath(6);
	var titleres=getFile(title);
	var bmp=decodeTitle(titleres);
	titleWin=createWindow('plainDBox',false,false,false,false,0,0,640,400);
	titleWin.show();
	fill(titleWin.port,0);
	bmp.draw(titleWin.port,0,0);
}

function loadFiles()
{
	var filemap=[3,1,2,0,5];
	for (var i=0;i<5;i++)
		loadFile(i,resGetPath(filemap[i]));
	loadGNRL();
	setHuff(getHuff());
	setPalettes();
}

function loadGNRL()
{
	var gnrl=resGetGNRL();
	numObjects=gnrl.numObjects;
	numGlobals=gnrl.numGlobals;
	numAttrs=gnrl.numAttributes;
	numGroups=gnrl.numGroups;
	attrIdxs=gnrl.attrIdxs;
	attrMasks=gnrl.attrMasks;
	attrShifts=gnrl.attrShifts;
	cmdNumObjs=gnrl.cmdNumObjs;
	inventory=resGetWindow(5);
	inventory.top*=2;
	inventory.left*=2;
	inventory.width=inventory.right*2-inventory.left;
	inventory.height=inventory.bottom*2-inventory.top;
	inventory.stepy=20;
	inventory.stepx=20;
	inventory.num=0;

	inQueue=[];
	initVars();
	selectedObjs=[];
	queue=[];
	soundQueue=[];
	textQueue=[];
	relations=new Array(numObjects*2);
}

function createWindows()
{
	commandsWin=getWindow(3);
	commandsWin.kind=9;
	commandsWin.addClass('commands');
	loadControls();
	mainWin=getWindow(0);
	mainWin.kind=0xa;
	textWin=getWindow(1);
	textWin.kind=0xb;
	textEdit=$(document.createElement('div'));
	textEdit.addClass('textEdit');
	textWin.setCanvas(textEdit);
	selfWin=getWindow(4);
	selfWin.kind=0xc;
	selfWin.refCon={id:0,x:0,y:0,children:[{id:1,top:0,left:0,width:0,height:0}]};
	exitWin=getWindow(2);
	exitWin.setTitle("Exits");
	exitWin.kind=0xd;
	exitWin.addClass('exits');
}
function loadControls()
{
	var locs=[
		{name:"3/SHADOWGATE",start:0xc0ee,diff:-0xcc8},
		{name:"3/DEJAVU",start:0xc0ee,diff:-0xcc8},
		{name:"3/DEJAVUII",start:0xfae,diff:0x42},
		{name:"3/UNINVITED",start:0xc0ee,diff:-0xcc8}
	];
	for (var i=0;i<locs.length;i++)
	{
		var f=getFile(locs[i].name);
		if (f)
		{
			for (var c=0;c<9;c++)
			{
				f.seek(locs[i].start+c*0xb,f.set);
				var top=f.r16le()*2;
				var left=f.r16le()*2;
				var height=f.r16le()*2-top;
				var width=f.r16le()*2-left;
				var refcon=f.r8();
				var flags=f.r16le();
				flags=(flags&0xf)|(flags&0xf0<<8);
				f.seek(locs[i].start+0x73+c*4,f.set);
				var ofs=f.r16le();
				f.seek(ofs+locs[i].diff);
				var bpr=f.r16le();
				var bits=f.read(bpr*height);
				f.seek(locs[i].start+0x97+c*4,f.set);
				ofs=f.r16le();
				f.seek(ofs+locs[i].diff);
				f.r16le();
				var selbits=f.read(bpr*height);
				commandsWin.add(createCtl([left,top,width,height],refcon,flags,[bpr,bits,selbits]));
			}
			break;
		}
	}
}
function setPalettes()
{
	var p=resGetPalette();
	palette=[];
	for (var i=0;i<16;i++)
	{
		var r=(p[i]>>8)&0xf;
		var g=(p[i]>>4)&0xf;
		var b=p[i]&0xf;
		palette.push(r*0x11);
		palette.push(g*0x11);
		palette.push(b*0x11);
	}
	paletteMap=resGetPaletteMap();
	winbg=resGetWindowColor();
}

function createMenus()
{
	var stock=[
		">L File \\H\x02\x00\r"+
		" LNew\\V*NnH\x00\x81\r"+
		" LOpen...\\*OoH\x02\x81\r"+
		" LSave\\*SsH\x03\x81\r"+
		" LSave As...\\VH\x04\x81\r"+
		" LQuit\\*QqH\x06\x81\r.",
		">L Edit \\H\x03\x00\r"+
		" LUndo\\DV*ZzH\x00\x82\r"+
		" LCut\\D*XxH\x02\x82\r"+
		" LCopy\\D*CcH\x03\x82\r"+
		" LPaste\\DV*VvH\x04\x82\r"+
		" LClear\\DH\x05\x82\r.",
		">L Special \\H\x04\x00\r"+
		" LClean Up\\DH\x00\x83\r"+
		" LMess Up\\DH\x01\x83\r."
	];
	addMenu(resGetAppleMenu());
	for (var i=0;i<stock.length;i++)
		addMenu(stock[i]);
}

function clickToContinue()
{
	commandsWin.hideControls();
	commandsWin.showControl(0xff);
	isPaused=true;
}
function continueClicked()
{
	commandsWin.hideControl(0xff);
	commandsWin.showControls();
	if (!checkScroll()) //are we still CtC?
		runMain();
}

function getExit(left,top,obj)
{
	var ctl=createCtl([left*2,top*2,14,12],obj,2,[]);
	return ctl;
}


// convert IIgs string to valid string
function toascii(str)
{
	var newstr='';
	for (var c=0;c<str.length;c++)
	{
		switch (str.charCodeAt(c))
		{
			case 13: newstr+='<br />'; break;
			case 63368: newstr+='&#224;'; break;
			case 63374: newstr+='&#233;'; break;
			default: newstr+=str.charAt(c); break;
		}
	}
	return newstr;
}

function getNouns(idx)
{
	return ["he","she","it"][idx-1];
}

function getPrefixes(attr)
{
	return ["the ","a ","an "][attr-1];
}

function intersectObj(obj,rect)
{
	var scrap={top:0,left:0,width:0,height:0};
	var bmp;
	if (bmp=getGraphic(obj*2))
	{
		scrap.width=bmp.width;
		scrap.height=bmp.height;
		if (sectRect(scrap,rect,scrap))
			return bmp.intersect(scrap);
	}
	return false;
}

function numCmdObjs()
{
	if (!selectedCtl) return 3000;
	return cmdNumObjs[selectedCtl];
}

function getObjBounds(obj)
{
	var rect={top:0,left:0,width:0,height:0};
	var win=getParentWin(obj);
	var child=0;
	if (win && win.refCon)
		child=getChildIdx(win.refCon.children,obj);
	if (child)
	{
		child--;
		if (emptyRect(win.refCon.children[child]))
		{
			var r=drawObject(obj,win,true);
			win.refCon.children[child].top=r.top;
			win.refCon.children[child].left=r.left;
			win.refCon.children[child].width=r.width;
			win.refCon.children[child].height=r.height;
		}
		rect.top=win.refCon.children[child].top;
		rect.left=win.refCon.children[child].left;
		rect.width=win.refCon.children[child].width;
		rect.height=win.refCon.children[child].height;
	}
	else
	{
		var bmp;
		if (bmp=getGraphic(obj*2))
		{
			rect.top=get(obj,2) * XYScale;
			rect.left=get(obj,1) * XYScale;
			rect.width=bmp.width;
			rect.height=bmp.height;
		}
		else
		{
			rect.top=0;
			rect.left=0;
			rect.width=0;
			rect.height=0;
		}
	}
	return rect;
}
function createProxy(obj)
{
	var img=getGraphic(obj*2);
	var w=img.width;
	var h=img.height;
	var drag=$(document.createElement('canvas'));
	drag.addClass('proxy');
	drag.attr('width',w);
	drag.attr('height',h);
	desktop.append(drag);
	img.draw(drag,0,0);
	return drag;
}

function objHit(pt,child)
{
	var obj=0;
	if (!get(child.id,4) &&
		inRect(pt,child))
	{
		var bmp;
		if (bmp=getGraphic(child.id*2))
		{
			if (bmp.hit(pt.h-child.left,pt.v-child.top))
				obj=child.id;
		}
		else obj=child.id;
	}
	return obj;
}

/********************** private functions *********************/
var hires=false;
function getWindow(id)
{
	var w=resGetWindow(id);
	var lt=w.left;
	var wd=w.right-w.left;
	if (!hires)
	{
		lt*=2;
		wd*=2;
	}
	return gsWindow(w.wFrame,lt,w.top*2,wd,(w.bottom-w.top)*2);
}
