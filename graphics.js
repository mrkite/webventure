/********************** public functions *********************/

function getGraphic(id)
{
	var gfx=getObject(3,id);
	if (gfx.length<2) return undefined;
	if (gfx.length==2)
	{
		var next=((gfx.charCodeAt(0)&0xff)<<8)|
			(gfx.charCodeAt(1)&0xff);
		return getGraphic(next);
	}
	return decodePPIC(new GFile(gfx));
}

function fill(port,color)
{
	fillRect(port,0,0,port.width(),port.height(),color);
}

/********************** private functions *********************/
function decodePPIC(ppic)
{
	var mode=ppic.bits(3);
	var w,h;
	if (PPICUnknown)
		ppic.bits(2);
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
	var words=bitmap.bitwidth>>4;
	var bytes=bitmap.bitwidth&0xf;
	var v,p=0;
	for (var y=0;y<bitmap.bitheight;y++)
	{
		for (var i=0;i<words;i++)
		{
			v=ppic.peek32(); ppic.seek(2,ppic.cur);
			v>>>=16-ppic.bit;
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
	0xb000,0xc000,0xd000,0xd800,0xe000,0xe800,0xf000,0xf800];
var ppic1lens=[3,3,4,4,4,4,4,4,4,4,4,5,5,5,5,5,5];
var ppic1values=[
	0x00,0x0f,0x03,0x05,0x06,0x07,0x08,0x09,0x0a,0x0c,0xff,0x01,
	0x02,0x04,0x0b,0x0d,0xe];
function decodePPIC1(bitmap,ppic)
{
	decodeHuff(ppic1huff,ppic1lens,ppic1values,bitmap,ppic);
}

var ppic2huff=[
	0x0000,0x4000,0x8000,0xc000,0xc800,0xd000,0xd800,0xe000,0xe800,
	0xf000,0xf400,0xf600,0xf800,0xfa00,0xfc00,0xfe00,0xff00];
var ppic2lens=[2,2,2,5,5,5,5,5,5,6,7,7,7,7,7,8,8];
var ppic2values=[
	0xff,0x00,0x0f,0x01,0x03,0x07,0x0e,0x0c,0x08,0x06,0x02,0x04,
	0x09,0x0d,0x0b,0x0a,0x05];
function decodePPIC2(bitmap,ppic)
{
	decodeHuff(ppic2huff,ppic2lens,ppic2values,bitmap,ppic);
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
	0xff];
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
	if (bitmap.bitwidth&3)
		flags=ppic.bits(5);
	else
		flags=ppic.bits(4)<<1;
	var odd=0;
	var blank=bitmap.bitwidth&0xf;
	if (blank)
	{
		blank>>=2;
		odd=blank&1;
		blank=2-(blank>>1);
	}
	var p=0;
	for (var y=0;y<bitmap.bitheight;y++)
	{
		for (var x=0;x<(bitmap.bitwidth>>3);x++)
		{
			var hi=walkHuff(huff,lens,values,ppic)<<4;
			bitmap.data[p++]=walkHuff(huff,lens,values,ppic)|hi;
		}
		if (odd)
			bitmap.data[p]=walkHuff(huff,lens,values,ppic)<<4;
		p+=blank;
	}
	var edge=bitmap.bitwidth&3;
	if (edge)
	{
		p=bitmap.rowBytes-blank;
		var bits=0;
		var val=0;
		var v;
		for (var y=0;y<bitmap.bitheight;y++)
		{
			if (flags&1)
			{
				if (bits<edge)
				{
					v=walkHuff(huff,lens,values,ppic)<<4;
					val|=v>>>bits;
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
				v>>>=4;
			bitmap.data[p]|=v&0xff;
			p+=bitmap.rowBytes;
		}
	}
	if (flags&8)
	{
		p=0;
		for (var y=0;y<bitmap.bitheight;y++)
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
					val^=(val>>>4)&0xf;
					bitmap.data[p++]=val;
					v=(val<<4)&0xff;
				}
			}
		}
	}
	if (flags&4)
	{
		var delta=bitmap.rowBytes*4;
		if (flags&2) delta*=2;
		p=0;
		var q=delta;
		for (var i=0;i<bitmap.bitheight*bitmap.rowBytes-delta;i++)
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
	dw>>>=16-ppic.bit;
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
