/********************** public functions *********************/

/**
 * @constructor
 */
function Win(klass,hasClose,hasZoom,vScroll,hScroll,left,top,width,height)
{
	this.ctls=[];
	this.zoom=hasZoom;
	this.close=hasClose;
	this.vScroll=vScroll;
	this.hScroll=hScroll;
	this.win=$(document.createElement('div'));
	this.win.addClass(klass);
	if (klass=="document" || klass=="info")
	{
		var txt='<span></span>';
		this.title=$(document.createElement('div'));
		this.title.addClass('title');
		this.title.mousedown(function(event){
			titleDown(event);
			return false;
		});
		if (this.close)
			txt='<div class="close"></div>'+txt;
		if (this.zoom)
			txt+='<div class="resize"></div>';
		this.title.html(txt);
		if (this.close)
		{
			var el=this.title.children('div.close');
			el.mousedown(function(){return false;});
			el.click(function(event){
				closeClicked(event);
				return false;
			});
		}
		if (this.zoom)
		{
			var el=this.title.children('div.resize');
			el.mousedown(function(){return false;});
			el.click(function(event){
				resizeClicked(event);
				return false;
			});
		}
		this.win.append(this.title);
	}
	this.port=$(document.createElement('canvas'));
	this.port.mousedown(function(event){
		contentDown(event);
		return false;
	});
	this.port.attr('width',width);
	this.port.attr('height',height);
	this.win.append(this.port);
	this.top=top;
	this.height=height;
	this.left=left;
	this.width=width;
	if (klass=="document")
	{
		this.top-=WinTitleHeight+WinBorder;
		this.height+=WinTitleHeight;
		this.left-=WinBorder;
	}
	else if (klass=="info")
	{
		this.top-=WinInfoHeight+WinBorder;
		this.height+=WinInfoHeight;
		this.left-=WinBorder;
	}
	else if (klass=="alert")
	{
		this.top-=WinAlertBorder*2;
		this.left-=WinAlertBorder*2;
		this.width+=WinAlertBorder;
		this.height+=WinAlertBorder;
	}
	else
	{
		this.top-=WinBorder;
		this.left-=WinBorder;
	}
	if (this.vScroll)
		this.width+=VScrollWidth;
	if (this.hScroll)
		this.height+=HScrollHeight;
	this.win.css('top',this.top+'px');
	this.win.css('left',this.left+'px');
	this.win.css('width',this.width+'px');
	this.win.css('height',this.height+'px');
	desktop.append(this.win);
	if (this.vScroll || this.hScroll)
		initScrollbars(this);
}
Win.prototype.show=function()
{
	this.win.show();
	this.showControls();
}
Win.prototype.hide=function()
{
	this.win.hide();
}
Win.prototype.setTitle=function(str)
{
	if (this.title==undefined) return;
	var el=this.title.children('span');
	el.html('');
	if (str=='')
		el.hide();
	else
	{
		var washidden=this.win.css('display')=='none';
		this.win.show();
		el.css({position:'absolute',visibility:'hidden',display:'block'});
		var availSpace=this.port.width;
		if (this.close) availSpace-=30;
		if (this.zoom) availSpace-=30;
		for (var i=0;i<str.length;i++)
		{
			el.append(str.substring(i,i+1));
			if (el.width()>availSpace)
			{
				el.html(str.substring(0,i-1));
				break;
			}
		}
		el.css({position:'',visibility:'',display:''});
		if (washidden) this.win.hide();
	}
}
Win.prototype.setCanvas=function(obj)
{
	var w=this.port.width();
	var h=this.port.height();
	this.port.remove();
	obj.css('top','0px');
	obj.css('left','0px');
	obj.css('width',w+'px');
	obj.css('height',h+'px');
	this.port=obj;
	this.win.append(obj);
}
Win.prototype.addClass=function(klass)
{
	this.win.addClass(klass);
}
Win.prototype.removeClass=function(klass)
{
	this.win.removeClass(klass);
}
Win.prototype.add=function(ctl)
{
	var o=this.port.position().top;
	var t=parseInt(ctl.obj.css('top'),10);
	ctl.obj.css('top',(t+o)+'px');
	this.win.append(ctl.obj);
	ctl.win=this;
	this.ctls.push(ctl);
	if (this.win.css('display')!='none')
		ctl.draw();
}
Win.prototype.remove=function(ctl)
{
	var idx=this.ctls.indexOf(ctl);
	if (idx!=-1)
		this.ctls.splice(idx,1);
	ctl.obj.remove();
}
Win.prototype.find=function(rc)
{
	for (var i=0;i<this.ctls.length;i++)
		if (this.ctls[i].refcon==rc)
			return this.ctls[i];
	return undefined;
}
Win.prototype.killControls=function()
{
	for (var i=0;i<this.ctls.length;i++)
		this.ctls[i].obj.remove();
	this.ctls=[];
}
Win.prototype.hideControls=function()
{
	for (var i=0;i<this.ctls.length;i++)
		this.ctls[i].hide();
}
Win.prototype.hideControl=function(rc)
{
	for (var i=0;i<this.ctls.length;i++)
		if (this.ctls[i].refcon==rc)
			this.ctls[i].hide();
}
Win.prototype.showControls=function()
{
	for (var i=0;i<this.ctls.length;i++)
		if (this.ctls[i].refcon!=0xff)
			this.ctls[i].show();
}
Win.prototype.showControl=function(rc)
{
	for (var i=0;i<this.ctls.length;i++)
		if (this.ctls[i].refcon==rc)
			this.ctls[i].show();
}
Win.prototype.close=function()
{
	this.win.remove();
}
Win.prototype.globalToLocal=function(pt)
{
	var pos=this.port.offset();
	pt.h-=pos.left+1;
	pt.v-=pos.top+2;
	if (this.refCon)
	{
		pt.h+=this.refCon.x;
		pt.v+=this.refCon.y;
	}
}
Win.prototype.localToGlobal=function(pt)
{
	var pos=this.port.offset();
	pt.h+=pos.left+1;
	pt.v+=pos.top+2;
	if (this.refCon)
	{
		pt.h-=this.refCon.x;
		pt.v-=this.refCon.y;
	}
}

