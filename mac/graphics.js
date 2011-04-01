/********************** public functions *********************/
var palette=[];
var PPICUnknown=false;

/**
 * @constructor
 */
function BitMap(width,height,rowBytes)
{
	this.width=width;
	this.height=height;
	this.rowBytes=rowBytes;
	this.bitwidth=width;
	this.bitheight=height;
	this.data=new Array(height*rowBytes);
}
BitMap.prototype.draw=function(port,ox,oy)
{
	if (this.width==0 || this.height==0) return;
	var ctx=port.get(0).getContext('2d');
	var w=this.width;
	var h=this.height;
	var sx=0;
	var sy=0;
	if (ox<0) { sx=-ox; ox=0; }
	if (oy<0) { sy=-oy; oy=0; }
	if (w+ox>=port.width()) w=port.width()-ox;
	if (h+oy>=port.height()) h=port.height()-oy;
	if (w==0 || h==0) return;
	var image=ctx.getImageData(ox,oy,w,h);
	for (var y=sy;y<h;y++)
	{
		var bmpofs=y*this.rowBytes;
		var imgofs=(y-sy)*image.width*4;
		var pix;
		for (var x=sx;x<w;x++)
		{
			pix=this.data[bmpofs+(x>>3)]&(1<<(7-(x&7)));
			pix=pix?0x00:0xff;
			image.data[imgofs++]=pix;
			image.data[imgofs++]=pix;
			image.data[imgofs++]=pix;
			image.data[imgofs++]=0xff;
		}
	}
	ctx.putImageData(image,ox,oy);
}
BitMap.prototype.bic=function(port,ox,oy)
{
	if (this.width==0 || this.height==0) return;
	var ctx=port.get(0).getContext('2d');
	var w=this.width;
	var h=this.height;
	var sx=0;
	var sy=0;
	if (ox<0) { sx=-ox; ox=0; }
	if (oy<0) { sy=-oy; oy=0; }
	if (w+ox>=port.width()) w=port.width()-ox;
	if (h+oy>=port.height()) h=port.height()-oy;
	if (w==0 || h==0) return;
	var image=ctx.getImageData(ox,oy,w,h);
	for (var y=sy;y<h;y++)
	{
		var bmpofs=y*this.rowBytes;
		var imgofs=(y-sy)*image.width*4;
		var pix;
		for (var x=sx;x<w;x++)
		{
			pix=this.data[bmpofs+(x>>3)]&(1<<(7-(x&7)));
			if (pix)
			{
				image.data[imgofs++]=0xff;
				image.data[imgofs++]=0xff;
				image.data[imgofs++]=0xff;
				image.data[imgofs++]=0xff;
			} else imgofs+=4;
		}
	}
	ctx.putImageData(image,ox,oy);
}
BitMap.prototype.or=function(port,ox,oy)
{
	if (this.width==0 || this.height==0) return;
	var ctx=port.get(0).getContext('2d');
	var w=this.width;
	var h=this.height;
	var sx=0;
	var sy=0;
	if (ox<0) { sx=-ox; ox=0; }
	if (oy<0) { sy=-oy; oy=0; }
	if (w+ox>=port.width()) w=port.width()-ox;
	if (h+oy>=port.height()) h=port.height()-oy;
	if (w==0 || h==0) return;
	var image=ctx.getImageData(ox,oy,w,h);
	for (var y=sy;y<h;y++)
	{
		var bmpofs=y*this.rowBytes;
		var imgofs=(y-sy)*image.width*4;
		var pix;
		for (var x=sx;x<w;x++)
		{
			pix=this.data[bmpofs+(x>>3)]&(1<<(7-(x&7)));
			if (pix)
			{
				image.data[imgofs++]=0x00;
				image.data[imgofs++]=0x00;
				image.data[imgofs++]=0x00;
				image.data[imgofs++]=0xff;
			} else imgofs+=4;
		}
	}
	ctx.putImageData(image,ox,oy);
}
BitMap.prototype.xor=function(port,ox,oy)
{
	if (this.width==0 || this.height==0) return;
	var ctx=port.get(0).getContext('2d');
	var w=this.width;
	var h=this.height;
	var sx=0;
	var sy=0;
	if (ox<0) { sx=-ox; ox=0; }
	if (oy<0) { sy=-oy; oy=0; }
	if (w+ox>=port.width()) w=port.width()-ox;
	if (h+oy>=port.height()) h=port.height()-oy;
	if (w==0 || h==0) return;
	var image=ctx.getImageData(ox,oy,w,h);
	for (var y=sy;y<h;y++)
	{
		var bmpofs=y*this.rowBytes;
		var imgofs=(y-sy)*image.width*4;
		var pix;
		for (var x=sx;x<w;x++)
		{
			pix=this.data[bmpofs+(x>>3)]&(1<<(7-(x&7)));
			if (pix)
			{
				image.data[imgofs++]^=0xff;
				image.data[imgofs++]^=0xff;
				image.data[imgofs++]^=0xff;
				image.data[imgofs++]=0xff;
			} else imgofs+=4;
		}
	}
	ctx.putImageData(image,ox,oy);
}
BitMap.prototype.hit=function(x,y)
{
	var bmpofs=y*this.rowBytes;
	var pix=this.data[bmpofs+(x>>3)]&(1<<(7-(x&7)));
	return pix!=0;
}

function draw(id,x,y,port,mode)
{
	var rect={top:0,left:0,width:0,height:0};
	var bmp;
	if (bmp=getGraphic(id*2+1))
	{
		rect={top:y,left:x,width:bmp.width,height:bmp.height};
		switch (mode)
		{
			case 1:
				bmp.bic(port,x,y);
				break;
			case 2:
				bmp.or(port,x,y);
				break;
		}
	}
	else if (bmp=getGraphic(id*2))
	{
		rect={top:y,left:x,width:bmp.width,height:bmp.height};
		switch (mode)
		{
			case 1:
				fillRect(port,x,y,bmp.width,bmp.height,0);
				break;
			case 2:
				fillRect(port,x,y,bmp.width,bmp.height,1);
				break;
		}
	}
	if (mode>0 && (bmp=getGraphic(id*2)))
		bmp.xor(port,x,y);
	return rect;
}

function fillRect(port,left,top,width,height,color)
{
	var ctx=port.get(0).getContext('2d');
	var image=ctx.getImageData(left,top,width,height);
	for (var y=0;y<height;y++)
	{
		var imgofs=y*image.width*4;
		var pix=color?0x00:0xff;
		for (var x=0;x<width;x++)
		{
			image.data[imgofs++]=pix;
			image.data[imgofs++]=pix;
			image.data[imgofs++]=pix;
			image.data[imgofs++]=0xff;
		}
	}
	ctx.putImageData(image,left,top);
}

function decodePack(data)
{
	var bitmap=new BitMap(512,302,0x40);
	var line=new Array(0x48);

	data.seek(0x200,data.set);
	var out=0;
	for (var y=0;y<bitmap.bitheight;y++)
	{
		var count=0;
		while (count<0x48)
		{
			var n=data.r8();
			if (n==0x80) //noop
			{
			}
			else if (n&0x80)
			{
				n^=0xff;
				n+=2;
				var v=data.r8();
				for (var i=0;i<n;i++)
					line[count++]=v;
			}
			else
			{
				n++;
				for (var i=0;i<n;i++)
					line[count++]=data.r8();
			}
		}
		for (var i=0;i<0x40;i++)
			bitmap.data[out++]=line[i];
	}
	return bitmap;
}

/********************** private functions *********************/
