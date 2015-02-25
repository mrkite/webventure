/********************** public functions *********************/
var startImage;	//the icom splash img object
var textLH=15; //line height of text window
var MBHeight=19; //height of menubar
var XYScale=1; //don't scale

function initialize()
{
	var link=document.createElement('link');
	link.type="text/css";
	link.rel="stylesheet"
	link.href="mac.css";
	$('head').append(link);
	startImage=$(document.createElement('img'));
	startImage.attr('src','images/mac/start.png');
	startImage.css('width','100%');
	startImage.css('height','100%');
	desktop.append(startImage);

	loadGame(gamename);
	setTimeout(waitForLoad,10);
}

function showTitle()
{
	var title=resGetIndStr(0x81,2);
	var titleres=getResFile(title);
	var bmp;
	if (titleres!=undefined)
	{
		var id=openRes(titleres);
		bmp=decodePPIC(getRes('PPIC',0));
		closeRes(id);
	}
	else
		bmp=decodePack(getFile(title));
	titleWin=createWindow('plainDBox',false,false,false,false,0,0,512,342);
	titleWin.show();
	bmp.draw(titleWin.port,0,0);
}

function loadFiles()
{
	for (var i=0;i<5;i++)
		loadFile(i,resGetIndStr(0x81,i+4));
	loadGNRL(getRes('GNRL',0x80));
	var res=getRes('GNRL',0x83);
	if (res!=undefined)
	{
		var huff={};
		huff.length=res.r16();
		res.r16();
		huff.masks=new Array(huff.length);
		for (var i=0;i<huff.length-1;i++)
			huff.masks[i]=res.r16();
		huff.lens=new Array(huff.length);
		for (var i=0;i<huff.length;i++)
			huff.lens[i]=res.r8();
		huff.values=new Array(huff.length);
		for (var i=0;i<huff.length;i++)
			huff.values[i]=res.r8();
		setHuff(huff);
	}
}

function loadGNRL(data)
{
	numObjects=data.r16();
	numGlobals=data.r16();
	numCmds=data.r16();
	numAttrs=data.r16();
	numGroups=data.r16();
	data.r16(); //skip unknown
	inventory={};
	inventory.top=data.r16();
	inventory.left=data.r16();
	inventory.height=Math.floor(data.r16() * 1.5);
	inventory.width=data.r16();
	inventory.stepy=data.r16();
	inventory.stepx=data.r16();
	inventory.num=0;

	data.r16(); //font
	data.r16(); //fontsize

	attrIdxs=new Array(numAttrs);
	for (var i=0;i<numAttrs;i++)
		attrIdxs[i]=data.r8();
	attrMasks=new Array(numAttrs);
	for (var i=0;i<numAttrs;i++)
		attrMasks[i]=data.r16();
	attrShifts=new Array(numAttrs);
	for (var i=0;i<numAttrs;i++)
		attrShifts[i]=data.r8();
	cmdNumObjs=new Array(numCmds);
	for (var i=0;i<numCmds;i++)
		cmdNumObjs[i]=data.r8();
	cmds=new Array(numCmds);
	for (var i=0;i<numCmds;i++)
		cmds[i]=data.r8();

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
	commandsWin=getWindow(getRes('WIND',0x80));
	commandsWin.kind=9;
	commandsWin.addClass('commands');
	for (var i=0;i<numCmds;i++)
		if (cmds[i])
			commandsWin.add(getCtl(getRes('CNTL',0x81+i)));
	mainWin=getWindow(getRes('WIND',0x81));
	mainWin.kind=0xa;
	textWin=getWindowX(getRes('WIND',0x82));
	textWin.kind=0xb;
	textEdit=$(document.createElement('div'));
	textEdit.addClass('textEdit');
	textWin.setCanvas(textEdit);
	textWin.vScroll=true;
	textWin.initScrollbars();
	selfWin=getWindow(getRes('WIND',0x83));
	selfWin.kind=0xc;
	selfWin.refCon={id:0,x:0,y:0,children:[{id:1,top:0,left:0,width:0,height:0}]};
	exitWin=getWindow(getRes('WIND',0x84));
	exitWin.kind=0xd;
	exitWin.addClass('exits');
}

function createMenus()
{
	for (var i=0x80;i<=0x85;i++)
		getMenu(getRes('MENU',i));
}

var continueButton;
function clickToContinue()
{
	var w=commandsWin.port.width();
	var h=commandsWin.port.height();
	continueButton=createCtl([4,4,w-8,h-8],0xff,0x19,['Click to continue']);
	continueButton.obj.addClass('ctc');
	commandsWin.hideControls();
	commandsWin.add(continueButton);
	isPaused=true;
}
function continueClicked()
{
	commandsWin.remove(continueButton);
	commandsWin.showControls();
	delete continueButton;
	if (!checkScroll()) //are we still CtC?
		runMain();
}

function getExit(left,top,obj)
{
	var ctl=getCtl(getRes('CNTL',0x80));
	ctl.refcon=obj;
	moveControl(ctl,left,top);
	return ctl;
}

//convert mac string to valid string
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
			case 63401: newstr+='&#169;'; break;
			case 63433: newstr+='...'; break;
			case 63441: newstr+='&#8212;'; break;
			default: newstr+=str.charAt(c); break;
		}
	}
	return newstr;
}

function getNouns(idx)
{
	return resGetIndStr(0x84,idx);
}

function getPrefixes(attr)
{
	return resGetIndStr(0x83,attr);
}

function numCmdObjs()
{
	if (!selectedCtl) return 3000;
	return cmdNumObjs[selectedCtl-1];
}

function intersectObj(obj,rect)
{
	var scrap={top:0,left:0,width:0,height:0};
	var bmp;
	if (bmp=getGraphic(obj*2+1))
	{
		scrap.width=bmp.width;
		scrap.height=bmp.height;
		if (sectRect(scrap,rect,scrap))
			return bmp.intersect(scrap);
		return false;
	}
	if (bmp=getGraphic(obj*2))
	{
		scrap.width=bmp.width;
		scrap.height=bmp.height;
		return sectRect(scrap,rect,scrap);
	}
	return false;
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
		else if (bmp=getGraphic(obj*2+1))
		{
			rect.top=get(obj,2);
			rect.left=get(obj,1);
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
	var mask=getGraphic(obj*2+1);
	var w=img.width;
	var h=img.height;
	if (mask)
	{
		if (w<mask.width) w=mask.width;
		if (h<mask.height) h=mask.height;
	}
	var drag=$(document.createElement('canvas'));
	drag.addClass('proxy');
	drag.attr('width',w);
	drag.attr('height',h);
	desktop.append(drag);
	if (mask)
		mask.bic(drag,0,0);
	else
		fill(drag,0);
	img.xor(drag,0,0);
	return drag;
}

function objHit(pt,child)
{
	var obj=0;
	if (!get(child.id, 4))
	{
		// intersect
		var t = Math.max(pt.v - 5, child.top) - child.top;
		var l = Math.max(pt.h - 5, child.left) - child.left;
		var b = Math.min(pt.v + 5, child.top + child.height) - child.top;
		var r = Math.min(pt.h + 5, child.left + child.width) - child.left;
		if (b > t && r > l) //intersect
		{
			var bmp;
			if (bmp=getGraphic(child.id*2+1))
			{
				for (var y = t; y < b && !obj; y++)
					for (var x = l; x < r && !obj; x++)
						if (bmp.hit(x,y))
							obj=child.id;
			}
			else obj=child.id;
		}
	}
	return obj;
}

/********************** private functions *********************/
