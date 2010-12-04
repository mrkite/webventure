function Sound(len,freq)
{
	var self=this;
	var key="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"+
		"0123456789+/=";
	this.data=new Array(len);
	this.time=function()
	{
		return len/freq;
	}
	this.play=function()
	{
		var audio=$(document.createElement('audio'));
		$(document.body).append(audio);
		audio.attr("src","data:audio/x-wav;base64,"+towav());
		var vol=webventure.setting('volume');
		if (vol==null) vol=50;
		audio.attr("volume",vol/100);
		audio.bind('ended',function(){
			audio.remove();
		});
		audio.get(0).play();
	}
	function encode64(input)
	{
		var output="";
		var chr1,chr2,chr3="";
		var enc1,enc2,enc3,enc4="";
		var i=0;
		do {
			chr1=input[i++];
			chr2=input[i++];
			chr3=input[i++];
			enc1=chr1>>2;
			enc2=(chr1&3)<<4;
			if (chr2==undefined)
				enc3=enc4=64;
			else if (chr3==undefined)
			{
				enc2|=(chr2>>4);
				enc4=64;
			}
			else
			{
				enc2|=(chr2>>4);
				enc3=((chr2&15)<<2)|(chr3>>6);
				enc4=chr3&63;
			}
			output+=key.charAt(enc1) +
				key.charAt(enc2) +
				key.charAt(enc3) +
				key.charAt(enc4);
		} while (i<input.length);
		return output;
	}
	function towav()
	{
		var wave=new Array(44+len);
		wave[0]=82; wave[1]=73; wave[2]=70; wave[3]=70; //RIFF
		var sublen=36+len;
		wave[4]=sublen&0xff; wave[5]=(sublen>>8)&0xff;
		wave[6]=(sublen>>16)&0xff; wave[7]=(sublen>>24)&0xff;
		wave[8]=87; wave[9]=65; wave[10]=86; wave[11]=69; //WAVE
		wave[12]=102; wave[13]=109; wave[14]=116; wave[15]=32; //fmt
		wave[16]=0x10; wave[17]=0; wave[18]=0; wave[19]=0; //chunksize
		wave[20]=1; wave[21]=0; //pcm
		wave[22]=1; wave[23]=0; //mono
		wave[24]=freq&0xff; wave[25]=(freq>>8)&0xff;
		wave[26]=(freq>>16)&0xff; wave[27]=(freq>>24)&0xff;
		wave[28]=wave[24]; wave[29]=wave[25];
		wave[30]=wave[26]; wave[31]=wave[27]; //byte rate
		wave[32]=1; wave[33]=0; //block align
		wave[34]=8; wave[35]=0; //bits per sample
		wave[36]=100; wave[37]=97; wave[38]=116; wave[39]=97; //data
		wave[40]=len&0xff; wave[41]=(len>>8)&0xff;
		wave[42]=(len>>16)&0xff; wave[43]=(len>>24)&0xff;
		for (var i=0;i<len;i++)
			wave[44+i]=self.data[i];
		return encode64(wave);
	}
}
function SoundManager(objects)
{
	var support=false;
	try {
		var type=document.createElement('audio').canPlayType('audio/wav');
		support=type!='' && type!='no';
		
	} catch (e) {}
	this.muted=false;
	this.play=function(id)
	{
		var snd=objects.get(4,id);
		var f=new File(snd);
		var sound=undefined;
		switch (snd.charCodeAt(5)&0xff)
		{
			case 0x10:
				sound=do10(f);
				break;
			case 0x12:
				sound=do12(f);
				break;
			case 0x18:
				sound=do18(f);
				break;
			case 0x1a:
				sound=do1a(f);
				break;
			case 0x44:
				sound=do44(f);
				break;
			case 0x78:
				sound=do78(f);
				break;
			case 0x7e:
				sound=do7e(f);
				break;
		}
		if (sound==undefined) return 0;
		else
		{
			if (support && !this.muted)
				sound.play();
			return sound.time();
		}
	}
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
}
