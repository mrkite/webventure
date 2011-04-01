/********************** public functions *********************/

//parse resource and insert menu
function addMenu(m)
{
	var reader={m:m,p:0};
	while (parseLine(reader)) {};
}

/********************** private functions *********************/

function parseLine(r)
{
	var isItem=false;
	if (r.m[r.p]=='.' || r.m[r.p+1]=='.') return false;
	if (r.m[r.p++]==' ') isItem=true;
	r.p++; //skip L
	var name='';
	while (r.m[r.p]!='\\')
		name+=r.m[r.p++];
	r.p++; //skip \
	var key='';
	var enabled=true;
	var id=0;
	var hasDivider=false;
	while (r.m[r.p]!='\r')
	{
		var ctl=r.m[r.p++];
		switch (ctl)
		{
			case '*':
				key=r.m[r.p++]; r.p++; //skip other
				break;
			case 'B': //bold
				name="<b>"+name+"</b>";
				break;
			case 'C': //checkmark
				r.p++; //skip checkmark
				break;
			case 'D': //disabled
				enabled=false;
				break;
			case 'H': //id
				id=(r.m.charCodeAt(r.p++)&0xff);
				id|=(r.m.charCodeAt(r.p++)&0xff)<<8;
				break;
			case 'I': //italic
				name="<i>"+name+"</i>";
				break;
			case 'N': //same as H, but with text.  Unused
				break;
			case 'U': //underline, not used
				break;
			case 'V': //divider follows
				hasDivider=true;
				break;
			case 'X': //color replace mode for apple menu
				break;
			default:
				fatal("Unknown menu control code");
		}
	}
	r.p++; //skip over newline
	if (isItem)
	{
		createItem(name,id,key,enabled);
		if (hasDivider)
			createItem('-',0,'',false);
		return true;
	}
	curMenu={id:id};
	curMenu.obj=$(document.createElement('div'));
	if (name=='@')
		curMenu.obj.addClass('apple');
	else
		curMenu.obj.html(name);
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
	return true;
}
