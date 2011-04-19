var nav;
var view;
var game;

var curObject=0;
var curScript=0;

function waitForLoad()
{
	if (!gameLoaded())
	{
		setTimeout(waitForLoad,10);
		return;
	}
	openResources();
	startImage.remove();
	delete startImage;
	desktop.removeClass('screen');

	loadFiles();

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


	var link=document.createElement('link');
	link.type="text/css";
	link.rel="stylesheet";
	link.href="inspect.css";
	$('head').append(link);

	var sections=$(document.createElement('div'));
	sections.addClass('sections');
	desktop.append(sections);
	var secs={'Objects':showObjects,'Text':showText,'Scripts':showScripts};
	for (var i in secs)
	{
		var sec=$(document.createElement('span'));
		sec.html(i);
		sec.click(secs[i]);
		sections.append(sec);
	}

	nav=$(document.createElement('div'))
	nav.addClass("nav");
	desktop.append(nav);
	view=$(document.createElement('div'));
	view.addClass("view");
	desktop.append(view);

	showObjects();
}
function initVars(){}

function showObjects()
{
	nav.html('');
	for (var i=0;i<numObjects;i++)
	{
		var name=$(document.createElement('div'));
		nav.append(name);
		name.append(toascii(getText(i))+' $'+i.toString(16));
		name.click(function(id){
			return function() { viewObject(id);} }(i));
	}
	viewObject(curObject);
}
function showText()
{
	nav.html('');
	view.html('');
	for (var i=0;i<objFiles[2].numitems;i++)
	{
		var p=$(document.createElement('p'));
		view.append(p);
		var h=$(document.createElement('strong'));
		h.append('$'+i.toString(16)+':');
		p.append(h);
		p.append(toascii(getText(i)));
	}
}
function showScripts()
{
	nav.html('');
	for (var i=0;i<objFiles[1].numitems;i++)
	{
		var name=$(document.createElement('div'));
		nav.append(name);
		name.append('$'+i.toString(16));
		name.click(function(id){
			return function() {
				view.html('');
				curScript=id;
				showScript(id);
			}
		}(i));
	}
	view.html('');
	showScript(view,curScript);
}

function viewObject(id)
{
	curObject=id;
	var attrnames=[
		"parent",
		"x",
		"y",
		"invisible",
		"unclickable",
		"undraggable",
		"container open", //6
		"prefixes",
		"is exit",
		"exit x",
		"exit y",
		"hidden exit",
		"other door",
		"is open",
		"is locked",
		"weight",
		"size",
		"has description",
		"is door",
		"21",
		"is container",
		"is operable",
		"is enterable",
		"is edible"
	];

	view.html('');

	var name=$(document.createElement("h3"));
	view.append(name);
	name.append("Name: "+toascii(getText(id)));
	var desc=$(document.createElement("h4"));
	view.append(desc);
	desc.append("Description:");
	var descv=$(document.createElement('div'));
	view.append(descv);
	descv.append(toascii(getText(id+numObjects)));

	var img=getGraphic(id*2);
	var mask=getGraphic(id*2+1);
	if (mask)
		addImageMask(view,img,mask);
	else if (img)
		addImage(view,img);
	var attrtab=$(document.createElement('table'));
	view.append(attrtab);
	var attrs=$(document.createElement('tbody'));
	attrtab.append(attrs);
	var tr=$(document.createElement('tr'));
	attrtab.append(tr);
	for (var i=0;i<numAttrs;i++)
	{
		var td=$(document.createElement('th'));
		if (i&1) td.addClass('odd');
		var rot=$(document.createElement('span'));
		td.append(rot);
		if (i<attrnames.length && attrnames[i]!='')
			rot.append(attrnames[i]);
		else
			rot.append(i);
		tr.append(td);
	}
	tr=$(document.createElement('tr'));
	attrtab.append(tr);
	for (var i=0;i<numAttrs;i++)
	{
		var td=$(document.createElement('td'));
		if (i&1) td.addClass('odd');
		td.append(get(id,i));
		tr.append(td);
	}
	showScript(view,id);
}
function addImage(subview,img)
{
	var h=$(document.createElement('h4'));
	h.append('Image:');
	subview.append(h);
	var div=$(document.createElement('div'));
	div.css('background','#5cc');
	div.css('width',(img.width)+'px');
	div.css('padding','10px');
	div.css('margin-bottom','10px');
	subview.append(div);
	createImageMask(div,img);
}
function addImageMask(subview,img,mask)
{
	var h=$(document.createElement('h4'));
	h.append('Image:');
	subview.append(h);
	var div=$(document.createElement('div'));
	div.css('background','#5cc');
	div.css('width',(img.width*3+10)+'px');
	div.css('padding','10px');
	div.css('margin-bottom','10px');
	subview.append(div);
	createImageMask(div,img);
	div.append(' ');
	createImageMask(div,mask);
	div.append(' ');
	createImageMask(div,img,mask);
}
function createImageMask(el,bmp,mask)
{
	if (bmp==null || bmp.width==0 || bmp.height==0) return;
	var canvas=$(document.createElement('canvas'));
	var w=bmp.width;
	var h=bmp.height;
	if (mask)
	{
		if (w<mask.width) w=mask.width;
		if (h<mask.height) h=mask.height;
	}
	canvas.attr('width',w);
	canvas.attr('height',h);
	el.append(canvas);
	if (mask)
	{
		mask.bic(canvas,0,0);
		if (bmp)
			bmp.xor(canvas,0,0);
	}
	else
		bmp.draw(canvas,0,0);
}
function two(x)
{
	var r=x.toString(16);
	while (r.length<2) r="0"+r;
	return r;
}
function four(x)
{
	var r=x.toString(16);
	while (r.length<4) r="0"+r;
	return r;
}
function showScript(subview,id)
{
	var text=$(document.createElement('pre'));
	subview.append(text);

	var p=new GFile(getObject(1,id));

	text.html(disassemble(p));
}

function get(obj,attr)
{
	var val;
	var idx=attrIdxs[attr];
	if (!(idx&0x80))
		val=game[idx][obj];
	else
	{
		var p=getObject(0,obj);
		if (p.length==0) return 0;
		idx&=0x7f;
		val=(p.charCodeAt(idx*2)&0xff)<<8;
		val|=p.charCodeAt(idx*2+1)&0xff;
	}
	val&=attrMasks[attr];
	var r=neg16(val>>attrShifts[attr]);
	return r;
}
function neg8(v)
{
	if (v&0x80)
		v=-((v^0xff)+1);
	return v;
}
function neg16(v)
{
	if (v&0x8000)
		v=-((v^0xffff)+1);
	return v;
}
function getSetting(name)
{
	return 50;
}
