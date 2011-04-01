/********************** public functions *********************/
var WinBorder=2;
var WinTitleHeight=24;
var WinInfoHeight=20;
var WinAlertBorder=4;
var VScrollWidth=32;
var HScrollHeight=24;

var HScrollArrowRight=34;
var HScrollBucket=68;
var HScrollBucketStart=32;

var VScrollArrowDown=24;
var VScrollBucket=48;
var VScrollBucketStart=22;

var GrowWidth=32;
var GrowHeight=24;

var winbg,exitbg,exitbga;


function getAboutWin()
{
	var dialog=createAlert(10,36,620,354);
	dialog.add(createCtl([240,318,120,22],1,0xa,["OK"]));
	dialog.add(createCtl([10,18,600,146],2,0x8016,["\x01\x4a\x01\x00Apple IIGS ^0\r\x01\x4a\x01\x00Written by:\r\x01\x4a\x01\x00\x01\x53\x01\x00Fred Allen\x01\x53\x00\x00\r\r\x01\x4a\x01\x00Artwork by:\r^1\r\r\x01\x4a\x01\x00\x01\x53\x04\x00MacVenture Team\x01\x53\x00\x00"]));
	dialog.add(createCtl([10,164,300,136],3,0x8016,["^2"]));
	dialog.add(createCtl([310,164,300,136],4,0x8016,["^3"]));
	dialog.add(createCtl([10,294,600,22],5,0x8016,["\x01\x4a\x01\x00WebVenture by Sean Kasun"]));
	dialog.param([resGetGameName(),resGetCredits(0),resGetCredits(1),resGetCredits(2)]);
	return dialog;
}
function getVolumeWin()
{
	var dialog=createAlert(80,80,480,200);
	dialog.add(createCtl([214,150,50,30],1,0xa,["OK"]));
	dialog.add(createCtl([100,80,280,22],2,0x18,[0,0,100]));
	dialog.add(createCtl([20,30,440,30],3,0xf,["Sound Volume"]));
	return dialog;
}

function getAskSave(why)
{
	var dialog=createAlert(92,146,456,108);
	dialog.add(createCtl([24,68,120,22],1,0xa,["YES"]));
	dialog.add(createCtl([168,68,120,22],2,0xa,["NO"]));
	dialog.add(createCtl([312,68,120,22],3,0xa,["CANCEL"]));
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


/********************** private functions *********************/
