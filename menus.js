/********************** public functions *********************/
function initMenus()
{
	menubar=$(document.createElement('div'));
	menubar.addClass('menubar');
}

function showMenus()
{
	desktop.append(menubar);
}

function addDeskAccessory(text,id)
{
	curMenu=menus[0];
	createItem(text,id,'',true);
}

function createItem(name,id,key,enabled)
{
	var item={id:id};
	var tr=$(document.createElement('tr'));
	if (name[0]=='-')
	{
		var td=$(document.createElement('td'));
		td.attr('colspan','2');
		td.addClass('divider');
		td.append(document.createElement('hr'));
		tr.append(td);
	}
	else
	{
		tr.addClass('menuitem');
		var td=$(document.createElement('td'));
		td.html(toascii(name));
		tr.append(td);
		td=$(document.createElement('td'));
		if (key!='')
		{
			td.addClass('shortcut');
			hotkeys.push({key:key,id:id});
			td.text(key);
		}
		tr.append(td);
	}
	item.obj=tr;
	item.enabled=enabled;
	if (!item.enabled)
		item.obj.addClass('disabled');
	curMenu.body.append(item.obj);
	curMenu.items.push(item);
}
function findMenu(id)
{
	for (var i=0;i<menus.length;i++)
	{
		for (var j=0;j<menus[i].items.length;j++)
		{
			if (menus[i].items[j].id==id)
				return menus[i].items[j];
		}
	}
	return undefined;
}
function enableMenu(id)
{
	var item=findMenu(id);
	if (item)
	{
		item.enabled=true;
		item.obj.removeClass('disabled');
	}
}
function disableMenu(id)
{
	var item=findMenu(id);
	if (item)
	{
		item.enabled=false;
		item.obj.addClass('disabled');
	}
}

function menudown(event)
{
	var activeMenu=$(event.target);
	while (activeMenu.data('refCon')==undefined)
		activeMenu=activeMenu.parent();
	activeMenu.addClass('active');
	var active=activeMenu.data('refCon');
	desktop.append(active.menu);
	var pos=activeMenu.position();
	active.menu.css('top',(pos.top+MBHeight)+'px');
	active.menu.css('left',pos.left+'px');
	var selectedItem=-1;
  $(document).bind('touchmove', function(event) {
		var pos=menubar.offset();
    var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
		//over menubar?
		if (Math.floor(touch.pageX / pageZoom)>=pos.left &&
			Math.floor(touch.pageY / pageZoom)>pos.top &&
			Math.floor(touch.pageX / pageZoom)<pos.left+menubar.width() &&
			Math.floor(touch.pageY / pageZoom)<pos.top+menubar.height())
		{
			for (var idx=0;idx<menus.length;idx++)
			{
				pos=menus[idx].obj.offset();
				if (Math.floor(touch.pageX / pageZoom)>=pos.left &&
					Math.floor(touch.pageX / pageZoom)<pos.left+menus[idx].obj.outerWidth())
				{
					active.menu.remove();
					activeMenu.removeClass('active');
					activeMenu=menus[idx].obj;
					activeMenu.addClass('active');
					active=activeMenu.data('refCon');
					desktop.append(active.menu);
					pos=activeMenu.position();
					active.menu.css('top',(pos.top+MBHeight)+'px');
					active.menu.css('left',pos.left+'px');
					break;
				}
			}
			for (var i=0;i<active.items.length;i++)
				active.items[i].obj.removeClass('active');
			selectedItem=-1;
		}
		else
		{
			pos=active.menu.offset();
			if (Math.floor(touch.pageX / pageZoom)>=pos.left &&
				Math.floor(touch.pageY / pageZoom)>=pos.top &&
				Math.floor(touch.pageX / pageZoom)<pos.left+active.menu.outerWidth() &&
				Math.floor(touch.pageY / pageZoom)<pos.top+active.menu.outerHeight())
			{
				for (var i=0;i<active.items.length;i++)
				{
					var el=active.items[i].obj;
					if (!el.hasClass('menuitem') || !active.items[i].enabled)
						continue;
					pos=el.offset();
					if (Math.floor(touch.pageY / pageZoom)>=pos.top &&
						Math.floor(touch.pageY / pageZoom)<pos.top+el.outerHeight())
					{
						selectedItem=i;
						el.addClass('active');
					}
					else
						el.removeClass('active');
				}
			}
			else
			{
				for (var i=0;i<active.items.length;i++)
					active.items[i].obj.removeClass('active');
				selectedItem=-1;
			}
		}
	});
  $(document).bind('touchend', function() {
		$(document).unbind('touchmove');
		$(document).unbind('touchend');
		active.menu.remove();
		activeMenu.removeClass('active');
		if (selectedItem!=-1)
		{
			active.items[selectedItem].obj.removeClass('active');
			menuSelect(active.items[selectedItem].id);
		}
	});
}

/********************** private functions *********************/
var menubar;
var menus=[];
var hotkeys=[];
var curMenu=undefined;


$('body').keydown(function(event){
	if (event.target.type=='text') return true; //no hotkeys in inputfields
	if (!event.altKey) return true; //no non-alt keys
	if (isPaused) return true; //do nothing if we're paused
	for (var i=0;i<hotkeys.length;i++)
	{
		if (hotkeys[i].key.charCodeAt(0)==event.which)
		{
			selectItem(hotkeys[i].id);
			return false;
		}
	}
	return true;
});
function selectItem(id)
{
	for (var i=0;i<menus.length;i++)
	{
		for (var j=0;j<menus[i].items.length;j++)
		{
			if (menus[i].items[j].id==id && menus[i].items[j].enabled)
				flash(menus[i],id);
		}
	}
}
function flash(menu,id)
{
	menu.obj.addClass('active');
	setTimeout(function(){
		menu.obj.removeClass('active');
		menuSelect(id);
	},200);
}

