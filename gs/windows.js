/********************** public functions *********************/
var WinBorder=2;
var WinTitleHeight=24;
var WinInfoHeight=20;
var WinAlertBorder=4;
var VScrollWidth=32;
var HScrollHeight=24;

var HScrollArrowRight=34;
var HScrollBucket=32;
var HScrollBucketStart=32;
var HScrollPadding=2;

var VScrollArrowDown=24;
var VScrollBucket=24;
var VScrollBucketStart=22;
var VScrollPadding=2;

var GrowWidth=32;
var GrowHeight=24;

var winbg,exitbg,exitbga;

var abouts=[
"\x01\x4a\x01\x00All rights reserved.\r\x01\x4a\x01\x00Programming by Sean Kasun\r\x01\x4a\x01\x00Original Development Team: Todd Squires, Craig Erickson, Kurt Nelson, Steven Hays, Terry Schulenburg, Darin Adler, Jay Zipnick, Waldemar Horwat, Mark Waterman, Dave Marsh, Karl Roelofs",
"\x01\x4a\x01\x00All rights reserved.\r\x01\x4a\x01\x00Programming by Sean Kasun\r\x01\x4a\x01\x00Original Development Team: Jay Zipnick, Billy Wolfe, Terry Schulenburg, Mark Waterman, Darin Adler, Dave Marsh, Todd Squires, Karl Roelofs, Tod Zipnick, Steven Hays, Waldemar Horwat, Craig Erickson",
"\x01\x4a\x01\x00^0 is a registered trademark of Zojoi LLC. All rights reserved.\r\x01\x4a\x01\x00Programming by Sean Kasun\r\x01\x4a\x01\x00Original Development Team: Dave Marsh, Karl Roelofs, Terry Schulenburg, Dave Feldman, Jay Zipnick, Todd Squires, Darin Adler, Tod Zipnick, Waldemar Horwat, Steven Hays",
"\x01\x4a\x01\x00All rights reserved.\r\x01\x4a\x01\x00Programming by Sean Kasun\r\x01\x4a\x01\x00Original Development Team: Darin Adler, Mitch Adler, Fred Allen, Brian Baker, Ed Dluzen, David Feldman, Steven Hays, Jay Zipnick, Julia Ulano, David Marsh, Karl Roelofs, Paul Snively, Todd Squires, Tod Zipnick, Waldemar Horwat, Michael Manning"
];


function getAboutWin()
{
	var dialog=createAlert(168,41,310,237);
	dialog.add(createCtl([96,205,118,20],1,0xa,["OK"]));

  var msg = "\x01\x4a\x01\x00^0\r\x01\x4a\x01\x00&#169; 2014 Zojoi LLC.\r";
  msg += abouts[RELEASE - 1];

  dialog.add(createCtl([10,14,290,160], 2, 0x8016, [msg]));
	dialog.param([resGetGameName()]);
	return dialog;
}
function getVolumeWin()
{
	var dialog=createAlert(80,80,480,200);
	dialog.add(createCtl([214,150,50,20],1,0xa,["OK"]));
	dialog.add(createCtl([100,80,280,22],2,0x18,[0,0,100]));
	var label=createCtl([20,30,440,30],3,0xf,["Sound Volume"]);
	label.obj.css('text-align','center');
	dialog.add(label);
	return dialog;
}

function getAskSave(why)
{
	var dialog=createAlert(92,146,456,108);
	dialog.add(createCtl([24,68,120,22],1,0xa,["YES"]));
	dialog.add(createCtl([168,68,120,22],3,0xa,["NO"]));
	dialog.add(createCtl([312,68,120,22],2,0xa,["CANCEL"]));
	dialog.add(createCtl([100,10,340,38],4,0x8016,["Save changes before ^0   "]));
	switch (why)
	{
		case 0: dialog.param(["starting a new game?"]); break;
		case 1: dialog.param(["opening another game?"]); break;
		case 2: dialog.param(["quitting?"]); break;
	}
	return dialog;
}
function getOpenDialog()
{
	var dialog=createAlert(50,70,520,228);
	dialog.add(createCtl([12,8,298,30],4,0x16,["Load which game:"]));
	dialog.add(createCtl([12,50,298,164],3,0x17,[]));
	dialog.add(createCtl([320,158,190,24],1,0xa,["Open"]));
	dialog.add(createCtl([320,194,190,24],2,0xa,["Cancel"]));
	return dialog;
}
function getSaveDialog()
{
	var dialog=createAlert(50,70,540,256);
	dialog.add(createCtl([22,50,298,124],4,0x17,[]));
	dialog.add(createCtl([22,182,298,30],5,0x16,["Save game as:"]));
	dialog.add(createCtl([22,200,290,36],3,0x11,[""]));
	dialog.add(createCtl([330,186,200,22],1,0xa,["Save"]));
	dialog.add(createCtl([330,222,200,22],2,0xa,["Cancel"]));
	return dialog;
}

function getInventoryWindow()
{
	var rect=getInventoryRect();
	
	var iw=gsWindow(inventory.wFrame,rect.left,rect.top,rect.width,rect.height);
	iw.kind=0xe;
	return iw;
}

function getDiplomaWin()
{
	hires=true;
	return getWindow(6);
}
function getDiplomaDialog()
{
	var dialog=createAlert(10,352,620,40);
	dialog.add(createCtl([10,8,60,24],1,0xa,['Print']));
	dialog.add(createCtl([544,8,64,24],2,0xa,['Quit']));
	dialog.add(createCtl([84,10,450,26],3,0x8016,['\x01\x4a\x01\x00^0']));
	dialog.param([resGetCertPrompt()]);
	return dialog;
}
function getDiplomaSignature()
{
	var sig=resGetSignature();
	var te=createCtl([sig.left,sig.bottom*2-20,sig.width,20],5,0x11,['']);
	te.obj.css('text-align','center');
	return te;
}

function getLoseDialog()
{
	var dialog=createAlert(140,136,430,128);
	dialog.add(createCtl([14,56,122,26],1,0xa,['YES']));
	dialog.add(createCtl([260,56,152,26],3,0xa,['NO']));
	dialog.add(createCtl([14,92,398,26],4,0xa,["Yes, I'll use a saved game."]));
	dialog.add(createCtl([14,10,398,38],2,0xf,["You have lost ... Would you\nlike to have another try?"]));
	return dialog;
}

function getTextDialog()
{
	var dialog=createAlert(20,92,600,140);
	dialog.add(createCtl([10,99,50,20],1,0xa,['OK']));
	dialog.add(createCtl([96,99,120,20],2,0xa,['CANCEL']));
	dialog.add(createCtl([10,10,580,36],4,0x16,['^0']));
	dialog.add(createCtl([10,56,580,28],3,0x11,['']));
	return dialog;
}

function gsWindow(wFrame,left,top,width,height)
{
	var zoom=wFrame&0x100;
	var close=wFrame&0x4000;
	var klass="dbox";
	var vs=false;
	var hs=false;
	if (wFrame&0x8000)
		klass="document";
	if (wFrame&0x0010)
		klass="info";
	if (wFrame&0x2000)
		klass="alert";
	if (wFrame&0x1000)
		vs=true;
	if (wFrame&0x0800)
		hs=true;
	return createWindow(klass,close,zoom,vs,hs,left,top,width,height);
}


/********************** private functions *********************/
