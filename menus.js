function Menu(id,title)
{
	this.id=id;
	this.title=title;
	this.el=undefined;
	var items=[];
	this.add=function(item)
	{
		items.push(item);
	}
	this.draw=function()
	{
		var active=$(document.createElement('table'));
		active.addClass('menu');
		var tbody=$(document.createElement('tbody'));
		active.append(tbody);
		var pos=this.el.position();
		active.css('top',(pos.top+19)+'px');
		active.css('left',pos.left+'px');
		for (var i=0;i<items.length;i++)
		{
			var tr=items[i].draw();
			tbody.append(tr);
		}
		return active;
	}
}
function MenuItem(text,key,mark,style)
{
	this.draw=function()
	{
		var tr=$(document.createElement('tr'));
		if (text=='-')
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
			td.html(text);
			tr.append(td);
			td=$(document.createElement('td'));
			if (key!=0)
			{
				td.addClass('shortcut');
				td.append(String.fromCharCode(key));
			}
			tr.append(td);
		}
		return tr;
	}
}
function MenuManager(screen)
{
	var menus=[];
	var menubar;
	this.get=function(res)
	{
		var id=res.r16();
		res.seek(12,res.cur); //skip w/h, resid, placeholder, enabled
		var titleLen=res.r8();
		var title='';
		if (titleLen!=0)
			title=res.read(titleLen);
		if (titleLen==1) title='';
		var menu=new Menu(id,title);
		while (true)
		{
			var itemLen=res.r8();
			if (itemLen==0) break;
			var itemText='';
			if (itemLen!=0)
				itemText=webventure.mac2ascii(res.read(itemLen));
			var itemIcon=res.r8();
			var itemKey=res.r8();
			var itemMark=res.r8();
			var itemStyle=res.r8();
			var menuItem=new MenuItem(itemText,itemKey,itemMark,itemStyle);
			menu.add(menuItem);
		}
		menus.push(menu);
	}
	this.show=function()
	{
		menubar=$(document.createElement('div'));
		menubar.addClass('menubar');
		for (var i in menus)
		{
			var item=$(document.createElement('div'));
			item.addClass('menu');
			if (menus[i].title=='')
				item.addClass('apple');
			else
				item.append(menus[i].title);
			item.data('refCon',menus[i].id);
			item.mousedown(function(event){
				menudown(event);
				return false;
			});
			menus[i].el=item;
			menubar.append(item);
		}
		screen.append(menubar);
	}
	this.addDA=function(text)
	{
		menus[0].add(new MenuItem(text,0,0,0));
	}
	function menudown(event)
	{
		if (webventure.isPaused) return;
		var idx;
		var selectedItem=0;
		var activeMenu=$(event.target);
		while (activeMenu.data('refCon')==undefined)
			activeMenu=activeMenu.parent();
		activeMenu.addClass('active');
		var id=activeMenu.data('refCon');
		for (idx=0;idx<menus.length;idx++)
			if (menus[idx].id==id) break;
		var active=menus[idx].draw();
		screen.append(active);
		$(document).mousemove(function(event){
			var pos=menubar.position();
			//are we over the menubar?
			if (event.pageX>=pos.left &&
				event.pageY>pos.top &&
				event.pageX<pos.left+menubar.width() &&
				event.pageY<pos.top+menubar.height())
			{
				for (idx=0;idx<menus.length;idx++)
				{
					pos=menus[idx].el.position();
					var pad=(menus[idx].el.outerWidth()-menus[idx].el.width())/2;
					if (event.pageX>=pos.left-pad &&
						event.pageX<pos.left-pad+menus[idx].el.outerWidth())
					{
						active.remove();
						activeMenu.removeClass('active');
						activeMenu=menus[idx].el;
						activeMenu.addClass('active');
						active=menus[idx].draw();
						screen.append(active);
						break;
					}
				}
			}
			else
			{
				pos=active.position();
				if (event.pageX>=pos.left &&
					event.pageY>=pos.top &&
					event.pageX<pos.left+active.width() &&
					event.pageY<pos.top+active.height())
				{
					event.pageY-=pos.top;
					active.find('tr').each(function(i,el){
						pos=$(el).position();
						if (event.pageY>=pos.top &&
							event.pageY<pos.top+$(el).height())
						{
							if ($(el).hasClass('menuitem'))
							{
								selectedItem=i+1;
								$(el).addClass('active');
							}
						}
						else
							$(el).removeClass('active');
					});
				}
				else
				{
					active.find('tr').each(function(i,el){
						$(el).removeClass('active');
					});
					selectedItem=0;
				}
			}
		});
		$(document).mouseup(function(event){
			$(document).unbind('mousemove');
			$(document).unbind('mouseup');
			active.remove();
			activeMenu.removeClass('active');
			if (selectedItem)
				webventure.menuSelect(menus[idx].id,selectedItem);
		});
	}
}
