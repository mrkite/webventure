
/********************** public functions *********************/

function loadGame(root)
{
	$.ajax({
		url:root,
		beforeSend: function(xhr) {
			xhr.overrideMimeType('text/html; charset=x-user-defined');
		},
		complete: function(xhr) {
			disk=new GFile(xhr.responseText);
			disk.seek(0x414,disk.set);
			allocSize=disk.r32();
			disk.seek(0x41c,disk.set);
			allocStart=disk.r16();
			disk.seek(0x496,disk.set);
			catStart=disk.r16();
			loadCatalog();
		}
	});
}
function gameLoaded()
{
	return disk!=undefined;
}

function getKind(type,creator)
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
			disk.seek((files[i].resStart+allocStart)*allocSize,disk.set);
			return new GFile(disk.read(files[i].resLen));
		}
	}
	return undefined;
}

function getFile(filename)
{
	for (var i in files)
	{
		if (files[i].name==filename)
		{
			if (files[i].dataLen==0) return undefined;
			disk.seek((files[i].dataStart+allocStart)*allocSize,disk.set);
			return new GFile(disk.read(files[i].dataLen));
		}
	}
	return undefined;
}
function getResFile(filename)
{
	for (var i in files)
	{
		if (files[i].name==filename)
		{
			if (files[i].resLen==0) return undefined;
			disk.seek((files[i].resStart+allocStart)*allocSize,disk.set);
			return new GFile(disk.read(files[i].resLen));
		}
	}
	return undefined;
}



/********************** private functions *********************/
var files=[];
var disk=undefined;
var allocSize,allocStart,catStart;

function loadCatalog()
{
	var block=(catStart+allocStart)*allocSize;
	disk.seek(block+allocSize-2,disk.set);
	var record=disk.r16();
	disk.seek(block+record+2,disk.set);
	var root=disk.r32();
	walkTree(block,root);
}
function walkTree(block,node)
{
	var cur=block+node*512;
	disk.seek(cur+8,disk.set);
	var kind=disk.r8();
	disk.r8();
	var numRecords=disk.r16();
	switch (kind)
	{
		case 0: //index node
			for (var i=0;i<numRecords;i++)
			{
				disk.seek(cur+512-(i+1)*2,disk.set);
				var ofs=disk.r16();
				disk.seek(cur+ofs,disk.set);
				var keylen=disk.r8();
				disk.seek(cur+ofs+keylen+1,disk.set);
				var next=disk.r32();
				walkTree(block,next);
			}
			break;
		case 0xff: //leaf node
			for (var i=0;i<numRecords;i++)
			{
				disk.seek(cur+512-(i+1)*2,disk.set);
				var ofs=disk.r16();
				handleLeaf(cur+ofs);
			}
			break;
		default:
			fatal("Bad HFS Node");
	}
}
function handleLeaf(record)
{
	disk.seek(record,disk.set);
	var keylen=disk.r8();
	if (keylen==0) return;
	keylen++;
	if (keylen&1) keylen++; //word align
	disk.r8(); //padding
	var parent=disk.r32();
	var namelen=disk.r8();
	var name=disk.read(namelen);
	disk.seek(record+keylen,disk.set);
	var filetype=disk.r16();
	switch (filetype)
	{
		case 0x200: //file
			var file={parent:parent,name:name};
			disk.seek(record+keylen+4,disk.set);
			file.type=disk.r32();
			file.creator=disk.r32();
			disk.seek(record+keylen+0x14,disk.set);
			var id=disk.r32();
			disk.seek(2,disk.cur);
			file.dataLen=disk.r32();
			disk.seek(6,disk.cur);
			file.resLen=disk.r32();
			disk.seek(record+keylen+0x4a,disk.set);
			file.dataStart=disk.r16();
			disk.seek(record+keylen+0x56,disk.set);
			file.resStart=disk.r16();
			files[id]=file;
			break;
		default: //ignore any other types (links etc)
			break;
	}
}