function resetWindows()
{
	var toClose=[];
	for (var i=0;i<wins.length;i++)
		if (wins[i].kind==0xa || wins[i].kind==0xe)
			toClose.push(wins[i]);
	for (var i in toClose)
		tryClose(toClose[i]);
}
function closeWindow(win)
{
	for (var i=0;i<wins.length;i++)
		if (wins[i]==win)
		{
			win.close();
			wins.splice(i,1);
			break;
		}
	if (wins.length)
		bringToFront(wins[0]);
}
function tryClose(win)
{
	if (win==undefined) return undefined;
	var obj=win.refCon.id;
	if (win.kind==0xa)
	{
		win.refCon={};
		win.setTitle('');
		return undefined;
	}
	else
	{
		var tl={v:0,h:0};
		var br={v:win.port.height(),h:win.port.width()};
		win.localToGlobal(tl);
		win.localToGlobal(br);
		win.refCon={};
		closeWindow(win);
		return {obj:obj,top:tl.v,left:tl.h,width:br.h-tl.h,height:br.v-tl.v};
	}
}

function bringToFront(win)
{
	if (wins[0]==win)
	{
		win.obj.addClass('active');
		return;
	}
	if (wins[0]!=undefined)
		wins[0].obj.removeClass('active');
	for (var i=0;i<wins.length;i++)
		if (wins[i]==win)
			wins.splice(i,1);
	wins.unshift(win);
	win.obj.addClass('active');
}

function createWindow(klass,hasClose,hasZoom,vScroll,hScroll,left,top,width,height)
{
	var win=new Win(klass,hasClose,hasZoom,vScroll,hScroll,left,top,width,height);
	win.hide();
	bringToFront(win);
	return win;
}

function createAlert(left,top,width,height)
{
	var win=new Win("alert",false,false,false,false,left,top,width,height);
	win.kind=2;
	win.hide();
	bringToFront(win);
	return win;
}

/********************** private functions *********************/
var wins=[];

function titleDown(event)
{
	if (isPaused) return;
	fatal(event);
}
function contentDown(event)
{
	if (isPaused) return;
	fatal(event);
}
function closeClicked(event)
{
	if (isPaused) return;
	fatal(event);
}
function resizeClicked(event)
{
	if (isPaused) return;
	fatal(event);
}
function initScrollbars(win)
{
	fatal("initscroll");
}
