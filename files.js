/**
 * @constructor
 */
function GFile(data)
{
	var self=this;
	this.set=0;
	this.cur=1;
	this.end=2;
	this.length=data.length;
	var pos=0;
	this.bit=0;
	this.eof=function()
	{
		return pos>=self.length;
	}
	this.r8=function()
	{
		return data.charCodeAt(pos++)&0xff;
	}
	this.r16=function()
	{
		var v=(data.charCodeAt(pos++)&0xff)<<8;
		v|=data.charCodeAt(pos++)&0xff;
		return v;
	}
	this.r24=function()
	{
		var v=(data.charCodeAt(pos++)&0xff)<<16;
		v|=(data.charCodeAt(pos++)&0xff)<<8;
		v|=data.charCodeAt(pos++)&0xff;
		return v;
	}
	this.r32=function()
	{
		var v=(data.charCodeAt(pos++)&0xff)<<24;
		v|=(data.charCodeAt(pos++)&0xff)<<16;
		v|=(data.charCodeAt(pos++)&0xff)<<8;
		v|=data.charCodeAt(pos++)&0xff;
		return v;
	}
	this.peek32=function()
	{
		var v=(data.charCodeAt(pos)&0xff)<<24;
		v|=(data.charCodeAt(pos+1)&0xff)<<16;
		v|=(data.charCodeAt(pos+2)&0xff)<<8;
		v|=data.charCodeAt(pos+3)&0xff;
		return v;
	}
	this.seek=function(newpos,rel)
	{
		switch (rel)
		{
			case self.set:
				break;
			case self.cur:
				newpos+=pos;
				break;
			case self.end:
				newpos+=self.length;
				break;
		}
		pos=newpos;
	}
	this.read=function(len)
	{
		var oldpos=pos;
		pos+=len;
		return data.substring(oldpos,pos);
	}
	this.bits=function(num)
	{
		var v=self.peek32();
		v>>>=(32-self.bit)-num;
		v&=(1<<num)-1;
		self.bit+=num;
		if (self.bit&0x10)
		{
			self.bit&=0xf;
			pos+=2;
		}
		return v;
	}
}
/**
 * @constructor
 */
function MacFile(parent,name,type,creator,dataStart,dataLen,resStart,resLen)
{
	this.parent=parent;
	this.name=name;
	this.type=type;
	this.creator=creator;
	this.dataStart=dataStart;
	this.dataLen=dataLen;
	this.resStart=resStart;
	this.resLen=resLen;
}
/**
 * @constructor
 */
function FileManager(root)
{
	var files=[];
	var allocSize,allocStart,catStart;
	var mainfile=undefined;
	var self=this;
	$.ajax({
		url:root,
		beforeSend: function(xhr) {
			xhr.overrideMimeType('text/html; charset=x-user-defined');
		},
		complete: function(xhr) {
			mainfile=new GFile(xhr.responseText);
			mainfile.seek(0x414,mainfile.set);
			allocSize=mainfile.r32();
			mainfile.seek(0x41c,mainfile.set);
			allocStart=mainfile.r16();
			mainfile.seek(0x496,mainfile.set);
			catStart=mainfile.r16();
			loadCatalog();
		}
	});
	this.isReady=function()
	{
		return mainfile!=undefined;
	}
	this.getResByKind=function(type,creator)
	{
		var typeid=0,creatorid=0;
		for (var i=0;i<4;i++)
		{
			typeid|=type.charCodeAt(i)<<(24-(i*8));
			creatorid|=creator.charCodeAt(i)<<(24-(i*8));
		}
		for (var i in files)
		{
			if (files[i].type==typeid &&
				files[i].creator==creatorid)
			{
				mainfile.seek((files[i].resStart+allocStart)*allocSize,mainfile.set);
				return new GFile(mainfile.read(files[i].resLen));
			}
		}
		return undefined;
	}
	this.getRes=function(filename)
	{
		for (var i in files)
		{
			if (files[i].name==filename)
			{
				if (files[i].resLen==0) return undefined;
				mainfile.seek((files[i].resStart+allocStart)*allocSize,mainfile.set);
				return new GFile(mainfile.read(files[i].resLen));
			}
		}
		return undefined;
	}
	this.getData=function(filename)
	{
		for (var i in files)
		{
			if (files[i].name==filename)
			{
				if (files[i].dataLen==0) return undefined;
				mainfile.seek((files[i].dataStart+allocStart)*allocSize,mainfile.set);
				return new GFile(mainfile.read(files[i].dataLen));
			}
		}
		return undefined;
	}
	this.neg16=function(val)
	{
		if (val&0x8000)
			val=-((val^0xffff)+1);
		return val;
	}
	function loadCatalog()
	{
		var block=(catStart+allocStart)*allocSize;
		mainfile.seek(block+allocSize-2,mainfile.set);
		var record=mainfile.r16();
		mainfile.seek(block+record+2,mainfile.set);
		var root=mainfile.r32();
		walkTree(block,root);
	}
	function walkTree(block,node)
	{
		var cur=block+node*512;
		mainfile.seek(cur+8,mainfile.set);
		var kind=mainfile.r8();
		mainfile.r8();
		var numRecords=mainfile.r16();
		switch (kind)
		{
			case 0: //index node
				for (var i=0;i<numRecords;i++)
				{
					mainfile.seek(cur+512-(i+1)*2,mainfile.set);
					var ofs=mainfile.r16();
					mainfile.seek(cur+ofs,mainfile.set);
					var keylen=mainfile.r8();
					mainfile.seek(cur+ofs+keylen+1,mainfile.set);
					var next=mainfile.r32();
					walkTree(block,next);
				}
				break;
			case 0xff: //leaf node
				for (var i=0;i<numRecords;i++)
				{
					mainfile.seek(cur+512-(i+1)*2,mainfile.set);
					var ofs=mainfile.r16();
					handleLeaf(cur+ofs);
				}
				break;
			default:
				throw "Bad node";
		}
	}
	function handleLeaf(record)
	{
		mainfile.seek(record,mainfile.set);
		var keylen=mainfile.r8();
		if (keylen==0) return;
		keylen++;
		if (keylen&1) keylen++;
		mainfile.r8(); //padding
		var parent=mainfile.r32();
		var namelen=mainfile.r8();
		var name=mainfile.read(namelen);
		mainfile.seek(record+keylen,mainfile.set);
		var filetype=mainfile.r16();
		switch (filetype)
		{
			case 0x200: //file
				mainfile.seek(record+keylen+4,mainfile.set);
				var type=mainfile.r32();
				var creator=mainfile.r32();
				mainfile.seek(record+keylen+0x14,mainfile.set);
				var id=mainfile.r32();
				mainfile.seek(2,mainfile.cur);
				var dataLen=mainfile.r32();
				mainfile.seek(6,mainfile.cur);
				var resLen=mainfile.r32();
				mainfile.seek(record+keylen+0x4a,mainfile.set);
				var dataStart=mainfile.r16();
				mainfile.seek(record+keylen+0x56,mainfile.set);
				var resStart=mainfile.r16();
				files[id]=new MacFile(parent,name,type,creator,dataStart,dataLen,resStart,resLen);
				break;
		}
	}
}
