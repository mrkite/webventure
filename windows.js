/********************** public functions *********************/

/**
 * @constructor
 */
function Win(klass,hasClose,hasZoom,vScroll,hScroll,left,top,width,height)
{
	this.ctls=[];
	this.hasZoom=hasZoom;
	this.hasClose=hasClose;
	this.vScroll=vScroll;
	this.hScroll=hScroll;
	this.win=$(document.createElement('div'));
	this.win.addClass(klass);
	if (klass=="document" || klass=="info" || klass=="noGrowDoc" || klass=="zoomDoc" || klass=="rDoc4")
	{
		var txt='<span></span>';
		this.title=$(document.createElement('div'));
		this.title.addClass('title');
		this.title.mousedown(function(event){
			titleDown(event);
			return false;
		});
		if (this.hasClose)
			txt='<div class="close"></div>'+txt;
		if (this.hasZoom)
			txt+='<div class="resize"></div>';
		this.title.html(txt);
		if (this.hasClose)
		{
			var el=this.title.children('div.close');
			el.mousedown(function(){return false;});
			el.click(function(event){
				closeClicked(event);
				return false;
			});
		}
		if (this.hasZoom)
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
	if (klass=="document" || klass=="noGrowDoc" || klass=="zoomDoc" || klass=="rDoc4")
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
		this.initScrollbars();
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
		var availSpace=this.port.width();
		if (this.hasClose) availSpace-=30;
		if (this.hasZoom) availSpace-=30;
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
	var w=this.port.attr('width');
	var h=this.port.attr('height');
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
Win.prototype.initScrollbars=function()
{
	if (this.hScroll)
	{
		this.hscroll=$(document.createElement('div'));
		this.hscroll.addClass('hscroll');
		this.hscroll.css('top',(this.height-HScrollHeight)+'px');
		this.hscroll.css('width',(this.width-HScrollBucket)+'px');
		this.hscroll.mousedown(function(event){
			fatal("scroll");
		});
		var leftarrow=$(document.createElement('div'));
		leftarrow.addClass('leftarrow');
		leftarrow.mousedown(function(){
			fatal("scroll");
		});
		this.hscroll.append(leftarrow);
		this.rightarrow=$(document.createElement('div'));
		this.rightarrow.addClass('rightarrow');
		this.rightarrow.css('left',(this.width-HScrollArrowRight-GrowWidth)+'px');
		this.rightarrow.mousedown(function(){
			fatal("scroll");
		});
		this.hscroll.append(this.rightarrow);
		this.hslider=$(document.createElement('div'));
		this.hslider.addClass('slider');
		this.hslider.mousedown(function(event){
			fatal("drag");
		});
		this.hscroll.append(this.hslider);
		this.win.append(this.hscroll);
	}
	if (this.vScroll)
	{
		this.vscroll=$(document.createElement('div'));
		this.vscroll.addClass('vscroll');
		this.vscroll.css('left',(this.width-VScrollWidth)+'px');
		this.vscroll.css('height',(this.height-VScrollBucket)+'px');
		this.vscroll.mousedown(function(event){
			fatal("scroll");
		});
		var uparrow=$(document.createElement('div'));
		uparrow.addClass('uparrow');
		uparrow.mousedown(function(event){
			fatal("scroll");
		});
		this.vscroll.append(uparrow);
		this.downarrow=$(document.createElement('div'));
		this.downarrow.addClass('downarrow');
		this.downarrow.css('top',(this.height-VScrollArrowDown-GrowHeight-WinTitleHeight)+'px');
		this.downarrow.mousedown(function(event){
			fatal("scroll");
		});
		this.vscroll.append(this.downarrow);
		this.vslider=$(document.createElement('div'));
		this.vslider.addClass('slider');
		this.vslider.mousedown(function(event){
			fatal("drag");
		});
		this.vscroll.append(this.vslider);
		this.win.append(this.vscroll);
	}
	this.grow=$(document.createElement('div'));
	this.grow.addClass('grow');
	this.grow.css('top',(this.height-GrowHeight)+'px');
	this.grow.css('left',(this.width-GrowWidth)+'px');
	this.grow.mousedown(function(event){
		fatal("grow");
	});
	this.win.append(this.grow);
}
Win.prototype.setScrollBounds=function(rect)
{
	if (this.kind==0xb) //text
	{
		this.vslider.data('min',rect.top);
		this.vslider.data('max',rect.bottom);
		this.redrawTextScroll();
		return;
	}
	if (rect.left>this.refCon.x)
		rect.left=this.refCon.x;
	if (rect.right<this.refCon.x+this.port.width())
		rect.right=this.refCon.x+this.port.width();
	if (rect.top>this.refCon.y)
		rect.top=this.refCon.y;
	if (rect.bottom<this.refCon.y+this.port.height())
		rect.bottom=this.refCon.y+this.port.height();
	if (this.hScroll)
	{
		this.hslider.data('min',rect.left);
		this.hslider.data('max',rect.right);
	}
	if (this.vScroll)
	{
		this.vslider.data('min',rect.top);
		this.vslider.data('max',rect.bottom);
	}
	this.redrawScroll();
}
Win.prototype.redrawScroll=function()
{
	if (this.hScroll)
	{
		var min=this.hslider.data('min');
		var max=this.hslider.data('max');
		if (min<max)
		{
			var left=this.refCon.x-min;
			var scale=this.port.width();
			var start=(left*(this.port.width()-HScrollBucket)/(max-min))|0;
			var end=(scale*(this.port.width()-HScrollBucket)/(max-min))|0;
			if (end>this.port.width()-HScrollBucket-start)
				end=this.port.width()-HScrollBucket-start;
			this.hslider.css('left',(start+HScrollBucketStart)+'px');
			this.hslider.css('width',end+'px');
		}
		else
		{
			this.hslider.css('left',HScrollBucketStart+'px');
			this.hslider.css('width',(this.port.width()-HScrollBucket)+'px');
		}
	}
	if (this.vScroll)
	{
		var min=this.vslider.data('min');
		var max=this.vslider.data('max');
		if (min<max)
		{
			var top=this.refCon.y-min;
			var scale=this.port.height();
			var start=(top*(this.port.height()-VScrollBucket)/(max-min))|0;
			var end=(scale*(this.port.height()-VScrollBucket)/(max-min))|0;
			if (end>this.port.height()-VScrollBucket-start)
				end=this.port.height()-VScrollBucket-start;
			this.vslider.css('top',(start+VScrollBucketStart)+'px');
			this.vslider.css('height',end+'px');
		}
		else
		{
			this.vslider.css('top',VScrollBucketStart+'px');
			this.vslider.css('height',(this.port.height()-VScrollBucket)+'px');
		}
	}
}
Win.prototype.redrawTextScroll=function()
{
	var y=this.port.scrollTop();
	var min=this.vslider.data('min');
	var max=this.vslider.data('max');
	if (min<max)
	{
		var top=y-min;
		var bottom=y+this.port.height();
		var start=(top*(this.height-VScrollBucket-WinTitleHeight-VScrollArrowDown)/(max-min))|0;
		var end=(bottom*(this.height-VScrollBucket-WinTitleHeight-VScrollArrowDown)/(max-min))|0;
		this.vslider.css('top',(start+VScrollBucketStart)+'px');
		this.vslider.css('height',(end-start)+'px');
	}
	else
	{
		this.vslider.css('top',VScrollBucketStart+'px');
		this.vslider.css('height',(this.height-VScrollBucket-WinTitleHeight-VScrollArrowDown)+'px');
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
function closeAllWindows()
{
	var toClose=[];
	for (var i=0;i<wins.length;i++)
	{
		if (wins[i].kind==0xe)
			toClose.push(wins[i]);
		else
			wins[i].hide();
	}
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
		win.win.addClass('active');
		return;
	}
	if (wins[0]!=undefined)
		wins[0].win.removeClass('active');
	for (var i=0;i<wins.length;i++)
		if (wins[i]==win)
			wins.splice(i,1);
	wins.unshift(win);
	win.win.addClass('active');
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

function findObjectWindow(obj)
{
	for (var i=0;i<wins.length;i++)
	{
		if (wins[i].kind==0xa || wins[i].kind==0xe)
		{
			if (wins[i].refCon!=undefined && wins[i].refCon.id==obj)
				return wins[i];
		}
	}
	return undefined;
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
