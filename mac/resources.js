/********************** public functions *********************/
var winbg=0;	//main window background color

// name of default save game
function resGetUntitled()
{
	return getIndString(0x80,1);
}

// get name of start game
function resGetDefault()
{
	return getString(0x85);
}

/********************** private functions *********************/
