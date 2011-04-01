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

/********************** private functions *********************/

/**
 * @constructor
 */
function CButtonCtl(bounds,refcon,opts)
{
	this.obj=$(document.createElement('canvas'));
	this.obj.addClass('cbutton');
	this.obj.css('left',bounds[0]+'px');
	this.obj.css('top',bounds[1]+'px');
	this.obj.attr('width',bounds[2]);
	this.obj.attr('height',bounds[3]);
	this.refcon=refcon;
	this.selected=false;
	this.bpr=opts[0];
	this.bits=opts[1];
	this.selbits=opts[2];
	this.obj.mousedown(function(event){
		fatal("cbutton");
	});
}
CButtonCtl.prototype.draw=function()
{
	var ctx=this.obj.get(0).getContext('2d');
	var image=ctx.getImageData(0,0,this.width,this.height);
	var data=this.selected?this.selbits:this.bits;
	if (data)
	{
		for (var y=0;y<this.height;y++)
		{
			var bmpofs=(y>>1)*this.bpr;
			var imgofs=y*image.width*4;
			var pix;
			for (var x=0;x<this.width;x++)
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
		for (var y=0;y<this.height;y++)
		{
			var imgofs=y*image.width*4;
			var pix;
			for (var x=0;x<this.width;x++)
			{
				pix=this.selected?0:0xff;
				if (y<2 || x<4 || y>this.height-3 || x>this.width-5)
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
	this.obj=$(document.createElement('div'));
	this.obj.addClass('button');
	this.obj.css('left',bounds[0]+'px');
	this.obj.css('top',bounds[1]+'px');
	this.obj.css('width',bounds[2]+'px');
	this.obj.css('height',bounds[3]+'px');
	this.obj.html(opts[0]);
	this.refcon=refcon;
	this.obj.mousedown(function(event){
		fatal("button");
	});
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
	this.obj=$(document.createElement('div'));
	this.obj.addClass('hscroll');
	this.obj.css('left',bounds[0]+'px');
	this.obj.css('top',bounds[1]+'px');
	this.obj.css('width',bounds[2]+'px');
	this.obj.css('height',bounds[3]+'px');
	this.obj.mousedown(function(event){
		fatal("mousedown");
	});
	this.leftarrow=$(document.createElement('div'));
	this.leftarrow.addClass('leftarrow');
	this.leftarrow.css('top','0px');
	this.leftarrow.css('left','0px');
	this.leftarrow.mousedown(function(event){
		fatal("left");
	});
	this.obj.append(this.leftarrow);
	this.rightarrow=$(document.createElement('div'));
	this.rightarrow.addClass('rightarrow');
	this.rightarrow.css('top','0px');
	this.rightarrow.css('left',(bounds[2]-HScrollArrowRight)+'px');
	this.rightarrow.mousedown(function(event){
		fatal("right");
	});
	this.obj.append(this.rightarrow);
	this.slider=$(document.createElement('div'));
	this.slider.addClass('slider');
	this.slider.css('top','0px');
	this.slider.css('left','50px');
	this.slider.css('width','20px');
	this.slider.mousedown(function(event){
		fatal("slider");
	});
	this.obj.append(this.slider);
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
	this.obj=$(document.createElement('div'));
	this.obj.addClass('sbutton');
	this.obj.css('left',bounds[0]+'px');
	this.obj.css('top',bounds[1]+'px');
	this.obj.css('width',(bounds[2]-2)+'px');
	this.obj.css('height',(bounds[3]-2)+'px');
	this.obj.html(opts[0]);
	this.refcon=refcon;
	this.obj.mousedown(function(event){
		fatal("button");
	});
}
SButtonCtl.prototype.draw=function(){}
