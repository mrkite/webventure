/********************** public functions *********************/

function playSound(id)
{
	var snd=getObject(4,id);
	var f=new GFile(snd);
	var sound=undefined;
	switch (snd.charCodeAt(5)&0xff)
	{
		case 0x10: sound=do10(f); break;
		case 0x12: sound=do12(f); break;
		case 0x18: sound=do18(f); break;
		case 0x1a: sound=do1a(f); break;
		case 0x44: sound=do44(f); break;
		case 0x78: sound=do78(f); break;
		case 0x7e: sound=do7e(f); break;
	}
	if (sound==undefined) return 0;
	if (soundSupport && !muted)
		sound.play();
	return sound.time();
}

/********************** private functions *********************/

function do10(f)
{
	var wavtable=[];
	f.seek(0x198,f.set);
	for (var i=0;i<16;i++)
		wavtable[i]=f.r8();
	var soundlen=f.r32()*2;
	f.r16();
	var freq=(f.r32()*22100/0x10000)|0;
	var sound=new Sound(soundlen,freq);
	var ch;
	for (var i=0;i<soundlen;i++)
	{
		if (i&1) ch>>=4;
		else ch=f.r8();
		sound.data[i]=wavtable[ch&0xf];
	}
	return sound;
}
function do12(f)
{
	f.seek(0xc,f.set);
	var repeat=f.r16();
	f.seek(0x34,f.set);
	var base=f.r16()+0x34;
	f.seek(base,f.set);
	var soundlen=f.r32()-6;
	f.r16();
	var freq=(f.r32()*22100/0x10000)|0;
	var sound=new Sound(soundlen*repeat,freq);
	var x=0;
	var scales=f.seek(0xe2,f.set)+0xe2;
	for (var i=0;i<repeat;i++)
	{
		f.seek(scales+i*2,f.set);
		var scale=f.r16();
		f.seek(base+0xa,f.set);
		for (var j=0;j<soundlen;j++)
		{
			var ch=f.r8();
			if (ch&0x80)
			{
				ch-=0x80;
				var env=ch*scale;
				ch=(env>>8)&0xff;
				if (ch&0x80) ch=0x7f;
				ch+=0x80;
			}
			else
			{
				ch=(ch^0xff)+1;
				ch-=0x80;
				var env=ch*scale;
				ch=(env>>8)&0xff;
				if (ch&0x80) ch=0x7f;
				ch+=0x80;
				ch=(ch^0xff)+1;
			}
			sound.data[x++]=ch;
		}
	}
	return sound;
}
function do18(f)
{
	var wavtable=[];
	f.seek(0x252,f.set);
	for (var i=0;i<16;i++)
		wavtable[i]=f.r8();
	var soundlen=f.r32()*2;
	f.r16();
	var freq=(f.r32()*22100/0x10000)|0;
	var sound=new Sound(soundlen,freq);
	var ch;
	for (var i=0;i<soundlen;i++)
	{
		if (i&1) ch>>=4;
		else ch=f.r8();
		sound.data[i]=wavtable[ch&0xf];
	}
	return sound;
}
function do1a(f)
{
	var wavtable=[];
	f.seek(0x220,f.set);
	for (var i=0;i<16;i++)
		wavtable[i]=f.r8();
	var soundlen=f.r32();
	f.r16();
	var freq=(f.r32()*22100/0x10000)|0;
	var sound=new Sound(soundlen,freq);
	var ch;
	for (var i=0;i<soundlen;i++)
	{
		if (i&1) ch>>=4;
		else ch=f.r8();
		sound.data[i]=wavtable[ch&0xf];
	}
	return sound;
}
function do44(f)
{
	f.seek(0x5e,f.set);
	var soundlen=f.r32();
	var freq=(f.r32()*22100/0x10000)|0;
	var sound=new Sound(soundlen,freq);
	for (var i=0;i<soundlen;i++)
		sound.data[i]=f.r8();
	return sound;
}
function do78(f)
{
	var wavtable=[];
	f.seek(0xba,f.set);
	for (var i=0;i<16;i++)
		wavtable[i]=f.r8();
	f.r32();
	var soundlen=f.r32();
	var freq=(f.r32()*22100/0x10000)|0;
	var sound=new Sound(soundlen,freq);
	var ch;
	for (var i=0;i<soundlen;i++)
	{
		if (i&1) ch<<=4;
		else ch=f.r8();
		sound.data[i]=wavtable[(ch>>4)&0xf];
	}
	return sound;
}
function do7e(f)
{
	var wavtable=[];
	f.seek(0xc2,f.set);
	for (var i=0;i<16;i++)
		wavtable[i]=f.r8();
	f.r32();
	var soundlen=f.r32();
	var freq=(f.r32()*22100/0x10000)|0;
	var sound=new Sound(soundlen,freq);
	var last=0x80;
	var ch;
	for (var i=0;i<soundlen;i++)
	{
		if (i&1) ch<<=4;
		else ch=f.r8();
		last+=wavtable[(ch>>4)&0xf];
		sound.data[i]=last&0xff;
	}
	return sound;
}
