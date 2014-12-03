/********************** public functions *********************/
function waitForLoad()
{
	if (!gameLoaded())
	{
		setTimeout(waitForLoad,10);
		return;
	}
	gameState=0;
	openResources();

	startImage.remove();
	delete startImage;

	showTitle();
	loadFiles();
	createWindows();
	initMenus();
	createMenus();
	addDeskAccessory("More Games...",0x901);
	addDeskAccessory("Adjust Volume...",0x900);
	addDeskAccessory("Help",0x903);
//	addDeskAccessory("Win!", 0x902);

	enableFeatureMenus();

	textWin.setTitle(resGetUntitled());

	if (gameparts.length>1) //save game to load
	{
		saveName=gameparts[1];
		var g=window.JSON.parse(window.localStorage.getItem(saveName).toString());
		game=g['gamedata'];
		globals=g['globals'];
		textEdit.html(g['text']);
		textWin.setTitle(saveName);
	}
	else
	{
		var g=getFile(resGetDefault());
		game=new Array(numGroups);
		globals=new Array(numGlobals);
		for (var i=0;i<numGroups;i++)
		{
			game[i]=new Array(numObjects);
			for (var o=0;o<numObjects;o++)
				game[i][o]=g.r16();
		}
		for (var i=0;i<numGlobals;i++)
			globals[i]=g.r16();
	}
	calculateRelations();
	if (saveName=='')
	{
		cmdReady=true;
		selectedCtl=1;
		curSelection.push(get(1,0));
	}
	setTimeout(finishLoading,500);
}

//calculate the children for each object and save in list
function calculateRelations()
{
	var val,next;
	for (var i=0;i<numObjects*2;i++)
		relations[i]=0;
	for (var i=numObjects-1;i;i--)
	{
		val=game[0][i];
		next=relations[val*2];
		if (next) relations[i*2+1]=next;
		relations[val*2]=i;
	}
}

function reset()
{
	resetWindows();
	inventory.num=0;
	queue=[];
	soundQueue=[];
	textQueue=[];
	inQueue=[];
}

/********************** private functions *********************/
var relations;

function finishLoading()
{
	showWindows();
	lastViewed=textEdit.get(0).scrollHeight;
	textEdit.scrollTop(lastViewed-(lastViewed%textLH));
	set(get(1,0),6,1);
	gameChanged=false;
	runMain();
}

function showWindows()
{
	closeWindow(titleWin);
	delete titleWin;
	showMenus();
	commandsWin.show();
	selfWin.show();
	updateWindow(selfWin);
	exitWin.show();
	textWin.show();
	mainWin.show();
	gameState=1;
}
