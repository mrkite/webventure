/********************** public functions *********************/
function createCtl(bounds,refcon,type,opts)
{
	switch (type&0xff)
	{
		case 0x02: //image button
			return new CButtonCtl(bounds,refcon,opts);
		case 0x0a: //rounded button
			return new ButtonCtl(bounds,refcon,opts);
		case 0x0f: //textline
			return new TextLineCtl(bounds,refcon,opts);
		case 0x11: //textinput
			return new InputCtl(bounds,refcon,opts);
		case 0x16: //textblock
			return new TextBlockCtl(bounds,refcon,opts);
		case 0x17: //listblock
			return new ListCtl(bounds,refcon);
		case 0x18: //slider
			return new SliderCtl(bounds,refcon,opts);
		case 0x19: //square button
			return new SButtonCtl(bounds,refcon,opts);
		default:
			fatal("Unknown control:"+type.toString(16));
	}
}

function moveControl(ctl,x,y)
{
	var pos=ctl.obj.position();
	ctl.obj.css('left',(pos.left+x)+'px');
	ctl.obj.css('top',(pos.top+y)+'px');
}

/********************** private functions *********************/

/**
 * @constructor
 */
function CButtonCtl(bounds,refcon,opts)
{
	var self=this;
	var obj=$(document.createElement('canvas'));
	obj.addClass('cbutton');
	obj.css('left',bounds[0]+'px');
	obj.css('top',bounds[1]+'px');
	obj.attr('width',bounds[2]);
	obj.attr('height',bounds[3]);
	obj.mousedown(function(event){
		buttonClicked(self,event);
		return false;
	});
	this.obj=obj;
	this.refcon=refcon;
	this.selected=false;
	this.bpr=opts[0];
	this.bits=opts[1];
	this.selbits=opts[2];
}
CButtonCtl.prototype.hide=function()
{
	this.obj.hide();
}
CButtonCtl.prototype.show=function()
{
	this.obj.show();
	this.draw();
}
CButtonCtl.prototype.draw=function()
{
	var ctx=this.obj.get(0).getContext('2d');
	var w=this.obj.width();
	var h=this.obj.height();
	var image=ctx.getImageData(0,0,w,h);
	var data=this.selected?this.selbits:this.bits;
	if (data)
	{
		for (var y=0;y<h;y++)
		{
			var bmpofs=(y>>1)*this.bpr;
			var imgofs=y*image.width*4;
			var pix;
			for (var x=0;x<w;x++)
			{
				pix=data.charCodeAt(bmpofs+(x>>2));
				pix=((pix>>((x&2)?0:4))&0xf)*3;
				image.data[imgofs++]=palette[pix++];
				image.data[imgofs++]=palette[pix++];
				image.data[imgofs++]=palette[pix++];
				image.data[imgofs++]=0xff;
			}
		}
	}
	else
	{
		for (var y=0;y<h;y++)
		{
			var imgofs=y*image.width*4;
			var pix;
			for (var x=0;x<w;x++)
			{
				pix=this.selected?0:0xff;
				if (y<2 || x<4 || y>h-3 || x>w-5)
					pix=0;
				image.data[imgofs++]=pix;
				image.data[imgofs++]=pix;
				image.data[imgofs++]=pix;
				image.data[imgofs++]=0xff;
			}
		}
	}
	ctx.putImageData(image,0,0);
}
CButtonCtl.prototype.select=function()
{
	this.selected=true;
	this.draw();
}
CButtonCtl.prototype.deselect=function()
{
	this.selected=false;
	this.draw();
}

/**
 * @constructor
 */
function ButtonCtl(bounds,refcon,opts)
{
	var self=this;
	var obj=$(document.createElement('div'));
	obj.addClass('button');
	obj.css('left',bounds[0]+'px');
	obj.css('top',bounds[1]+'px');
	obj.css('width',bounds[2]+'px');
	obj.css('height',bounds[3]+'px');
	obj.html(opts[0]);
	obj.mousedown(function(event){
		buttonClicked(self,event);
		return false;
	});
	this.obj=obj;
	this.refcon=refcon;
}
ButtonCtl.prototype.hide=function()
{
	this.obj.hide();
}
ButtonCtl.prototype.show=function()
{
	this.obj.show();
}
ButtonCtl.prototype.draw=function(){}

/**
 * @constructor
 */
function TextLineCtl(bounds,refcon,opts)
{
	this.obj=$(document.createElement('div'));
	this.obj.addClass('textblock');
	this.obj.css('left',bounds[0]+'px');
	this.obj.css('top',bounds[1]+'px');
	this.obj.css('width',bounds[2]+'px');
	this.obj.css('height',bounds[3]+'px');
	this.refcon=refcon;
	this.setText(opts[0]);	
}
TextLineCtl.prototype.getText=function()
{
	return this.obj.html();
}
TextLineCtl.prototype.setText=function(text)
{
	this.obj.html(text);
}
TextLineCtl.prototype.hide=function()
{
	this.obj.hide();
}
TextLineCtl.prototype.show=function()
{
	this.obj.show();
}
TextLineCtl.prototype.draw=function(){}

/**
 * @constructor
 */
