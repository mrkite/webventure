/********************** public functions *********************/
function closeWindow(win)
{
	for (var i=0;i<wins.length;i++)
		if (wins[i]==win)
		{
			win.close();
			wins.splice(i,1);
			break;
		}
	if (wins.length)
		bringToFront(wins[0]);
}

function bringToFront(win)
{
	if (wins[0]==win)
	{
		win.obj.addClass('active');
		return;
	}
	if (wins[0]!=undefined)
		wins[0].obj.removeClass('active');
	for (var i=0;i<wins.length;i++)
		if (wins[i]==win)
			wins.splice(i,1);
	wins.unshift(win);
	win.obj.addClass('active');
}

/********************** private functions *********************/
var wins=[];
