function ControlManager()
{
	this.create=function(left,top,width,height,cdef,title,vis,value,min,max,refcon)
	{
		switch (cdef>>4)
		{
			case 0x00: //button
				return newButton(left,top,width,height,title,vis,refcon);
			case 0x80: //custom button
				return newCButton(left,top,width,height,title,vis,refcon);
			case 0x100: //text entry
				return newInput(left,top,width,height,title,vis,refcon);
			case 0x110: //static text
				return newText(left,top,width,height,title,vis,refcon);
			case 0x120: //list box
				return newList(left,top,width,height,vis,refcon);
			case 0x130: //hslider
				return newHSlider(left,top,width,height,value,min,max,vis,refcon);
			default:
				console.log("Unknown CDEF:"+cdef);
				this.die();
		}
	}
	this.get=function(res)
	{
		var top=res.r16();
		var left=res.r16();
		var height=res.r16()-top;
		var width=res.r16()-left;
		var value=res.r16();
		var vis=res.r8()!=0;
		res.r8(); //fill
		var max=res.r16();
		var min=res.r16();
		var cdef=res.r16();
		var refcon=res.r32();
		var titleLen=res.r8();
		var title='';
		if (titleLen!=0)
			title=res.read(titleLen);
		return this.create(left,top,width,height,cdef,title,vis,value,min,max,refcon);
	}
	this.move=function(ctl,x,y)
	{
		var pos=ctl.position();
		ctl.css('left',(pos.left+x)+'px');
		ctl.css('top',(pos.top+y)+'px');
	}
	function newButton(left,top,width,height,title,vis,refcon)
	{
		var btn=$(document.createElement('div'));
		btn.addClass('button');
		btn.css('top',top+'px');
		btn.css('left',left+'px');
		btn.css('width',(width-2)+'px');
		btn.css('height',(height-2)+'px');
		btn.css('line-height',(height-2)+'px');
		btn.html(title);
		btn.data('refcon',refcon);
		if (vis==false) btn.hide();
		btn.mousedown(function(event){
			buttonClicked(btn,event);
			return false;
		});
		return btn;
	}
	function newCButton(left,top,width,height,title,vis,refcon)
	{
		var btn=$(document.createElement('div'));
		btn.addClass('cbutton');
		btn.css('top',top+'px');
		btn.css('left',left+'px');
		btn.css('width',(width-2)+'px');
		btn.css('height',(height-2)+'px');
		btn.html(title);
		btn.data('refcon',refcon);
		if (vis==false) btn.hide();
		btn.mousedown(function(event){
			buttonClicked(btn,event);
			return false;
		});
		return btn;
	}
	function newInput(left,top,width,height,title,vis,refcon)
	{
		var txt=$(document.createElement('input'));
		txt.addClass('textinput');
		txt.css('top',top+'px');
		txt.css('left',left+'px');
		txt.css('width',width+'px');
		txt.css('height',height+'px');
		txt.val(title);
		txt.data('refcon',refcon);
		if (vis==false) txt.hide();
		return txt;
	}
	function newText(left,top,width,height,title,vis,refcon)
	{
		var txt=$(document.createElement('div'));
		txt.addClass('text');
		txt.css('top',top+'px');
		txt.css('left',left+'px');
		txt.css('width',width+'px');
		txt.css('height',height+'px');
		txt.html(title);
		txt.data('refcon',refcon);
		if (vis==false) txt.hide();
		return txt;
	}
	function newList(left,top,width,height,vis,refcon)
	{
		var list=$(document.createElement('div'));
		list.addClass('list');
		list.css('top',top+'px');
		list.css('left',left+'px');
		list.css('width',width+'px');
		list.css('height',height+'px');
		list.data('refcon',refcon);
		if (vis==false) list.hide();
		return list;
	}
	function newHSlider(left,top,width,height,value,min,max,vis,refcon)
	{
		var hslider=$(document.createElement('div'));
		hslider.addClass('hslider');
		hslider.css('top',top+'px');
		hslider.css('left',left+'px');
		hslider.css('width',width+'px');
		hslider.css('height',height+'px');
		hslider.data('refcon',refcon);
		if (vis==false) hslider.hide();
		var hsliderLeft=$(document.createElement('div'));
		hsliderLeft.addClass('hsliderLeft');
		hsliderLeft.css('top','0px');
		hsliderLeft.css('left','0px');
		hslider.append(hsliderLeft);
		var hsliderWell=$(document.createElement('div'));
		hsliderWell.addClass('hsliderWell');
		hsliderWell.css('top','0px');
		hsliderWell.css('left','4px');
		hsliderWell.css('width',(width-8)+'px');
		hslider.append(hsliderWell);
		var hsliderRight=$(document.createElement('div'));
		hsliderRight.addClass('hsliderRight');
		hsliderRight.css('top','0px');
		hsliderRight.css('left',(width-4)+'px');
		hslider.append(hsliderRight);
		var hsliderThumb=$(document.createElement('div'));
		hsliderThumb.addClass('hsliderThumb');
		hsliderThumb.css('top','-4px');
		var pos=(value-min)*(width-8-11)/max|0;
		hsliderThumb.css('left',(pos)+'px');
		hsliderWell.append(hsliderThumb);
		hslider.data('value',value);
		hsliderThumb.mousedown(function(ev){
			var lastX=ev.pageX;
			var curPos=hsliderThumb.position().left;
			$(document).mousemove(function(event){
				curPos+=event.pageX-lastX;
				lastX=event.pageX;
				if (curPos>=0 && curPos<=width-8-11)
					hsliderThumb.css('left',curPos+'px');
				else if (curPos<0)
					hsliderThumb.css('left','0px');
				else
					hsliderThumb.css('left',(width-8-11)+'px');
				return false;
			});
			$(document).mouseup(function(event){
				$(document).unbind('mousemove');
				$(document).unbind('mouseup');
				var pos=hsliderThumb.position().left;
				hslider.data('value',min+(pos*(max-min)/(width-8-11)|0));
				return false;
			});
			return false;
		});
		return hslider;
	}
	function buttonClicked(btn,event)
	{
		webventure.buttonClicked(btn,event);
	}
}