function InputCtl(bounds,refcon,opts)
{
	this.obj=$(document.createElement('input'));
	this.obj.addClass('textinput');
	this.obj.css('left',bounds[0]+'px');
	this.obj.css('top',bounds[1]+'px');
	this.obj.css('width',bounds[2]+'px');
	this.obj.css('height',bounds[3]+'px');
	this.obj.val(opts[0]);
	this.refcon=refcon;
}
InputCtl.prototype.hide=function()
{
	this.obj.hide();
}
InputCtl.prototype.show=function()
{
	this.obj.show();
}
InputCtl.prototype.draw=function(){}

/**
 * @constructor
 */
function TextBlockCtl(bounds,refcon,opts)
{
	this.obj=$(document.createElement('div'));
	this.obj.addClass('textblock');
	this.obj.css('left',bounds[0]+'px');
	this.obj.css('top',bounds[1]+'px');
	this.obj.css('width',bounds[2]+'px');
	this.obj.css('height',bounds[3]+'px');
	this.refcon=refcon;
	this.setText(opts[0]);
}
TextBlockCtl.prototype.hide=function()
{
	this.obj.hide();
}
TextBlockCtl.prototype.show=function()
{
	this.obj.show();
}
TextBlockCtl.prototype.draw=function(){}
TextBlockCtl.prototype.getText=function()
{
	return this.obj.html();
}
TextBlockCtl.prototype.setText=function(text)
{
	var out='';
	for (var i=0;i<text.length;i++)
	{
		if (text.charCodeAt(i)==1)
		{
			if (text.charCodeAt(i+1)==0x4a)
				this.obj.css('text-align','center');
			i+=2;
		}
		else if (text.charCodeAt(i)==0xd)
			out+='<br />';
		else
			out+=text.charAt(i);
	}
	this.obj.html(out);
}

/**
 * @constructor
 */
function ListCtl(bounds,refcon)
{
	this.obj=$(document.createElement('div'));
	this.obj.addClass('list');
	this.obj.css('left',bounds[0]+'px');
	this.obj.css('top',bounds[1]+'px');
	this.obj.css('width',bounds[2]+'px');
	this.obj.css('height',bounds[3]+'px');
	this.refcon=refcon;
}
ListCtl.prototype.hide=function()
{
	this.obj.hide();
}
ListCtl.prototype.show=function()
{
	this.obj.show();
}
ListCtl.prototype.draw=function(){}

/**
 * @constructor
 */
function SliderCtl(bounds,refcon,opts)
{
	this.value=parseInt(opts[0],10);
	this.refcon=refcon;
	this.min=parseInt(opts[1],10);
	this.max=parseInt(opts[2],10);
	this.width=bounds[2];
	var obj=$(document.createElement('div'));
	obj.addClass('hscroll');
	obj.css('left',bounds[0]+'px');
	obj.css('top',bounds[1]+'px');
	obj.css('width',bounds[2]+'px');
	obj.css('height',bounds[3]+'px');
	this.obj=obj;
	var leftarrow=$(document.createElement('div'));
	leftarrow.addClass('leftarrow');
	leftarrow.css('top','0px');
	leftarrow.css('left','0px');
	obj.append(leftarrow);
	var rightarrow=$(document.createElement('div'));
	rightarrow.addClass('rightarrow');
	rightarrow.css('top','0px');
	rightarrow.css('left',(bounds[2]-HScrollArrowRight)+'px');
	obj.append(rightarrow);
	var slider=$(document.createElement('div'));
	slider.addClass('slider');
	slider.css('top','0px');
	slider.css('left','50px');
	slider.css('width','20px');
	obj.append(slider);
	this.slider=slider;
	obj.mousedown(function(event){
		fatal("mousedown");
	});
	leftarrow.mousedown(function(event){
		fatal("left");
	});
	rightarrow.mousedown(function(event){
		fatal("right");
	});
	slider.mousedown(function(event){
		fatal("slider");
	});
}
SliderCtl.prototype.hide=function()
{
	this.obj.hide();
}
SliderCtl.prototype.show=function()
{
	this.obj.show();
	this.draw();
}
SliderCtl.prototype.draw=function()
{
	var range=this.width-(HScrollBucket+20);
	var x=(this.value*range/(this.max-this.min))|0;
	this.slider.css('left',(x+HScrollBucketStart)+'px');
}
SliderCtl.prototype.setValue=function(val)
{
	this.value=val;
	this.draw();
}

/**
 * @constructor
 */
function SButtonCtl(bounds,refcon,opts)
{
	var self=this;
	var obj=$(document.createElement('div'));
	obj.addClass('sbutton');
	obj.css('left',bounds[0]+'px');
	obj.css('top',bounds[1]+'px');
	obj.css('width',(bounds[2]-2)+'px');
	obj.css('height',(bounds[3]-2)+'px');
	obj.html(opts[0]);
	obj.mousedown(function(event){
		buttonClicked(self,event);
		return false;
	});
	this.obj=obj;
	this.refcon=refcon;
}
SButtonCtl.prototype.hide=function()
{
	this.obj.hide();
}
SButtonCtl.prototype.show=function()
{
	this.obj.show();
}
SButtonCtl.prototype.select=function()
{
	this.obj.addClass('active');
}
SButtonCtl.prototype.deselect=function()
{
	this.obj.removeClass('active');
}
SButtonCtl.prototype.draw=function(){}
