/********************** public functions *********************/
var oldText=true;
var huff=undefined;
var userInput='';
var sourceObject=undefined;
var targetObject=undefined;

function setHuff(h)
{
	if (h==undefined) return;
	huff=h;
	oldText=false;
}

function getText(id)
{
	if (oldText) return getOldText(id);
	if (id&0x8000)
		return userInput;
	var p=new GFile(getObject(2,id));
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
			if (v<huff.masks[i]) break;
		p.bit+=huff.lens[i];
		if (p.bit&0x10)
		{
			p.bit&=0xf;
			p.seek(2,p.cur);
		}
		var ch=huff.values[i];
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
				child=getText(subval);
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
	return toascii(out);
}

function capitalize(str)
{
	return str.substr(0,1).toUpperCase()+str.substr(1);
}

/********************** private functions *********************/
function getOldText(id)
{
	if (id&0x8000)
		return userInput;
	var p=new GFile(getObject(2,id));
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
					child=getText(subval);
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
	return toascii(out);
}

function getNoun(subval)
{
	var obj,name;
	if (subval&8)
		obj=targetObject;
	else
		obj=sourceObject;
	if ((subval&3)==1)
	{
		var idx=get(obj,7);
		idx=((idx>>4)&3)+1;
		name=getNouns(idx);
	}
	else
	{
		name=getText(obj);
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
		name=capitalize(name);
	return name;
}
function getPrefix(flag,obj)
{
	var attr=(get(obj,7)>>flag)&3;
	if (attr)
		return getPrefixes(attr);
	return '';
}
