/********************** public functions *********************/
var winbg;

function openResources()
{
	res=getFile("3/RESOURCE.DAT");
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

// fetch apple menu def
function resGetAppleMenu()
{
	res.seek(0x400);
	return res.read(0x30);
}

/********************** private functions *********************/
var res;
