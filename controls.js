/********************** public functions *********************/
function createCtl(bounds,refcon,type,opts)
{
	switch (type&0xff)
	{
		case 0x02: //image button
			return newCButton(bounds,refcon,type,opts);
		case 0x0a: //rounded button
			return new ButtonCtl(bounds,refcon,type,opts);
		case 0x0f: //textline
			return new TextLineCtl(bounds,refcon,type,opts);
		case 0x11: //textinput
			return new InputCtl(bounds,refcon,type,opts);
		case 0x16: //textblock
			return new TextBlockCtl(bounds,refcon,type,opts);
		case 0x17: //listblock
			return new ListCtl(bounds,refcon,type);
		case 0x18: //slider
			return new SliderCtl(bounds,refcon,type,opts);
		default:
			fatal("Unknown control:"+type.toString(16));
	}
}

/********************** private functions *********************/

/**
 * @constructor
 */
function SliderCtl(bounds,refcon,type,opts)
{
	this.value=parseInt(opts[0]);
	this.refcon=refcon;
	this.min=parseInt(opts[1]);
	this.max=parseInt(opts[2]);
	this.width=bounds[2];
	this.obj=$(document.createElement('div'));
	this.obj.addClass('hscroll');
	this.obj.css('top',bounds[0]+'px');
	this.obj.css('left',bounds[1]+'px');
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

