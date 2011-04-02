/********************** public functions *********************/
var soundSupport=false;
var muted=false;

try {
	var type=document.createElement('audio').canPlayType('audio/wav');
	soundSupport=type!='' && type!='no';
} catch (e) {}

/**
 * @constructor
 */
function Sound(len,freq)
{
	this.data=new Array(len);
	this.len=len;
	this.freq=freq;
}
Sound.prototype.time=function()
{
	return this.len/this.freq;
}
Sound.prototype.play=function()
{
	var audio=$(document.createElement('audio'));
	$(document.body).append(audio);
	audio.attr("src","data:audio/x-wav;base64,"+towav(this));
	var vol=getSetting('volume');
	if (vol==null) vol=50;
	audio.attr('volume',vol/100);
	audio.bind('ended',function(){
		audio.remove();
	});
	audio.get(0).play();
}

/********************** private functions *********************/

function encode64(input)
{
	var key="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"+
		"0123456789+/=";
	var output='';
	var chr1,chr2,chr3;
	var enc1,enc2,enc3,enc4;
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
			enc2|=chr2>>4;
			enc3=(chr2&15)<<2;
			enc4=64;
		}
		else
		{
			enc2|=chr2>>4;
			enc3=((chr2&15)<<2)|(chr3>>6);
			enc4=chr3&63;
		}
		output+=key.charAt(enc1)+
			key.charAt(enc2)+
			key.charAt(enc3)+
			key.charAt(enc4);
	} while (i<input.length);
	return output;
}
function towav(snd)
{
	var wav=new Array(44+snd.len);
	wav[0]=82; wav[1]=73; wav[2]=70; wav[3]=70; //RIFF
	var sublen=36+snd.len;
	wav[4]=sublen&0xff; wav[5]=(sublen>>8)&0xff;
	wav[6]=(sublen>>16)&0xff; wav[7]=(sublen>>24)&0xff;
	wav[8]=87; wav[9]=65; wav[10]=86; wav[11]=69; //WAVE
	wav[12]=102; wav[13]=109; wav[14]=116; wav[15]=32; //fmt
	wav[16]=0x10; wav[17]=0; wav[18]=0; wav[19]=0; //chunksize
	wav[20]=1; wav[21]=0; //pcm
	wav[22]=1; wav[23]=0; //mono
	wav[24]=snd.freq&0xff; wav[25]=(snd.freq>>8)&0xff;
	wav[26]=(snd.freq>>16)&0xff; wav[27]=(snd.freq>>24)&0xff;
	wav[28]=wav[24]; wav[29]=wav[25];
	wav[30]=wav[26]; wav[31]=wav[27]; //byte rate
	wav[32]=1; wav[33]=0; //block align
	wav[34]=8; wav[35]=0; //bits per sample
	wav[36]=100; wav[37]=97; wav[38]=116; wav[39]=97; //data
	wav[40]=snd.len&0xff; wav[41]=(snd.len>>8)&0xff;
	wav[42]=(snd.len>>16)&0xff; wav[43]=(snd.len>>24)&0xff;
	for (var i=0;i<snd.len;i++)
		wav[44+i]=snd.data[i];
	return encode64(wav);
}
