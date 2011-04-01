/********************** public functions *********************/
function getMenu(res)
{
	var id=res.r16();
	res.seek(12,res.cur); //skip w/h, resid, placeholder, enabled
	var titleLen=res.r8();
	var title='';
	if (titleLen!=0)
		title=res.read(titleLen);
	if (titleLen==1) title='';
	curMenu={id:id};
	curMenu.obj=$(document.createElement('div'));
	if (title=='@')
		curMenu.obj.addClass('apple');
	else
		curMenu.obj.html(title);
	curMenu.obj.data('refCon',curMenu);
	curMenu.obj.mousedown(function(event){
		if (isPaused) return false;
		menudown(event);
		return false;
	});
	curMenu.menu=$(document.createElement('table'));
	curMenu.menu.addClass('menu');
	curMenu.body=$(document.createElement('tbody'));
	curMenu.menu.append(curMenu.body);
	curMenu.items=[];
	menubar.append(curMenu.obj);
	menus.push(curMenu);

	var i=0;
	while (true)
	{
		var itemLen=res.r8();
		if (itemLen==0) break;
		var itemText='';
		if (itemLen!=0)
			itemText=toascii(res.read(itemLen));
		var itemIcon=res.r8();
		var itemKey=res.r8();
		var itemMark=res.r8();
		var itemStyle=res.r8();
		if (itemKey!=0)
			itemKey=String.fromCharCode(itemKey);
		else
			itemKey='';
		createItem(itemText,(id<<8)|i,itemKey,true);
		i++;
	}
}
/********************** private functions *********************/
