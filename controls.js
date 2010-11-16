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
	function buttonClicked(btn,event)
	{
		webventure.buttonClicked(btn,event);
	}
}
