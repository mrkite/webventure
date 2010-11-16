function ObjectManager(files)
{
	var objFiles=[];
	this.load=function(id,name)
	{
		parse(id,files.getData(name));
	}
	this.get=function(fid,id)
	{
		if (id>=objFiles[fid].numitems)
			return "";
		var length,offset;
		if (objFiles[fid].isobj)
		{
			length=objFiles[fid].lengths[id];
			offset=objFiles[fid].offsets[id];
		}
		else
		{
			length=objFiles[fid].itemlen;
			offset=id*length;
		}
		if (!length)
			return '';
		return objFiles[fid].data.substring(offset,offset+length);
	}
	function parse(id,data)
	{
		var obj={};
		obj.numitems=0;
		obj.isobj=false;
		data.seek(0,data.set);
		var filelen=data.length;
		var hdr=data.r32();
		var datalen;
		if (!(hdr&0x80000000))
		{
			filelen-=4;
			datalen=filelen;
			obj.itemlen=hdr;
			obj.numitems=(filelen/hdr)|0;
		}
		else
		{
			hdr&=0x7fffffff;
			obj.isobj=true;
			data.seek(hdr,data.set);
			obj.numitems=data.r16();
			var huff=new Array(16);
			var lens=new Array(16);
			for (var i=0;i<15;i++)
				huff[i]=data.r16();
			for (var i=0;i<16;i++)
				lens[i]=data.r8();
			obj.offsets=new Array(obj.numitems);
			obj.lengths=new Array(obj.numitems);
			var bits=0;
			var offset;
			for (var i=0;i<obj.numitems;i++)
			{
				if ((i&0x3f)==0)
				{
					data.seek(hdr+(i>>6)*6+0x30,data.set);
					var list=data.r24();
					offset=data.r24();
					bits=list&7;
					data.seek(hdr+(list>>3),data.set);
				}
				obj.offsets[i]=offset;
				var v=(data.r32()>>(16-bits))&0xffff;
				data.seek(-4,data.cur);
				var x;
				for (x=0;x<16;x++)
					if (huff[x]>v) break;
				var size=lens[x];
				bits+=size&0xf;
				if (bits&0x10)
				{
					bits&=0xf;
					data.seek(2,data.cur);
				}
				size>>=4;
				var len=0;
				if (size)
				{
					len=data.peek32();
					size--;
					if (size==0) len=0;
					else len>>=(32-size)-bits;
					len&=(1<<size)-1;
					len|=1<<size;
					bits+=size;
					if (bits&0x10)
					{
						bits&=0xf;
						data.seek(2,data.cur);
					}
					offset+=len;
				}
				obj.lengths[i]=len;
			}
			datalen=hdr-4;
		}
		data.seek(4,data.set);
		obj.data=data.read(datalen);
		objFiles[id]=obj;
	}
}
