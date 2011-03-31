/**
 * @constructor
 */
function GFile(data)
{
	this.set=0;
	this.cur=1;
	this.end=2;
	this.data=data;
	this.length=data.length;
	this.pos=0;
	this.bit=0;
}
GFile.prototype.eof=function()
{
	return this.pos>=this.length;
}
GFile.prototype.r8=function()
{
	return this.data.charCodeAt(this.pos++)&0xff;
}
GFile.prototype.r16=function()
{
	var v=(this.data.charCodeAt(this.pos++)&0xff)<<8;
	v|=this.data.charCodeAt(this.pos++)&0xff;
	return v;
}
GFile.prototype.r24=function()
{
	var v=(this.data.charCodeAt(this.pos++)&0xff)<<16;
	v|=(this.data.charCodeAt(this.pos++)&0xff)<<8;
	v|=this.data.charCodeAt(this.pos++)&0xff;
	return v;
}
GFile.prototype.r32=function()
{
	var v=(this.data.charCodeAt(this.pos++)&0xff)<<24;
	v|=(this.data.charCodeAt(this.pos++)&0xff)<<16;
	v|=(this.data.charCodeAt(this.pos++)&0xff)<<8;
	v|=this.data.charCodeAt(this.pos++)&0xff;
	return v;
}
GFile.prototype.r32le=function()
{
	var v=this.data.charCodeAt(this.pos++)&0xff;
	v|=(this.data.charCodeAt(this.pos++)&0xff)<<8;
	v|=(this.data.charCodeAt(this.pos++)&0xff)<<16;
	v|=(this.data.charCodeAt(this.pos++)&0xff)<<24;
	return v;
}
GFile.prototype.r4=function()
{
	var v=this.data.substring(this.pos,this.pos+4);
	this.pos+=4;
	return v;
}
GFile.prototype.peek32=function()
{
	var v=(this.data.charCodeAt(this.pos)&0xff)<<24;
	v|=(this.data.charCodeAt(this.pos+1)&0xff)<<16;
	v|=(this.data.charCodeAt(this.pos+2)&0xff)<<8;
	v|=this.data.charCodeAt(this.pos+3)&0xff;
	return v;
}
GFile.prototype.seek=function(newpos,rel)
{
	switch (rel)
	{
		case this.set:
			break;
		case this.cur:
			newpos+=this.pos;
			break;
		case this.end:
			newpos+=this.length;
			break;
	}
	this.pos=newpos;
}
GFile.prototype.read=function(len)
{
	var oldpos=this.pos;
	this.pos+=len;
	return this.data.substring(oldpos,this.pos);
}
GFile.prototype.bits=function(num)
{
	var v=this.peek32();
	v>>>=(32-this.bit)-num;
	v&=(1<<num)-1;
	this.bit+=num;
	if (this.bit&0x10)
	{
		this.bit&=0xf;
		this.pos+=2;
	}
	return v;
}
