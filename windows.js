/********************** public functions *********************/

/**
 * @constructor
 */
function Win(klass,hasClose,hasZoom,vScroll,hScroll,left,top,width,height)
{
	var self=this;
	this.lastZoom=undefined;
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
			titleDown(event,self);
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
				closeClicked(event,self);
				return false;
			});
		}
		if (this.hasZoom)
		{
			var el=this.title.children('div.resize');
			el.mousedown(function(){return false;});
			el.click(function(event){
				zoomClicked(event,self);
				return false;
			});
		}
		this.win.append(this.title);
	}
	this.port=$(document.createElement('canvas'));
	this.port.mousedown(function(event){
		contentDown(event,self);
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
Win.prototype.show=function(doneCB)
{
	this.done=doneCB;
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
	var self=this;
	if (this.hScroll)
	{
		this.hscroll=$(document.createElement('div'));
		this.hscroll.addClass('hscroll');
		this.hscroll.css('top',(this.height-HScrollHeight)+'px');
		this.hscroll.css('width',(this.width-HScrollBucket)+'px');
		this.hscroll.mousedown(function(event){
			bringToFront(self);
			var pos=self.hslider.offset().left;
			if (event.pageX<pos)
				scroll(self,-20,0);
			else
				scroll(self,20,0);
			return false;
		});
		var leftarrow=$(document.createElement('div'));
		leftarrow.addClass('leftarrow');
		leftarrow.mousedown(function(){
			scroll(self,-5,0);
			return false;
		});
		this.hscroll.append(leftarrow);
		this.rightarrow=$(document.createElement('div'));
		this.rightarrow.addClass('rightarrow');
		this.rightarrow.css('left',(this.width-HScrollArrowRight-GrowWidth)+'px');
		this.rightarrow.mousedown(function(){
			scroll(self,5,0);
			return false;
		});
		this.hscroll.append(this.rightarrow);
		this.hslider=$(document.createElement('div'));
		this.hslider.addClass('slider');
		this.hslider.mousedown(function(event){
			dragSlider(self,event.pageX,true);
			return false;
		});
		this.hscroll.append(this.hslider);
		this.win.append(this.hscroll);
	}
	if (this.vScroll)
	{
		this.vscroll=$(document.createElement('div'));
		this.vscroll.addClass('vscroll');
		this.vscroll.css('left',(this.width-VScrollWidth)+'px');
		this.vscroll.css('height',(this.height-VScrollBucket-WinTitleHeight)+'px');
		this.vscroll.mousedown(function(event){
			bringToFront(self);
			var pos=self.vslider.offset().top;
			if (event.pageY<pos)
				scroll(self,0,-20);
			else
				scroll(self,0,20);
			return false;
		});
		var uparrow=$(document.createElement('div'));
		uparrow.addClass('uparrow');
		uparrow.mousedown(function(event){
			scroll(self,0,-5);
			return false;
		});
		this.vscroll.append(uparrow);
		this.downarrow=$(document.createElement('div'));
		this.downarrow.addClass('downarrow');
		this.downarrow.css('top',(this.height-VScrollArrowDown-GrowHeight-WinTitleHeight)+'px');
		this.downarrow.mousedown(function(event){
			scroll(self,0,5);
			return false;
		});
		this.vscroll.append(this.downarrow);
		this.vslider=$(document.createElement('div'));
		this.vslider.addClass('slider');
		this.vslider.mousedown(function(event){
			dragSlider(self,event.pageY,false);
			return false;
		});
		this.vscroll.append(this.vslider);
		this.win.append(this.vscroll);
	}
	this.grow=$(document.createElement('div'));
	this.grow.addClass('grow');
	this.grow.css('top',(this.height-GrowHeight)+'px');
	this.grow.css('left',(this.width-GrowWidth)+'px');
	this.grow.mousedown(function(event){
		if (isPaused) return false;
		bringToFront(self);
		var proxy=$(document.createElement('div'));
		proxy.addClass('resizeProxy');
		desktop.append(proxy);
		var pos=self.win.position();
		proxy.css('top',pos.top+'px');
		proxy.css('left',pos.left+'px');
		var x=self.win.width();
		var y=self.win.height();
		proxy.css('width',x+'px');
		proxy.css('height',y+'px');
		var oldX=event.pageX;
		var oldY=event.pageY;
		$(document).mousemove(function(event){
			var newx=x+(event.pageX-oldX);
			var newy=y+(event.pageY-oldY);
			if (newx>100)
			{
				x=newx;
				proxy.css('width',x+'px');
				oldX=event.pageX;
			}
			if (newy>100)
			{
				y=newy;
				proxy.css('height',y+'px');
				oldY=event.pageY;
			}
		});
		$(document).mouseup(function(event){
			$(document).unbind('mousemove');
			$(document).unbind('mouseup');
			proxy.remove();
			self.resize(x,y);
		});
		return false;
	});
	this.win.append(this.grow);
}
Win.prototype.resize=function(w,h)
{
	var deltaw=this.width-this.port.width();
	var deltah=this.height-this.port.height();
	this.width=w;
	this.height=h;
	this.win.css('width',w+'px');
	this.win.css('height',h+'px');
	if (this.hScroll)
	{
		this.hscroll.css('top',(h-HScrollHeight)+'px');
		this.hscroll.css('width',(w-HScrollBucket)+'px');
		this.rightarrow.css('left',(w-HScrollArrowRight-GrowWidth)+'px');
	}
	if (this.vScroll)
	{
		this.vscroll.css('left',(w-VScrollWidth)+'px');
		this.vscroll.css('height',(h-VScrollBucket-WinTitleHeight)+'px');
		this.downarrow.css('top',(h-VScrollArrowDown-GrowHeight-WinTitleHeight)+'px');
	}
	this.grow.css('top',(h-GrowHeight)+'px');
	this.grow.css('left',(w-GrowWidth)+'px');
	if (this.refCon)
	{
		this.port.attr('width',(w-deltaw));
		this.port.attr('height',(h-deltah));
		this.refCon.updateScroll=true;
		updateWindow(this);
	}
	else //text window
	{
		this.port.css('width',(w-deltaw));
		this.port.css('height',(h-deltah));
		lastViewed=this.port.get(0).scrollHeight;
		checkScroll();
	}
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
			var start=(left*(this.port.width()-HScrollBucketStart-HScrollArrowRight)/(max-min))|0;
			var end=(scale*(this.port.width()-HScrollBucketStart-HScrollArrowRight-HScrollPadding)/(max-min))|0;
			this.hslider.css('left',(start+HScrollBucketStart)+'px');
			this.hslider.css('width',end+'px');
		}
		else
		{
			this.hslider.css('left',HScrollBucketStart+'px');
			this.hslider.css('width',(this.port.width()-HScrollBucketStart-HScrollArrowRight)+'px');
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
			var start=(top*(this.port.height()-VScrollBucketStart-VScrollArrowDown)/(max-min))|0;
			var end=(scale*(this.port.height()-VScrollBucketStart-VScrollArrowDown-VScrollPadding)/(max-min))|0;
			this.vslider.css('top',(start+VScrollBucketStart)+'px');
			this.vslider.css('height',end+'px');
		}
		else
		{
			this.vslider.css('top',VScrollBucketStart+'px');
			this.vslider.css('height',(this.port.height()-VScrollBucketStart-VScrollArrowDown)+'px');
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
		var start=(top*(this.height-WinTitleHeight-GrowHeight-VScrollBucketStart-VScrollArrowDown)/(max-min))|0;
		var end=(bottom*(this.height-WinTitleHeight-GrowHeight-VScrollBucketStart-VScrollArrowDown-VScrollPadding)/(max-min))|0;
		this.vslider.css('top',(start+VScrollBucketStart)+'px');
		this.vslider.css('height',(end-start)+'px');
	}
	else
	{
		this.vslider.css('top',VScrollBucketStart+'px');
		this.vslider.css('height',(this.height-VScrollBucket-WinTitleHeight-VScrollArrowDown)+'px');
	}
}
Win.prototype.hit=function(x,y)
{
	var pos=this.win.offset();
	if (x>=pos.left && x<pos.left+this.win.width() &&
		y>=pos.top && y<pos.top+this.win.height())
	{
		pos=this.port.offset();
		if (x>=pos.left && x<pos.left+this.port.width() &&
			y>=pos.top && y<pos.top+this.port.height())
		{
			//in content
			return {id:3,win:this};
		}
		//in titlebar
		return {id:4,win:this};
	}
	return undefined;
}
Win.prototype.invert=function()
{
	var ctx=this.port.get(0).getContext('2d');
	var w=this.port.width();
	var h=this.port.height();
	var image=ctx.getImageData(0,0,w,h);
	for (var y=0;y<image.height;y++)
	{
		var imgofs=y*image.width*4;
		for (var x=0;x<image.width;x++)
		{
			image.data[imgofs++]^=0xff;
			image.data[imgofs++]^=0xff;
			image.data[imgofs++]^=0xff;
			image.data[imgofs++]=0xff;
		}
	}
	ctx.putImageData(image,0,0);
}
Win.prototype.param=function(p)
{
	for (var i=0;i<this.ctls.length;i++)
	{
		if (!this.ctls[i].getText) continue;
		var text=this.ctls[i].getText();
		var pos;
		do {
			pos=text.indexOf('^');
			if (pos>=0)
			{
				var prev=text.substr(0,pos);
				var idx=text.substr(pos+1,1);
				prev+=p[parseInt(idx,10)];
				prev+=text.substr(pos+2);
				this.ctls[i].setText(prev);
				text=prev;
			}
		} while (pos>=0);
	}
}
Win.prototype.getItem=function(id)
{
	for (var i=0;i<this.ctls.length;i++)
		if (this.ctls[i].refcon==id)
			return this.ctls[i];
	return undefined;
}
function scroll(win,x,y)
{
	if (win.kind==0xb) //textWin
	{
		win.port.scrollTop(win.port.scrollTop()+y);
		win.redrawTextScroll();
		var repeat=setTimeout(function(){scroll(win,x,y)},50);
		$(document).mouseup(function(event){
			$(document).unbind('mouseup');
			clearTimeout(repeat);
		});
		return;
	}
	win.refCon.x+=x;
	win.refCon.y+=y;
	if (win.hScroll)
	{
		var min=win.hslider.data('min');
		var max=win.hslider.data('max');
		if (win.refCon.x<min)
			win.refCon.x=min;
		if (win.refCon.x>max-win.port.width())
			win.refCon.x=max-win.port.width();
	}
	if (win.vScroll)
	{
		var min=win.vslider.data('min');
		var max=win.vslider.data('max');
		if (win.refCon.y<min)
			win.refCon.y=min;
		if (win.refCon.y>max-win.port.height())
			win.refCon.y=max-win.port.height();
	}
	win.refCon.updateScroll=true;
	updateWindow(win);
	var repeat=setTimeout(function(){scroll(win,x,y)},50);
	$(document).mouseup(function(event){
		$(document).unbind('mouseup');
		clearTimeout(repeat);
	});
}
function dragSlider(win,start,horiz)
{
	if (win.kind==0xb) //textWin
	{
		dragText(win,start);
		return;
	}
	var last=start;
	$(document).mousemove(function(event){
		if (horiz)
		{
			win.refCon.x+=event.pageX-last;
			last=event.pageX;
			var min=win.hslider.data('min');
			var max=win.hslider.data('max');
			if (win.refCon.x<min)
				win.refCon.x=min;
			if (win.refCon.x>max-win.port.width())
				win.refCon.x=max-win.port.width();
		}
		else
		{
			win.refCon.y+=event.pageY-last;
			last=event.pageY;
			var min=win.vslider.data('min');
			var max=win.vslider.data('max');
			if (win.refCon.y<min)
				win.refCon.y=min;
			if (win.refCon.y>max-win.port.height())
				win.refCon.y=max-win.port.height();
		}
		win.refCon.updateScroll=true;
		updateWindow(win);
	});
	$(document).mouseup(function(event){
		$(document).unbind('mouseup');
		$(document).unbind('mousemove');
	});
}
function dragText(win,start)
{
	var last=start;
	$(document).mousemove(function(event){
		var min=win.vslider.data('min');
		var max=win.vslider.data('max');
		var delta=(event.pageY-last)*(max-min)/(win.height-WinTitleHeight-GrowHeight-VScrollBucketStart-VScrollArrowDown)|0;
		last=event.pageY;
		win.port.scrollTop(win.port.scrollTop()+delta);
		win.redrawTextScroll();
	});
	$(document).mouseup(function(event){
		$(document).unbind('mouseup');
		$(document).unbind('mousemove');
	});
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

function findWindow(x,y)
{
	var pos=desktop.offset();
	//menubar
	if (y>=pos.top && y<pos.top+MBHeight && x>=pos.left && x<pos.left+desktop.width()) return {id:1,win:undefined};
	for (var i=0;i<wins.length;i++)
	{
		var info=wins[i].hit(x,y);
		if (info!=undefined) return info;
	}
	//desktop
	return {id:0,win:undefined};
}


/********************** private functions *********************/
var wins=[];

function titleDown(event,win)
{
	if (isPaused) return;
	dragWindow(event.pageX,event.pageY,win);
}
function dragWindow(x,y,win)
{
	var lastX=x;
	var lastY=y;
	bringToFront(win);
	$(document).mousemove(function(event){
		var pos=win.win.position();
		win.win.css('top',(pos.top+(event.pageY-lastY))+'px');
		win.win.css('left',(pos.left+(event.pageX-lastX))+'px');
		lastX=event.pageX;
		lastY=event.pageY;
	});
	$(document).mouseup(function(event){
		$(document).unbind('mousemove');
		$(document).unbind('mouseup');
		var pos=win.win.position();
		win.win.css('top',(pos.top+(event.pageY-lastY))+'px');
		win.win.css('left',(pos.left+(event.pageX-lastX))+'px');
	});
}
function contentDown(event,win)
{
	if (isPaused) return;
	bringToFront(win);
	switch (win.kind)
	{
		case 0x9: //commands
			dragWindow(event.pageX,event.pageY,win);
			break;
		case 0xa: //main
		case 0xe: //inventory
			var obj=findObjectAt(event.pageX,event.pageY,win);
			var canDrag=false;
			if (obj && !get(obj,3)) canDrag=true;
			handleObjectSelect(obj,win,event,canDrag);
			break;
		case 0xc: //selfwin
			var obj=findObjectAt(event.pageX,event.pageY,win);
			if (obj==1)
				handleObjectSelect(obj,win,event,false);
			else
				dragWindow(event.pageX,event.pageY,win);
			break;
		case 0xd: //exitwin
			handleObjectSelect(get(1,0),win,event,false);
			break;
	}
}
function findObjectAt(x,y,win)
{
	var pt={h:x,v:y};
	var obj=0;
	var i=win.refCon.children.length;
	win.globalToLocal(pt);
	while (i>0 && obj==0)
	{
		i--;
		obj=objHit(pt,win.refCon.children[i]);
	}
	return obj;
}
function closeClicked(event,win)
{
	if (isPaused) return;
	if (win.kind==0xe)
	{
		unselectall();
		selectObj(win.refCon.id);
		selectedCtl=2;
		activateCommand(2);
		cmdReady=true;
	}
	runMain();
}
function zoomClicked(event,win)
{
	if (isPaused) return;
	var pos=win.win.position();
	var save={x:pos.left,y:pos.top};
	save.w=win.win.width();
	save.h=win.win.height();
	if (win.lastZoom!=undefined)
	{
		win.win.css('left',win.lastZoom.x+'px');
		win.win.css('top',win.lastZoom.y+'px');
		win.resize(win.lastZoom.w,win.lastZoom.h);
	}
	else
	{
		//TODO: this should resize to fit contents.
		//for now, resize to fill desktop because I'm lazy
		win.win.css('left','0px');
		win.win.css('top',MBHeight+'px');
		win.resize(desktop.width(),desktop.height()-MBHeight);
	}
	win.lastZoom=save;
}
