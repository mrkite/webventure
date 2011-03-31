
/********************** public functions *********************/

function loadGame(root)
{
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
}
function gameLoaded()
{
	return mainfile!=undefined;
}



/********************** private functions *********************/
var files=[];
var mainfile=undefined;
var allocSize,allocStart,catStart;

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
			fatal("Bad HFS Node");
	}
}
function handleLeaf(record)
{
	mainfile.seek(record,mainfile.set);
	var keylen=mainfile.r8();
	if (keylen==0) return;
	keylen++;
	if (keylen&1) keylen++; //word align
	mainfile.r8(); //padding
	var parent=mainfile.r32();
	var namelen=mainfile.r8();
	var name=mainfile.read(namelen);
	mainfile.seek(record+keylen,mainfile.set);
	var filetype=mainfile.r16();
	switch (filetype)
	{
		case 0x200: //file
			var file={parent:parent,name:name};
			mainfile.seek(record+keylen+4,mainfile.set);
			file.type=mainfile.r32();
			file.creator=mainfile.r32();
			mainfile.seek(record+keylen+0x14,mainfile.set);
			var id=mainfile.r32();
			mainfile.seek(2,mainfile.cur);
			file.dataLen=mainfile.r32();
			mainfile.seek(6,mainfile.cur);
			file.resLen=mainfile.r32();
			mainfile.seek(record+keylen+0x4a,mainfile.set);
			file.dataStart=mainfile.r16();
			mainfile.seek(record+keylen+0x56,mainfile.set);
			file.resStart=mainfile.r16();
			files[id]=file;
			break;
		default: //ignore any other types (links etc)
			break;
	}
}
