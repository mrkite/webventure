/********************** public functions *********************/
var startImage; //icom splash img object
var textLH=15; //line height of text window
var MBHeight=24; //height of menubar
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

	setTimeout(waitForLoad,10);
}

function showTitle()
{
	var title=resGetPath(6);
	var titleres=getFile(title);
	var bmp=decodeTitle(titleres);
	titleWin=createWindow(0,0,0,320,200);
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

function createMenus()
{
	var stock=[
		">L File \\H\x02\x00\r"+
		" LNew\\V*NnH\x01\x01\r"+
		" LOpen...\\*OoH\x02\x01\r"+
		" LSave\\*SsH\x03\x01\r"+
		" LSave As...\\VH\x04\x01\r"+
		" LQuit\\*QqH\x05\x01\r.",
		">L Edit \\H\x03\x00\r"+
		" LUndo\\DV*ZzH\xfa\x00\r"+
		" LCut\\D*XxH\xfb\x00\r"+
		" LCopy\\D*CcH\xfc\x00\r"+
		" LPaste\\DV*VvH\xfd\x00\r"+
		" LClear\\DH\xfe\x00\r.",
		">L Special \\H\x04\x00\r"+
		" LClean Up\\DH\x06\x01\r"+
		" LMess Up\\DH\x07\x01\r."
	];
	addMenu(resGetAppleMenu());
	for (var i=0;i<stock.length;i++)
		addMenu(stock[i]);
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

/********************** private functions *********************/
function getWindow(id)
{
	var w=resGetWindow(id);
	return createWindow(w.wFrame&~0x20,w.left,w.top,w.right-w.left,w.bottom-w.top);
}
