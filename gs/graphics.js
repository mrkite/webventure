/********************** public functions *********************/
var palette;
var paletteMap;
var PPICUnknown=true;

/**
 * @constructor
 */
function BitMap(width,height,rowBytes)
{
	this.width=width>>1; //4bpp
	this.height=height*2;
	this.rowBytes=rowBytes;
	this.bitwidth=width;
	this.bitheight=height;
	this.data=new Array(height*rowBytes);
}
BitMap.prototype.draw=function(port,ox,oy)
{
	if (this.width==0 || this.height==0) return;
	var ctx=port.get(0).getContext('2d');
	var sx=0;
	var sy=0;
	if (ox<0) { sx=-ox; ox=0; }
	if (oy<0) { sy=-oy; oy=0; }
	var w=this.width;
	var h=this.height;
	if (w+ox>=port.width()) w=port.width()-ox;
	if (h+oy>=port.height()) h=port.height()-oy;
	if (w==0 || h==0) return;
	var image=ctx.getImageData(ox,oy,w,h);
	for (var y=sy;y<h;y++)
	{
		var bmpofs=(y>>1)*this.rowBytes;
		var imgofs=(y-sy)*image.width*4;
		var pix;
		for (var x=sx;x<w;x++)
		{
			pix=this.data[bmpofs+(x>>2)];
			if (paletteMap)
				pix=paletteMap[pix];
			pix=((pix>>((x&2)?0:4))&0xf)*3;
			if (pix)
			{
				image.data[imgofs++]=palette[pix++];
				image.data[imgofs++]=palette[pix++];
				image.data[imgofs++]=palette[pix++];
				image.data[imgofs++]=0xff;
			} else imgofs+=4;
		}
	}
	ctx.putImageData(image,ox,oy);
}
BitMap.prototype.inv=function(port,ox,oy)
{
	if (this.width==0 || this.height==0) return;
	var ctx=port.get(0).getContext('2d');
	var sx=0;
	var sy=0;
	if (ox<0) { sx=-ox; ox=0; }
	if (oy<0) { sy=-oy; oy=0; }
	var w=this.width;
	var h=this.height;
	if (w+ox>=port.width()) w=port.width()-ox;
	if (h+oy>=port.height()) h=port.height()-oy;
	if (w==0 || h==0) return;
	var image=ctx.getImageData(ox,oy,w,h);
	for (var y=sy;y<h;y++)
	{
		var bmpofs=(y>>1)*this.rowBytes;
		var imgofs=(y-sy)*image.width*4;
		var pix;
		for (var x=sx;x<w;x++)
		{
			pix=this.data[bmpofs+(x>>2)];
			if (paletteMap)
				pix=paletteMap[pix];
			pix=(pix>>((x&2)?0:4))&0xf;
			if (pix)
			{
				pix^=0xf;
				pix*=3;
				image.data[imgofs++]=palette[pix++];
				image.data[imgofs++]=palette[pix++];
				image.data[imgofs++]=palette[pix++];
				image.data[imgofs++]=0xff;
			} else imgofs+=4;
		}
	}
	ctx.putImageData(image,ox,oy);
}
BitMap.prototype.hit=function(x,y)
{
	var bmpofs=(y>>1)*this.rowBytes;
	var pix=this.data[bmpofs+(x>>2)];
	if (paletteMap)
		pix=paletteMap[pix];
	pix=(pix>>((x&2)?0:4))&0xf;
	return pix!=0;
}

/**
 * @constructor
 */
function HiresBMP(width,height,rowBytes,pal)
{
	this.width=width;
	this.height=height;
	this.rowBytes=rowBytes;
	this.pal=pal;
	this.data=new Array(height*rowBytes);
}
HiresBMP.prototype.draw=function(port,ox,oy)
{
	if (this.width==0 || this.height==0) return;
	var ctx=port.get(0).getContext('2d');
	var w=this.width;
	var h=this.height*2;
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
		var bmpofs=(y>>1)*this.rowBytes;
		var imgofs=(y-sy)*image.width*4;
		var pix;
		for (var x=sx;x<w;x++)
		{
			pix=this.data[bmpofs+(x>>2)];
			pix=((pix>>(6-(x&3)*2))&0x3)*3;
			image.data[imgofs++]=this.pal[pix++];
			image.data[imgofs++]=this.pal[pix++];
			image.data[imgofs++]=this.pal[pix++];
			image.data[imgofs++]=0xff;
		}
	}
	ctx.putImageData(image,ox,oy);
}

function draw(id,x,y,port,mode)
{
	var rect={top:0,left:0,width:0,height:0};
	var bmp;
	if (bmp=getGraphic(id*2))
	{
		rect={top:y,left:x,width:bmp.width,height:bmp.height};
		switch (mode)
		{
			case 1:
				bmp.draw(port,x,y);
				break;
			case 2:
				bmp.inv(port,x,y);
				break;
		}
	}
	return rect;
}

function fillRect(port,left,top,width,height,color)
{
	var ctx=port.get(0).getContext('2d');
	var image=ctx.getImageData(left,top,width,height);
	for (var y=0;y<height;y++)
	{
		var imgofs=y*image.width*4;
		for (var x=0;x<width;x++)
		{
			var pix=((color>>(4*(x&3)))&0xf)*3;
			image.data[imgofs++]=palette[pix++];
			image.data[imgofs++]=palette[pix++];
			image.data[imgofs++]=palette[pix++];
			image.data[imgofs++]=0xff;
		}
	}
	ctx.putImageData(image,left,top);
}

function decodeTitle(f)
{
	f.seek(8,f.set);
	palette=[];
	for (var i=0;i<16;i++)
	{
		f.r16();
		palette.push(f.r16()&0xff);
		palette.push(f.r16()&0xff);
		palette.push(f.r16()&0xff);
	}
	var bmp=new BitMap(1280,200,160); //320x200, in bit
	for (var i=0;i<160*200;i++)
		bmp.data[i]=f.r8();
	return bmp;
}

function getDiploma()
{
	var diploma=getFile(resGetPath(8));
	var bounds=resGetWindow(6);
	var bmp=decodeDiploma(diploma,bounds.right-bounds.left,bounds.bottom-bounds.top);
	return bmp;
}


/********************** private functions *********************/

function decodeDiploma(f,w,h)
{
	f.seek(8,f.set);
	var pal=[];
	for (var i=0;i<4;i++)
	{
		f.r16();
		pal.push(f.r16()&0xff);
		pal.push(f.r16()&0xff);
		pal.push(f.r16()&0xff);
	}
	var rowBytes=(w+7)>>2;
	var bmp=new HiresBMP(w,h,rowBytes,pal);
	for (var i=0;i<rowBytes*h;i++)
		bmp.data[i]=f.r8();
	return bmp;
}
