function TextManager(objects,res)
{
	var self=this;
	var huff,lens,values;
	var oldVersion=true;
	this.input='';
	this.setHuff=function(res)
	{
		if (res==undefined) return;
		oldVersion=false;
		var hufflen=res.r16();
		res.r16();
		huff=new Array(hufflen);
		for (var i=0;i<hufflen-1;i++)
			huff[i]=res.r16();
		lens=new Array(hufflen);
		for (var i=0;i<hufflen;i++)
			lens[i]=res.r8();
		values=new Array(hufflen);
		for (var i=0;i<hufflen;i++)
			values[i]=res.r8();
	}
	this.get=function(id)
	{
		if (oldVersion) return getOld(id);
		if (id&0x8000)
			return this.input;
		var p=new File(objects.get(2,id));
		var len;
		var out='';
		if (p.bits(1))
			len=p.bits(0xf);
		else
			len=p.bits(7);
		while (len--)
		{
			var v=p.peek32();
			v>>=16-p.bit;
			v&=0xffff;
			var i;
			for (i=0;i<huff.length;i++)
				if (v<huff[i]) break;
			p.bit+=lens[i];
			if (p.bit&0x10)
			{
				p.bit&=0xf;
				p.seek(2,p.cur);
			}
			var ch=values[i];
			if (ch==1)
				ch=p.bits(7);
			if (ch!=2)
				out+=String.fromCharCode(ch);
			else
			{
				var child;
				if (p.bits(1))
				{
					var subval=p.bits(0xf);
					child=this.get(subval);
				}
				else
				{
					var subval=p.bits(8);
					child=getNoun(subval);
				}
				if (child)
					out+=child;
			}
		}
		return webventure.mac2ascii(out);
	}
	function getOld(id)
	{
		if (id&0x8000)
			return self.input;
		var p=new File(objects.get(2,id));
		var lower=false;
		var out='';
		var len=p.r16();
		while (len--)
		{
			var ch=p.bits(5);
			if (ch>0 && ch<0x1b)
			{
				ch|=0x40;
				if (lower) ch|=0x20;
				lower=true;
				out+=String.fromCharCode(ch);
			}
			else switch (ch)
			{
				case 0:
					out+=' ';
					break;
				case 0x1b:
					out+=lower?'.':',';
					lower=true;
					break;
				case 0x1c:
					out+=lower?"'":'"';
					lower=true;
					break;
				case 0x1d:
					var child;
					var subval=p.bits(16);
					if (subval&0x8000)
					{
						subval^=0xffff;
						child=getNoun(subval);
					}
					else
						child=getOld(subval);
					if (child)
						out+=child;
					lower=true;
					break;
				case 0x1e:
					out+=String.fromCharCode(p.bits(8));
					lower=true;
					break;
				case 0x1f:
					lower=!lower;
					break;
			}
		}
		return webventure.mac2ascii(out);
	}
	function getNoun(subval)
	{
		var obj,name;
		if (subval&8)
			obj=self.target;
		else
			obj=self.source;
		if ((subval&3)==1)
		{
			var idx=webventure.get(obj,7);
			idx=((idx>>4)&3)+1;
			name=res.getIndStr(0x84,idx);
		}
		else
		{
			name=self.get(obj);
			if (name=='')
				fail();
			switch (subval&3)
			{
				case 2:
					name=getPrefix(0,obj)+name;
					break;
				case 3:
					name=getPrefix(2,obj)+name;
					break;
			}
		}
		if (name.length && (subval&4))
			name=self.capitalize(name);
		return name;
	}
	function getPrefix(flag,obj)
	{
		var attr=(webventure.get(obj,7)>>flag)&3;
		if (attr)
			return res.getIndStr(0x83,attr);
		return '';
	}
	this.capitalize=function(str)
	{
		return str.substr(0,1).toUpperCase()+str.substr(1);
	}
}
