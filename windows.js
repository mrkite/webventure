/**
 * @constructor
 */
function Win(type,close,left,top,width,height,screen,parent)
{
	var hscroll=undefined;
	var vscroll=undefined;
	var uparrow=undefined;
	var downarrow=undefined;
	var leftarrow=undefined;
	var rightarrow=undefined;
	var hslider=undefined;
	var vslider=undefined;
	var grow=undefined;
	var self=this;
	var ctls=[];
	var title=undefined;
	var zoom=(type=='zoomDoc');
	var win=$(document.createElement('div'));
	win.addClass(type);
	if (type!='plainDBox' && type!='altDBox' && type!='dBox')
	{
		var titlehtml='<span></span>';
		title=$(document.createElement('div'));
		title.addClass('title');
		title.mousedown(function(event) {
			titledown(event);
			return false;
		});
		if (close)
			titlehtml='<div class="close"></div>'+titlehtml;
		if (zoom)
			titlehtml+='<div class="resize"></div>';
		title.html(titlehtml);
		if (close)
		{
			var el=title.children('div.close');
			el.mousedown(function(){return false;});
			el.click(function(){
				closeClicked();
				return false;
			});
		}
		if (zoom)
		{
			var el=title.children('div.resize');
			el.mousedown(function(){return false;});
			el.click(function(){
				resizeClicked();
				return false;
			});
		}
		win.append(title);
	}
	this.port=$(document.createElement('canvas'));
	this.port.mousedown(function(event){
		contentDown(event);
		return false;
	});
	this.port.attr('width',width);
	this.port.attr('height',height);
	win.append(self.port);
	var frametop=top;
	var frameheight=height;
	var frameleft=left;
	var framewidth=width;
	if (title!=undefined)
	{
		frametop-=17;
		frameheight+=18;
	}
	if (type=='dBox')
	{
		frametop-=2;
		frameleft-=2;
		framewidth+=2;
		frameheight+=2;
	}
	win.css('top',frametop+'px');
	win.css('left',frameleft+'px');
	win.css('width',framewidth+'px');
	win.css('height',frameheight+'px');

	screen.append(win);


	this.show=function()
	{
		win.show();
	}
	this.hide=function()
	{
		win.hide();
	}
	this.setTitle=function(str)
	{
		if (title==undefined) return;
		var el=title.children('span');
		el.html('');
		if (str=='')
			el.hide();
		else
		{
			var washidden=win.css('display')=='none';
			win.show();
			el.css({position:'absolute', visibility:'hidden',display:'block'});
			var availSpace=width;
			if (close) availSpace-=30;
			if (zoom) availSpace-=30;
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
			if (washidden) win.hide();
		}
	}
	this.setCanvas=function(obj)
	{
		self.port.remove();
		obj.css('top','0px');
		obj.css('left','0px');
		obj.css('width',width+'px');
		obj.css('height',height+'px');
		win.append(obj);
	}
	this.addClass=function(klass)
	{
		win.addClass(klass);
	}
	this.removeClass=function(klass)
	{
		win.removeClass(klass);
	}
	this.add=function(ctl)
	{
		if (title!=undefined)
		{
			var t=parseInt(ctl.css('top'),10);
			ctl.css('top',(t+17)+'px');
		}
		win.append(ctl);
		ctl.data('win',self);
		ctls.unshift(ctl);
	}
	this.remove=function(ctl)
	{
		var idx=ctls.indexOf(ctl);
		if (idx!=-1)
			ctls.splice(idx,1);
		ctl.remove();
	}
	this.find=function(refcon)
	{
		for (var i=0;i<ctls.length;i++)
			if (ctls[i].data('refcon')==refcon)
				return ctls[i];
		return undefined;
	}
	this.killControls=function()
	{
		for (var i=0;i<ctls.length;i++)
			ctls[i].remove();
		ctls=[];
	}
	this.hideControls=function()
	{
		for (var i=0;i<ctls.length;i++)
			ctls[i].hide();
	}
	this.showControls=function()
	{
		for (var i=0;i<ctls.length;i++)
			ctls[i].show();
	}
	this.close=function()
	{
		win.remove();
	}
	this.globalToLocal=function(pt)
	{
		var pos=win.position();
		pt.h-=pos.left;
		pt.v-=pos.top;
		pos=self.port.position();
		pt.h-=pos.left;
		pt.v-=pos.top;
		pt.h+=self.refCon.x;
		pt.v+=self.refCon.y;
	}
	this.localToGlobal=function(pt)
	{
		var pos=win.position();
		pt.h+=pos.left;
		pt.v+=pos.top;
		pos=self.port.position();
		pt.h+=pos.left
		pt.v+=pos.top;
		pt.h-=self.refCon.x;
		pt.v-=self.refCon.y;
	}
	function titledown(event)
	{
		if (webventure.isPaused) return;
		drag(event.pageX,event.pageY);
	}
	function drag(x,y)
	{
		var lastX=x;
		var lastY=y;
		parent.bringToFront(self);
		$(document).mousemove(function(event){
			var pos=win.position();
			win.css('top',(pos.top+(event.pageY-lastY))+'px');
			win.css('left',(pos.left+(event.pageX-lastX))+'px');
			lastX=event.pageX;
			lastY=event.pageY;
		});
		$(document).mouseup(function(event){
			$(document).unbind('mousemove');
			$(document).unbind('mouseup');
			var pos=win.position();
			win.css('top',(pos.top+(event.pageY-lastY))+'px');
			win.css('left',(pos.left+(event.pageX-lastX))+'px');
		});
	}
	function contentDown(event)
	{
		if (webventure.isPaused) return;
		parent.bringToFront(self);
		switch (self.kind)
		{
			case 0x9: //commands
				drag(event.pageX,event.pageY);
				break;
			case 0xa: //main
			case 0xe: //inventory
				var obj=findObjectAt(event.pageX,event.pageY);
				var canDrag=false;
				if (obj && !webventure.get(obj,3)) canDrag=true;
				webventure.handleObjectSelect(obj,self,event,canDrag);
				break;
			case 0xb: //textwin
				break;
			case 0xc: //selfwin
				var obj=findObjectAt(event.pageX,event.pageY);
				if (obj==1)
					webventure.handleObjectSelect(obj,self,event,false);
				else
					drag(event.pageX,event.pageY);
				break;
			case 0xd: //exitwin
				webventure.handleObjectSelect(webventure.get(1,0),self,event,false);
				break;
		}
	}
	function closeClicked()
	{
		if (webventure.isPaused) return;
		if (self.kind==0xe)
		{
			webventure.unselectall();
			webventure.selectObj(self.refCon.id);
			webventure.selectedCtl=2;
			webventure.activateCommand(2);
			webventure.cmdReady=true;
		}
		webventure.runMain();
	}
	function findObjectAt(x,y)
	{
		var pt={h:x,v:y};
		var obj=0;
		var i=self.refCon.children.length;
		self.globalToLocal(pt);
		while (i>0 && obj==0)
		{
			i--;
			obj=webventure.objHit(pt,self.refCon.children[i]);
		}
		return obj;
	}
	this.hit=function(x,y)
	{
		var pos=win.position();
		if (x>=pos.left && x<pos.left+win.width() &&
			y>=pos.top && y<pos.top+win.height())
		{
			x-=pos.left;
			y-=pos.top;
			pos=self.port.position();
			if (x>=pos.left && x<pos.left+self.port.width() &&
				y>=pos.top && y<pos.top+self.port.height())
			{
				//in content
				return {id:3,win:self};
			}
			//in titlebar
			return {id:4,win:self};
		}
		return undefined;
	}
	this.invert=function()
	{
		var ctx=self.port.get(0).getContext('2d');
		var w=self.port.width();
		var h=self.port.height();
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
	this.param=function(p)
	{
		for (var i=0;i<ctls.length;i++)
		{
			var pos=ctls[i].text().indexOf('^');
			if (pos>=0)
			{
				var text=ctls[i].text().substr(0,pos);
				var idx=ctls[i].text().substr(pos+1,1);
				text+=p[parseInt(idx,10)];
				text+=ctls[i].text().substr(pos+2);
				ctls[i].text(text);
			}
		}
	}
	this.getItem=function(id)
	{
		for (var i=0;i<ctls.length;i++)
			if (ctls[i].data('refcon')==id)
				return ctls[i];
		return undefined;
	}
	this.scrollbars=function()
	{
		self.port.attr('width',width-15);
		self.port.attr('height',height-15);
		hscroll=$(document.createElement('div'));
		hscroll.addClass('hscroll');
		hscroll.css('top',(18+height-15)+'px');
		hscroll.css('left','0px');
		hscroll.css('width',(width-15)+'px');
		hscroll.css('height','14px');
		hscroll.mousedown(function(event){
			parent.bringToFront(self);
			var pos=hslider.position().left+win.position().left;
			if (event.pageX<pos)
				scroll(self,-20,0);
			else
				scroll(self,20,0);
			return false;
		});
		leftarrow=$(document.createElement('div'));
		leftarrow.addClass('leftarrow');
		leftarrow.css('top','0px');
		leftarrow.css('left','0px');
		leftarrow.css('width','14px');
		leftarrow.css('height','14px');
		leftarrow.mousedown(function(){
			scroll(self,-5,0);
			return false;
		});
		hscroll.append(leftarrow);
		rightarrow=$(document.createElement('div'));
		rightarrow.addClass('rightarrow');
		rightarrow.css('top','0px');
		rightarrow.css('left',(width-30)+'px');
		rightarrow.css('width','14px');
		rightarrow.css('height','14px');
		rightarrow.mousedown(function(){
			scroll(self,5,0);
			return false;
		});
		hscroll.append(rightarrow);
		hslider=$(document.createElement('div'));
		hslider.addClass('slider');
		hslider.css('top','0px');
		hslider.css('left','15px');
		hslider.css('width','30px');
		hslider.css('height','12px');
		hslider.mousedown(function(event){
			dragSlider(event.pageX,true);
			return false;
		});
		hscroll.append(hslider);
		win.append(hscroll);
		vscroll=$(document.createElement('div'));
		vscroll.addClass('vscroll');
		vscroll.css('top','17px');
		vscroll.css('left',(width-15)+'px');
		vscroll.css('width','14px');
		vscroll.css('height',(height-15)+'px');
		vscroll.mousedown(function(event){
			parent.bringToFront(self);
			var pos=vslider.position().top+win.position().top;
			if (event.pageY<pos)
				scroll(self,0,-20);
			else
				scroll(self,0,20);
			return false;
		});
		uparrow=$(document.createElement('div'));
		uparrow.addClass('uparrow');
		uparrow.css('top','0px');
		uparrow.css('left','0px');
		uparrow.css('width','14px');
		uparrow.css('height','14px');
		uparrow.mousedown(function(){
			scroll(self,0,-5);
			return false;
		});
		vscroll.append(uparrow);
		downarrow=$(document.createElement('div'));
		downarrow.addClass('downarrow');
		downarrow.css('top',(height-30)+'px');
		downarrow.css('left','0px');
		downarrow.css('width','14px');
		downarrow.css('height','14px');
		downarrow.mousedown(function(){
			scroll(self,0,5);
			return false;
		});
		vscroll.append(downarrow);
		vslider=$(document.createElement('div'));
		vslider.addClass('slider');
		vslider.css('top','15px');
		vslider.css('left','0px');
		vslider.css('width','12px');
		vslider.css('height','30px');
		vslider.mousedown(function(event){
			dragSlider(event.pageY,false);
			return false;
		});
		vscroll.append(vslider);
		win.append(vscroll);
		grow=$(document.createElement('div'));
		grow.addClass('grow');
		grow.css('top',(18+height-15)+'px');
		grow.css('left',(width-15)+'px');
		grow.css('width','14px');
		grow.css('height','14px');
		grow.mousedown(function(event){
			parent.bringToFront(self);
			var proxy=$(document.createElement('div'));
			proxy.addClass('resizeProxy');
			screen.append(proxy);
			var pos=win.position();
			proxy.css('top',pos.top+'px');
			proxy.css('left',pos.left+'px');
			var x=frameleft+framewidth;
			var y=frametop+frameheight;
			proxy.css('width',(x-frameleft)+'px');
			proxy.css('height',(y-frametop)+'px');
			var oldX=event.pageX;
			var oldY=event.pageY;
			$(document).mousemove(function(event){
				var newx=x+(event.pageX-oldX);
				var newy=y+(event.pageY-oldY);
				if (newx>frameleft+100)
				{
					x=newx;
					proxy.css('width',(x-frameleft)+'px');
					oldX=event.pageX;
				}
				if (newy>frametop+100)
				{
					y=newy;
					proxy.css('height',(y-frametop)+'px');
					oldY=event.pageY;
				}
			});
			$(document).mouseup(function(event){
				$(document).unbind('mousemove');	
				$(document).unbind('mouseup');
				proxy.remove();
				self.resize(x-frameleft,y-frametop);
			});
			return false;
		});
		win.append(grow);
	}
	this.setScrollBounds=function(rect)
	{
		if (rect.left>self.refCon.x)
			rect.left=self.refCon.x;
		if (rect.right<self.refCon.x+width-15)
			rect.right=self.refCon.x+width-15;
		if (rect.top>self.refCon.y)
			rect.top=self.refCon.y;
		if (rect.bottom<self.refCon.y+height-15)
			rect.bottom=self.refCon.y+height-15;
		hslider.data('min',rect.left);
		hslider.data('max',rect.right);
		vslider.data('min',rect.top);
		vslider.data('max',rect.bottom);
		redrawScroll();
	}
	this.resize=function(w,h)
	{
		framewidth=w;
		frameheight=h;
		height=h-18;
		width=framewidth;
		win.css('width',framewidth+'px');
		win.css('height',frameheight+'px');
		hscroll.css('top',(18+height-15)+'px');
		hscroll.css('width',(width-15)+'px');
		rightarrow.css('left',(width-30)+'px');
		vscroll.css('left',(width-15)+'px');
		vscroll.css('height',(height-15)+'px');
		downarrow.css('top',(height-30)+'px');
		grow.css('top',(18+height-15)+'px');
		grow.css('left',(width-15)+'px');
		self.port.attr('width',width);
		self.port.attr('height',height);
		self.refCon.updateScroll=true;
		webventure.updateWindow(self);
	}
	function redrawScroll()
	{
		var min=hslider.data('min');
		var max=hslider.data('max');
		if (min<max)
		{
			var left=self.refCon.x-min;
			var scale=width-15;
			var start=(left*(width-45)/(max-min))|0;
			var end=(scale*(width-45)/(max-min))|0;
			if (end>width-45-start)
				end=width-45-start;
			hslider.css('left',(start+15)+'px');
			hslider.css('width',(end-2)+'px');
		}
		else
		{
			hslider.css('left','15px');
			hslider.css('width',(width-47)+'px');
		}
		min=vslider.data('min');
		max=vslider.data('max');
		if (min<max)
		{
			var top=self.refCon.y-min;
			var scale=height-15;
			var start=(top*(height-45)/(max-min))|0;
			var end=(scale*(height-45)/(max-min))|0;
			if (end>height-45-start)
				end=height-45-start;
			vslider.css('top',(start+15)+'px');
			vslider.css('height',(end-2)+'px');
		}
		else
		{
			vslider.css('top','15px');
			vslider.css('height',(height-47)+'px');
		}
	}
	function scroll(win,x,y)
	{
		win.refCon.x+=x;
		win.refCon.y+=y;
		var min=hslider.data('min');
		var max=hslider.data('max');
		if (win.refCon.x<min)
			win.refCon.x=min;
		if (win.refCon.x>max-width+15)
			win.refCon.x=max-width+15;
		min=vslider.data('min');
		max=vslider.data('max');
		if (win.refCon.y<min)
			win.refCon.y=min;
		if (win.refCon.y>max-height+15)
			win.refCon.y=max-height+15;
		win.refCon.updateScroll=true;
		webventure.updateWindow(self);
		var repeat=setTimeout(function(){scroll(win,x,y)},50);
		$(document).mouseup(function(event){
			$(document).unbind('mouseup');
			clearTimeout(repeat);
		});
	}
	function dragSlider(start,horiz)
	{
		var last=start;
		$(document).mousemove(function(event){
			if (horiz)
			{
				self.refCon.x+=event.pageX-last;
				last=event.pageX;
				var min=hslider.data('min');
				var max=hslider.data('max');
				if (self.refCon.x<min)
					self.refCon.x=min;
				if (self.refCon.x>max-width+15)
					self.refCon.x=max-width+15;
			}
			else
			{
				self.refCon.y+=event.pageY-last;
				last=event.pageY;
				var min=vslider.data('min');
				var max=vslider.data('max');
				if (self.refCon.y<min)
					self.refCon.y=min;
				if (self.refCon.y>max-height+15)
					self.refCon.y=max-height+15;
			}
			self.refCon.updateScroll=true;
			webventure.updateWindow(self);
		});
		$(document).mouseup(function(event){
			$(document).unbind('mouseup');
			$(document).unbind('mousemove');
		});
	}
	function resizeClicked()
	{
		//TODO: resize window
	}
}
/**
 * @constructor
 */
function Dialog(type,close,left,top,width,height,items,screen,parent,ctls)
{
	var self=this;
	var win=new Win(type,close,left,top,width,height,screen,parent);
	win.kind=2;
	this.show=function()
	{
		win.show();
	}
	this.hide=function()
	{
		win.hide();
	}
	this.close=function()
	{
		win.close();
	}
	this.setTitle=function(title)
	{
		win.setTitle(title);
	}
	this.param=function(p)
	{
		win.param(p);
	}
	this.getItem=function(id)
	{
		return win.getItem(id);
	}
	this.add=function(ctl)
	{
		win.add(ctl);
	}
	this.addClass=function(klass)
	{
		win.addClass(klass);
	}
	this.removeClass=function(klass)
	{
		win.removeClass(klass);
	}
	if (items!=undefined)
	{
		var numitems=items.r16()+1;
		for (var i=0;i<numitems;i++)
		{
			items.r32(); //reserved
			var itop=items.r16();
			var ileft=items.r16();
			var iheight=items.r16()-itop;
			var iwidth=items.r16()-ileft;
			var itype=items.r8();
			var titleLen=items.r8();
			var ititle='';
			if (titleLen>0)
				ititle=webventure.mac2ascii(items.read(titleLen));
			if (titleLen&1) items.r8(); //align
			var ctl;
			switch (itype&0x7f)
			{
				case 4: //button
					ctl=ctls.create(ileft,itop,iwidth,iheight,0x00,ititle,true,0,0,0,i+1);
					win.add(ctl);
					break;
				case 8: //static text
					ctl=ctls.create(ileft,itop,iwidth,iheight,0x1100,ititle,true,0,0,0,i+1);
					win.add(ctl);
					break;
				case 0x10: //edit text
					ctl=ctls.create(ileft,itop,iwidth,iheight,0x1000,ititle,true,0,0,0,i+1);
					win.add(ctl);
					break;
				default:
					throw "Unknown DITL: "+(itype&0x7f);
			}
		}
	}
}
/**
 * @constructor
 */
function WindowManager(screen,resources,ctls)
{
	var self=this;
	var wins=[];
	this.create=function(title,type,vis,close,left,top,width,height)
	{
		var pos=screen.position();
		left+=pos.left;
		top+=pos.top;
		var win=new Win(type,close,left,top,width,height,screen,self);
		if (vis==false) win.hide();
		win.setTitle(title);
		self.bringToFront(win);
		return win;
	}
	this.createDialog=function(title,type,vis,close,left,top,width,height,items)
	{
		var pos=screen.position();
		left+=pos.left;
		top+=pos.top;
		var dlog=new Dialog(type,close,left,top,width,height,items,screen,self,ctls);
		if (vis==false) dlog.hide();
		dlog.setTitle(title);
		self.bringToFront(dlog);
		return dlog;
	}
	this.get=function(res)
	{
		var top=res.r16();
		var left=res.r16();
		var height=res.r16()-top;
		var width=res.r16()-left;
		var def=res.r16();
		var type='';
		switch (def)
		{
			case 0: type='document'; break;
			case 1: type='dBox'; break;
			case 2: type='plainDBox'; break;
			case 3: type='altDBox'; break;
			case 4: type='noGrowDoc'; break;
			case 5: type='movableDBox'; break;
			case 8: type='zoomDoc'; break;
			case 12: type='zoomNoGrow'; break;
			case 16: type='rDoc16'; break;
			case 18: type='rDoc4'; break;
			case 20: type='rDoc6'; break;
			case 22: type='rDoc10'; break;
		}
		var vis=res.r16()!=0;
		var close=res.r16()!=0;
		var refCon=res.r32();
		var titleLen=res.r8();
		var title='';
		if (titleLen!=1)
			title=webventure.mac2ascii(res.read(titleLen));
		return self.create(title,type,vis,close,left,top,width,height);
	}
	this.getDialog=function(res)
	{
		var top=res.r16();
		var left=res.r16();
		var height=res.r16()-top;
		var width=res.r16()-left;
		var def=res.r16();
		var type='';
		switch (def)
		{
			case 0: type='document'; break;
			case 1: type='dBox'; break;
			case 2: type='plainDBox'; break;
			case 3: type='altDBox'; break;
			case 4: type='noGrowDoc'; break;
			case 5: type='movableDBox'; break;
			case 8: type='zoomDoc'; break;
			case 12: type='zoomNoGrow'; break;
			case 16: type='rDoc16'; break;
			case 18: type='rDoc4'; break;
			case 20: type='rDoc6'; break;
			case 22: type='rDoc10'; break;
		}
		var vis=res.r8()!=0;
		res.r8(); //padding
		var close=res.r8()!=0;
		res.r8(); //padding
		var refCon=res.r32();
		var itemlist=res.r16();
		var titleLen=res.r8();
		var title='';
		if (titleLen!=1)
			title=webventure.mac2ascii(res.read(titleLen));
		var items=resources.get('DITL',itemlist);
		return self.createDialog(title,type,vis,close,left,top,width,height,items);
	}
	this.getAlert=function(res)
	{
		var top=res.r16();
		var left=res.r16();
		var height=res.r16()-top;
		var width=res.r16()-left;
		var itemlist=res.r16();
		var items=resources.get('DITL',itemlist);
		return self.createDialog('','dBox',true,false,left,top,width,height,items);
	}
	this.close=function(win)
	{
		for (var i=0;i<wins.length;i++)
			if (wins[i]==win)
			{
				win.close();
				wins.splice(i,1);
				break;
			}
		if (wins.length)
			self.bringToFront(wins[0]);
	}
	this.tryClose=function(win)
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
			self.close(win);
			return {obj:obj,top:tl.v,left:tl.h,width:br.h-tl.h,height:br.v-tl.v};
		}
	}
	this.find=function(obj)
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

	this.bringToFront=function(win)
	{
		if (wins[0]==win)
		{
			win.addClass('active');
			return;
		}
		if (wins[0]!=undefined)
			wins[0].removeClass('active');
		for (var i=0;i<wins.length;i++)
			if (wins[i]==win)
				wins.splice(i,1);
		wins.unshift(win);
		win.addClass('active');
	}
	this.findWindow=function(x,y)
	{
		var pos=screen.position();
		//menubar
		if (y>=pos.top && y<pos.top+20 && x>=pos.left && x<pos.left+screen.width()) return {id:1,win:undefined};
		for (var i=0;i<wins.length;i++)
		{
			var info=wins[i].hit(x,y);
			if (info!=undefined) return info;
		}
		//desktop
		return {id:0,win:undefined};
	}
	this.reset=function()
	{
		var toClose=[];
		for (var i=0;i<wins.length;i++)
		{
			if (wins[i].kind==0xa || wins[i].kind==0xe)
				toClose.push(wins[i]);
		}
		for (var i in toClose)
			self.tryClose(toClose[i]);
	}
	this.closeAll=function()
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
			self.tryClose(toClose[i]);
	}
}
