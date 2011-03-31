/********************** public functions *********************/

var gameState=0;	//init, playing, winning, losing, quiting
var gameChanged=false;	//save prompt
var lastViewed=0;	//last line viewed in text window

var selectedObjs,curSelection;

var mainWin,commandsWin,textWin,selfWin,exitWin;
var textEdit;


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
			rect.top=Math.mn(rect.top,child.top);
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
