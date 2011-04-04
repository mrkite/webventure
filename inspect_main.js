var view;
var game;
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

	var nav=$(document.createElement('div'))
	nav.addClass("nav");
	desktop.append(nav);
	view=$(document.createElement('div'));
	view.addClass("view");
	desktop.append(view);

	var navs={Objects:showObjects,Sounds:showSounds,Scripts:showScripts,Text:showText};
	for (var i in navs)
	{
		var l=$(document.createElement('div'));
		l.append(i);
		nav.append(l);
		l.click(navs[i]);
	}
}
function initVars(){}

function createSelector(numItems,cb)
{
	view.html('');
	var curItem=0;
	var sel=$(document.createElement('div'));
	sel.addClass('selector');
	view.append(sel);
	var prev=$(document.createElement('span'))
	prev.addClass('prev');
	prev.append("&laquo;");
	sel.append(prev);
	var counter=$(document.createElement('span'));
	counter.addClass('counter');
	sel.append(counter);
	var next=$(document.createElement('span'));
	next.addClass('next');
	next.append("&raquo;");
	sel.append(next);

	function update()
	{
		counter.html('#'+curItem+'/'+(numItems-1));
		if (curItem==0)
			prev.addClass('disabled');
		else
			prev.removeClass('disabled');
		if (curItem==numItems-1)
			next.addClass('disabled');
		else
			next.removeClass('disabled');
		cb(curItem);
	}
	prev.mousedown(function(){
		if (curItem>0)
		{
			curItem--;
			update();
		}
		return false;
	});
	next.mousedown(function(){
		if (curItem<numItems-1)
		{
			curItem++;
			update();
		}
		return false;
	});
	$('body').keydown(function(event){
		if (event.which==37) //left
		{
			if (curItem>0)
			{
				curItem--;
				update();
			}
			return false;
		}
		if (event.which==39) //right
		{
			if (curItem<numItems-1)
			{
				curItem++;
				update();
			}
			return false;
		}
		if (event.which==33) //pgup
		{
			curItem-=10;
			if (curItem<0)
				curItem=0;
			update();
			return false;
		}
		if (event.which==34) //pgdown
		{
			curItem+=10;
			if (curItem>numItems-1)
				curItem=numItems-1;
			update();
			return false;
		}
		if (event.which==36) //home
		{
			curItem=0;
			update();
			return false;
		}
		if (event.which==35) //end
		{
			curItem=numItems-1;
			update();
			return false;
		}
		return true;
	});
	update();
}

function showObjects()
{
	createSelector(numObjects,showObject);
}
var subview=undefined;
function showObject(id)
{
	var attrnames=[
		"parent",
		"x",
		"y",
		"offscreen",
		"unclickable",
		"undraggable",
		"current room", //6
		"prefixes",
		"is exit",
		"exit x",
		"exit y",
		"hidden exit"
	];
	if (subview==undefined)
	{
		subview=$(document.createElement('div'));
		view.append(subview);
	}
	else
		subview.html('');
	var name=$(document.createElement("h3"));
	subview.append(name);
	name.append("Name: "+getText(id));
	var img=getGraphic(id*2);
	var mask=getGraphic(id*2+1);
	if (mask)
		addImageMask(subview,img,mask);
	else if (img)
		addImage(subview,img);
	var attrtab=$(document.createElement('table'));
	subview.append(attrtab);
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
function showSounds()
{
	console.log("sounds");
}
function showScripts()
{
}
function showText()
{
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
function neg16(v)
{
	if (v&0x8000)
		v=-((v^0xffff)+1);
	return v;
}
