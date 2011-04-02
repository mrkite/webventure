/********************** public functions *********************/
function openResources()
{
	res=getFile("3/RESOURCE.DAT");
}

function resGetPath(n)
{
	res.seek(0x170+n*0x20,res.set);
	var len=res.r8();
	return res.read(len);
}

// name of default save
function resGetUntitled()
{
	return "Untitled";
}

// name of start game
function resGetDefault()
{
	res.seek(0x170+4*0x20,res.set);
	var len=res.r8();
	return res.read(len);
}

// fetch window definition
function resGetWindow(n)
{
	res.seek(n*0xa);
	var win={};
	win.top=res.r16le();
	win.left=res.r16le();
	win.bottom=res.r16le();
	win.right=res.r16le();
	win.wFrame=res.r16le();
	return win;
}

function resGetGNRL()
{
	var gnrl={};
	res.seek(0x4c,res.set);
	gnrl.numObjects=res.r16le();
	gnrl.numGlobals=res.r16le();
	gnrl.numAttributes=res.r16le();
	gnrl.numGroups=res.r16le();
	res.r16le(); //skip unknown
	gnrl.numCmds=res.r16le();
	gnrl.cmdNumObjs=[];
	for (var i=0;i<24;i++)
		gnrl.cmdNumObjs.push(res.r8());
	gnrl.attrIdxs=[];
	for (var i=0;i<64;i++)
		gnrl.attrIdxs.push(res.r8());
	gnrl.attrMasks=[];
	for (var i=0;i<64;i++)
		gnrl.attrMasks.push(res.r16le());
	gnrl.attrShifts=[];
	for (var i=0;i<64;i++)
		gnrl.attrShifts.push(res.r8());
	return gnrl;
}

// fetch apple menu def
function resGetAppleMenu()
{
	res.seek(0x400);
	return res.read(0x30);
}

function resGetPalette()
{
	var p=[];
	res.seek(0x2d0,res.set);
	for (var i=0;i<16;i++)
		p.push(res.r16le());
	return p;
}

function resGetPaletteMap()
{
	var p=[];
	res.seek(0x2f0,res.set);
	for (var i=0;i<256;i++)
		p.push(res.r8());
	return p;
}

function resGetWindowColor()
{
	res.seek(0x444,res.set);
	return res.r16le();
}

function resGetExitBG()
{
	var p=[];
	res.seek(0x63c,res.set);
	for (var i=0;i<8*4;i++)
		p.push(res.r8());
	return p;
}
function resGetExitBGA()
{
	var p=[];
	res.seek(0x664,res.set);
	for (var i=0;i<8*4;i++)
		p.push(res.r8());
	return p;
}

function resGetSignature()
{
	var sig={};
	res.seek(0x46,res.set);
	sig.bottom=res.r16le();
	sig.left=res.r16le();
	sig.width=res.r16le();
	return sig;
}

function resGetCertPrompt()
{
	res.seek(0x5b8,res.set);
	var len=res.r8();
	return res.read(len);
}

function resGetGameName()
{
	res.seek(0x3f0,res.set);
	var len=res.r8();
	return toascii(res.read(len));
}

var creditofs=[0,0x50,0xd0];
function resGetCredits(n)
{
	res.seek(0x468+creditofs[n],res.set);
	var len=res.r8();
	return res.read(len);
}

function getHuff()
{
	if (res.length==0x68c) return undefined; //no huff table
	var huff={};
	res.seek(0x68c,res.set);
	huff.length=res.r16le();
	huff.masks=[];
	res.seek(0x690,res.set);
	for (var i=0;i<huff.length;i++)
		huff.masks.push(res.r16le());
	huff.lens=[];
	res.seek(0x74c,res.set);
	for (var i=0;i<huff.length;i++)
		huff.lens.push(res.r8());
	huff.values=[];
	res.seek(0x7ac,res.set);
	for (var i=0;i<huff.length;i++)
		huff.values.push(res.r8());
	return huff;
}

/********************** private functions *********************/
var res;
