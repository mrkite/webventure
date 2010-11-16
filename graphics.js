function BitMap(width,height,rowBytes)
{
	this.width=width;
	this.height=height;
	this.rowBytes=rowBytes;
	this.data=new Array(height*rowBytes);
	this.draw=function(port,ox,oy)
	{
		if (width==0 || height==0) return;
		var ctx=port.get(0).getContext('2d');
		var w=width;
		var h=height;
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
			var bmpofs=y*rowBytes;
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
	this.bic=function(port,ox,oy)
	{
		if (width==0 || height==0) return;
		var ctx=port.get(0).getContext('2d');
		var w=width;
		var h=height;
		var sx=0;
		var sy=0;
		if (ox<0) { sx=-ox; ox=0; }
		if (oy<0) { sy=-oy; oy=0; }
		if (w+ox>port.width()) w=port.width()-ox;
		if (h+oy>port.height()) h=port.height()-oy;
		if (w==0 || h==0) return;
		var image=ctx.getImageData(ox,oy,w,h);
		for (var y=sy;y<h;y++)
		{
			var bmpofs=y*rowBytes;
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
	this.or=function(port,ox,oy)
	{
		if (width==0 || height==0) return;
		var ctx=port.get(0).getContext('2d');
		var w=width;
		var h=height;
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
			var bmpofs=y*rowBytes;
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
	this.xor=function(port,ox,oy)
	{
		if (width==0 || height==0) return;
		var ctx=port.get(0).getContext('2d');
		var w=width;
		var h=height;
		var sx=0;
		var sy=0;
		if (ox<0) { sx=-ox; ox=0; }
		if (oy<0) { sy=-oy; oy=0; }
		if (w+ox>port.width()) w=port.width()-ox;
		if (h+oy>=port.height()) h=port.height()-oy;
		if (w==0 || h==0) return;
		var image=ctx.getImageData(ox,oy,w,h);
		for (var y=sy;y<h;y++)
		{
			var bmpofs=y*rowBytes;
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
	this.hit=function(x,y)
	{
		var bmpofs=y*rowBytes;
		var pix=this.data[bmpofs+(x>>3)]&(1<<(7-(x&7)));
		return pix!=0;
	}
	this.intersect=function(rect)
	{
		for (var y=rect.top;y<rect.top+rect.height;y++)
		{
			var bmpofs=y*rowBytes;
			var pix;
			for (var x=rect.left;x<rect.left+rect.width;x++)
			{
				pix=this.data[bmpofs+(x>>3)]&(1<<(7-(x&7)));
				if (pix) return true;
			}
		}
		return false;
	}
}
function decodePack(data)
{
	var bitmap=new BitMap(512,302,0x40);
	var line=new Array(0x48);


	data.seek(0x200,data.set);
	var out=0;
	for (var y=0;y<bitmap.height;y++)
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
function decodePPIC(ppic)
{
	var mode=ppic.bits(3);
	var w,h;
	if (ppic.bits(1)) h=ppic.bits(10);
	else h=ppic.bits(6);
	if (ppic.bits(1)) w=ppic.bits(10);
	else w=ppic.bits(6);
	if (!w || !h) return undefined;
	var rb=((w+0xf)>>3)&0xfffe;
	var bitmap=new BitMap(w,h,rb);
	switch (mode)
	{
		case 0: decodePPIC0(bitmap,ppic); break;
		case 1: decodePPIC1(bitmap,ppic); break;
		case 2: decodePPIC2(bitmap,ppic); break;
		case 3: decodePPIC3(bitmap,ppic); break;
	}
	return bitmap;
}
function decodePPIC0(bitmap,ppic)
{
	var words=bitmap.width>>4;
	var bytes=bitmap.width&0xf;
	var v,p=0;
	for (var y=0;y<bitmap.height;y++)
	{
		for (var i=0;i<words;i++)
		{
			v=ppic.peek32(); ppic.seek(2,ppic.cur);
			v>>=16-ppic.bit;
			bitmap.data[p++]=(v>>8)&0xff;
			bitmap.data[p++]=v&0xff;
		}
		if (bytes)
		{
			v=ppic.bits(bytes);
			v<<=16-bytes;
			bitmap.data[p++]=(v>>8)&0xff;
			bitmap.data[p++]=v&0xff;
		}
	}
}
var ppic1huff=[
	0x0000,0x2000,0x4000,0x5000,0x6000,0x7000,0x8000,0x9000,0xa000,
	0xb000,0xc000,0xd000,0xd800,0xe000,0xe800,0xf000,0xf800
];
var ppic1lens=[3,3,4,4,4,4,4,4,4,4,4,5,5,5,5,5,5];
var ppic1values=[
	0x00,0x0f,0x03,0x05,0x06,0x07,0x08,0x09,0x0a,0x0c,0xff,0x01,0x02,
	0x04,0x0b,0x0d,0x0e
];
function decodePPIC1(bitmap,ppic)
{
	decodeHuff(ppic1huff,ppic1lens,ppic1values,bitmap,ppic)
}
var ppic2huff=[
	0x0000,0x4000,0x8000,0xc000,0xc800,0xd000,0xd800,0xe000,0xe800,
	0xf000,0xf400,0xf600,0xf800,0xfa00,0xfc00,0xfe00,0xff00
];
var ppic2lens=[2,2,2,5,5,5,5,5,5,6,7,7,7,7,7,8,8];
var ppic2values=[
	0xff,0x00,0x0f,0x01,0x03,0x07,0x0e,0x0c,0x08,0x06,0x02,0x04,0x09,
	0x0d,0x0b,0x0a,0x05
];
function decodePPIC2(bitmap,ppic)
{
	decodeHuff(ppic2huff,ppic2lens,ppic2values,bitmap,ppic)
}
var loadbits=[
	0x08,0x0f,0x02,0xff,0x00,
	0x04,0xff,0x01,
	0x07,0x09,0x08,0xff,0x03,
	0x04,0xff,0x04,
	0x0a,0x07,0x0a,0x0b,0x06,0xff,0x05,
	0x06,0x06,0x0b,0xff,0x07,
	0x03,0xff,0x09,
	0x04,0x03,0x0e,0xff,0x0c,
	0x02,0xff,0x0d,
	0x01,0xff,0x0f,
	0xff
];
function decodePPIC3(bitmap,ppic)
{
	var values=new Array(0x11);
	var v,bits;
	var load=0;
	while ((bits=loadbits[load++])!=0xff)
	{
		v=ppic.bits(bits);
		while ((bits=loadbits[load++])!=0xff)
		{
			values[loadbits[load++]]=v%bits;
			v=(v/bits)|0;
		}
		values[loadbits[load++]]=v;
	}
	values[0x10]=0;
	for (var i=0x10;i>0;i--)
		for (var j=i;j<=0x10;j++)
			if (values[j]>=values[i-1])
				values[j]++;
	for (var i=0x10;i>=0;i--)
		if (values[i]==0x10)
		{
			values[i]=0xff;
			break;
		}
	var huff=new Array(0x11);
	var lens=new Array(0x11);
	bits=ppic.bits(2)+1;
	var mask=0;
	for (var i=0;i<0xf;i++)
	{
		if (i)
			while (!ppic.bits(1)) bits++;
		lens[i]=bits;
		huff[i]=mask;
		mask+=1<<(16-bits);
	}
	huff[0xf]=mask;
	while (mask&(1<<(16-bits))) bits++;
	huff[0x10]=mask|(1<<(16-bits));
	lens[0xf]=bits;
	lens[0x10]=bits;

	decodeHuff(huff,lens,values,bitmap,ppic);
}

function decodeHuff(huff,lens,values,bitmap,ppic)
{
	var flags;
	walkHuffRepeat=0;
	walkHuffLast=0;
	if (bitmap.width&3)
		flags=ppic.bits(5);
	else
		flags=ppic.bits(4)<<1;

	var odd=0;
	var blank=bitmap.width&0xf;
	if (blank)
	{
		blank>>=2;
		odd=blank&1;
		blank=2-(blank>>1);
	}
	var p=0;
	for (var y=0;y<bitmap.height;y++)
	{
		for (var x=0;x<(bitmap.width>>3);x++)
		{
			var hi=walkHuff(huff,lens,values,ppic)<<4;
			bitmap.data[p++]=walkHuff(huff,lens,values,ppic)|hi;
		}
		if (odd)
			bitmap.data[p]=walkHuff(huff,lens,values,ppic)<<4;
		p+=blank;
	}
	var edge=bitmap.width&3;
	if (edge)
	{
		p=bitmap.rowBytes-blank;
		var bits=0;
		var val=0;
		for (var y=0;y<bitmap.height;y++)
		{
			if (flags&1)
			{
				if (bits<edge)
				{
					v=walkHuff(huff,lens,values,ppic)<<4;
					val|=v>>bits;
					bits+=4;
				}
				bits-=edge;
				v=val;
				val<<=edge;
				val&=0xff
			}
			else
			{
				v=ppic.bits(edge);
				v<<=8-edge;
			}
			if (odd)
				v>>=4;
			bitmap.data[p]|=v&0xff;
			p+=bitmap.rowBytes;
		}
	}
	if (flags&8)
	{
		p=0;
		for (var y=0;y<bitmap.height;y++)
		{
			v=0;
			if (flags&2)
			{
				for (x=0;x<bitmap.rowBytes;x++)
				{
					bitmap.data[p]^=v;
					v=bitmap.data[p++];
				}
			}
			else
			{
				for (x=0;x<bitmap.rowBytes;x++)
				{
					val=bitmap.data[p]^v;
					val^=(val>>4)&0xf;
					bitmap.data[p++]=val;
					v=val<<4;
				}
			}
		}
	}
	if (flags&4)
	{
		delta=bitmap.rowBytes*4;
		if (flags&2) delta*=2;
		p=0;
		q=delta;
		for (i=0;i<bitmap.height*bitmap.rowBytes-delta;i++)
			bitmap.data[q++]^=bitmap.data[p++];
	}
}
var walkHuffRepeat=0;
var walkHuffLast=0;
function walkHuff(huff,lens,values,ppic)
{
	if (walkHuffRepeat)
	{
		walkHuffRepeat--;
		walkHuffLast=((walkHuffLast<<8)&0xff00)|(walkHuffLast>>8);
		return walkHuffLast&0xff;
	}
	var dw=ppic.peek32();
	dw>>=16-ppic.bit;
	dw&=0xffff;
	var i;
	for (i=0;i<0x10;i++)
		if (huff[i+1]>dw)
			break;
	ppic.bit+=lens[i];
	if (ppic.bit&0x10)
	{
		ppic.bit&=0xf;
		ppic.seek(2,ppic.cur);
	}
	var v=values[i];
	if (v==0xff)
	{
		if (!ppic.bits(1))
		{
			walkHuffLast&=0xff;
			walkHuffLast|=walkHuffLast<<8;
		}
		walkHuffRepeat=ppic.bits(3);
		if (walkHuffRepeat<3)
		{
			walkHuffRepeat<<=4;
			walkHuffRepeat|=ppic.bits(4);
			if (walkHuffRepeat<8)
			{
				walkHuffRepeat<<=8;
				walkHuffRepeat|=ppic.bits(8);
			}
		}
		walkHuffRepeat-=2;
		walkHuffLast=((walkHuffLast<<8)&0xff00)|(walkHuffLast>>8);
		return walkHuffLast&0xff;
	}
	else
	{
		walkHuffLast<<=8;
		walkHuffLast|=v;
		walkHuffLast&=0xffff;
	}
	return v;
}

function GraphicManager(objects)
{
	this.get=function(id)
	{
		var gfx=objects.get(3,id);
		if (gfx.length<2) return undefined;
		if (gfx.length==2)
		{
			var next=((gfx.charCodeAt(0)&0xff)<<8)|
				(gfx.charCodeAt(1)&0xff);
			return this.get(next);
		}
		return decodePPIC(new File(gfx));
	}
	this.fill=function(port,color)
	{
		fillRect(port,0,0,port.width(),port.height(),color);
	}
	this.draw=function(id,x,y,port,mode)
	{
		var rect={top:0,left:0,width:0,height:0};
		var bmp;
		if (bmp=this.get(id*2+1))
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
		else if (bmp=this.get(id*2))
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
		if (mode>0 && (bmp=this.get(id*2)))
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
	this.sectRect=function(src1,src2,dst)
	{
		var top=src2.top;
		var left=src2.left;
		var right=left+src2.width;
		var bottom=top+src2.height;
		if (top<src1.top) top=src1.top;
		if (left<src1.left) left=src1.left;
		if (bottom>src1.top+src1.height)
			bottom=src1.top+src1.height;
		if (right>src1.left+src1.width)
			right=src1.left+src1.width;
		if (right<=left || bottom<=top)
		{
			top=bottom=left=right=0;
		}
		dst.top=top;
		dst.left=left;
		dst.width=right-left;
		dst.height=bottom-top;
		return dst.height!=0;
	}
}

