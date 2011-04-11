/********************** public functions *********************/

function loadGame(root)
{
	$.ajax({
		'url':root,
		'beforeSend': function(xhr) {
			xhr.overrideMimeType('text/html; charset=x-user-defined');
		},
		'complete': function(xhr) {
			var img=new GFile(xhr.responseText);
			if (img.r4()!="2IMG")
				fatal("Not a valid 2mg file");
			img.seek(0xc,img.set);
			if (img.r32le()!=1)
				fatal("Not in ProDOS format");
			img.seek(0x14,img.set);
			var len=img.r32le()*512;
			var offset=img.r32le();
			img.seek(offset,img.set);
			disk=new GFile(img.read(len));
			delete img;
		}
	});
}
function gameLoaded()
{
	return disk!=undefined;
}

function getFile(fname)
{
	if (fname[0]=='3' && fname[1]=='/') //strip off volume id
		fname=fname.substring(2);
	return findFile(fname.toLowerCase(),2);
}

/********************** private functions *********************/

var disk=undefined;

function findFile(name,key)
{
	disk.seek(key*512+2,disk.set);
	var next=disk.r16le();
	var type=disk.r8();
	if ((type&0xf0)!=0xf0 && (type&0xf0)!=0xe0)
		fatal("Corrupt directory");
	disk.seek(0x1e,disk.cur);
	var entryLength=disk.r8();
	var entriesPerBlock=disk.r8();
	var fileCount=disk.r8();
	var curEntry=1;
	var curFile=0;

	var div=name.indexOf('/');
	var rest='';
	if (div>0) //directory
	{
		rest=name.substring(div+1);
		name=name.substring(0,div);
	}
	while (curFile<fileCount)
	{
		disk.seek(key*512+entryLength*curEntry+4,disk.set);
		type=disk.r8();
		if (type!=0) //exists
		{
			var n=disk.read(type&0xf);
			if (n.toLowerCase()==name)
			{
				if ((type&0xf0)==0xd0) //directory
				{
					disk.seek(0x10-(type&0xf),disk.cur);
					var subkey=disk.r16le();
					return findFile(rest,subkey);
				}
				disk.seek(key*512+entryLength*curEntry+4+0x11,disk.set);
				var subkey=disk.r16le();
				disk.seek(2,disk.cur);
				var eof=disk.r32le()&0xffffff;
				return readFile(subkey,eof,type&0xf0);
			}
			curFile++;
		}
		curEntry++;
		if (curEntry==entriesPerBlock)
		{
			curEntry=0;
			key=next;
			disk.seek(key*512+2,disk.set);
			next=disk.r16le();
		}
	}
	return false;
}

function readFile(key,len,type)
{
	var f="";
	switch (type)
	{
		case 0x10: //seedling
			f=readSeedling(key,len);
			break;
		case 0x20: //sapling
			f=readSapling(key,len);
			break;
		case 0x30: //tree
			f=readTree(key,len);
			break;
	}
	return new GFile(f);
}

function readSeedling(key,len)
{
	disk.seek(key*512,disk.set);
	return disk.read(len);
}
function readSapling(index,len)
{
	var out='';
	var pos=0;
	while (len>0)
	{
		disk.seek(index*512+pos,disk.set);
		var key=disk.r8();
		disk.seek(index*512+pos+256,disk.set);
		key|=disk.r8()<<8;
		var blen=len;
		if (blen>512) blen=512;
		if (key)
			out+=readSeedling(key,blen);
		else
			for (var i=0;i<blen;i++) //sparse file, pad with 0s
				out+=String.fromCharCode(0);
		len-=blen;
		pos++;
	}
	return out;
}
function readTree(index,len)
{
	var out='';
	var pos=0;
	while (len>0)
	{
		disk.seek(index*512+pos,disk.set);
		var key=disk.r8();
		disk.seek(index*512+pos+256,disk.set);
		key|=disk.r8()<<8;
		var blen=len;
		if (blen>256*512) blen=256*512;
		if (key)
			out+=readSapling(key,blen);
		else
			for (var i=0;i<blen;i++) //sparse file, pad with 0s
				out+=String.fromCharCode(0);
		len-=blen;
		pos++;
	}
	return out;
}

