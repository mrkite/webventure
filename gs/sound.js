/********************** public functions *********************/
function playSound(id)
{
	var snd=getObject(4,id);
	var f=new GFile(snd);
	var sound=undefined;
	switch (snd.charCodeAt(7))
	{
		case 0: //straight 8
			sound=doSampled(f);
			break;
		case 1: //MIDI
			break;
		case 2: //compressed 4
			sound=doCompressed(f);
			break;
	}
	if (sound==undefined) return 0;
	if (soundSupport && !muted)
		sound.play();
	return sound.time();
}

/********************** private functions *********************/

function doSampled(f)
{
	var soundlen=0;
	var numParts=f.r16();
	for (var part=0;part<numParts;part++)
	{
		f.r16(); //sampleDataOffset
		soundlen+=f.r16(); //sampleLen
		f.r16(); //type
		f.r16();
	}
	f.seek(8,f.set);
	var freq=f.r16();
	var sound=new Sound(soundlen,freq);
	var pos=0;
	var ch;
	for (var part=0;part<numParts;part++)
	{
		f.seek(2+part*8,f.set);
		var ofs=f.r16();
		var len=f.r16();
		f.seek(ofs,f.set);
		for (var i=0;i<len;i++)
			sound.data[pos++]=f.r8();
	}
	return sound;
}
var wavtable=[0x7f,0x7e,0x7c,0x78,0x70,0x60,0x40,0x01,
		0x80,0x81,0x83,0x87,0x8f,0x9f,0xbf,0xff];
function doCompressed(f)
{
	var soundlen=0;
	var numParts=f.r16();
	for (var part=0;part<numParts;part++)
	{
		f.r16(); //sampleDataOffset
		soundlen+=f.r16()*2; //sampleLength
		f.r16(); //type
		f.r16(); //freq
	}
	f.seek(8,f.set);
	var freq=f.r16();
	var sound=new Sound(soundlen,freq);
	var pos=0;
	for (var part=0;part<numParts;part++)
	{
		f.seek(2+part*8,f.set);
		var ofs=f.r16();
		var len=f.r16()*2;
		f.seek(ofs,f.set);
		var ch;
		for (var i=0;i<len;i++)
		{
			if (i&1) ch>>=4;
			else ch=f.r8();
			sound.data[pos++]=wavtable[ch&0xf];
		}
	}
	return sound;
}
