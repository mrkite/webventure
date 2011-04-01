/********************** public functions *********************/

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
function getSaveDialog()
{
	var dialog=createAlert(50,70,540,256);
	dialog.add(createCtl([22,50,298,124],4,0x17));
	dialog.add(createCtl([22,182,298,30],5,0x16,["Save game as:"]));
	dialog.add(createCtl([22,200,290,36],3,0x11,[""]));
	dialog.add(createCtl([330,186,200,22],1,0xa,["Save"]));
	dialog.add(createCtl([330,222,200,22],2,0xa,["Cancel"]));
	return dialog;
}


/********************** private functions *********************/
