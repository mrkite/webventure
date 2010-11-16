function WebVenture()
{
	var self=this;
	var screen;
	var wins,files,objects,texts,res,menu,engine,ctls,menus,graphics,sounds;
	var startImage;
	var titleWin,diplomaWin;
	var mainWin,controlsWin,textWin,selfWin,exitWin;
	var textEdit;
	this.gameState=0;
	this.gameChanged=false;
	var numObjects,numGlobals,numCmds,numAttrs,numGroups,two;
	var inventory,curFont,curFontSize,attrIdxs,attrMasks,attrShifts;
	var cmdNumObjs,cmds,inQueue;
	var selectedObjs,curSelection;
	this.queue=undefined;
	this.soundQueue=undefined;
	this.textQueue=undefined;
	var activeCmd,destObject,deltaPt;
	this.cmdReady=false;
	this.selectedCtl=undefined;
	var lastClick,objlist;
	var saveName='';
	var game;
	this.globals=undefined;
	var halted=false;
	this.isPaused=false;
	var haltedAtEnd=false,haltedInSelection=false;

	this.init=function()
	{
		var link=document.createElement('link');
		link.type="text/css";
		link.rel="stylesheet";
		link.href="game.css";
		$('head').append(link);
		screen=$(document.createElement('div'));
		screen.addClass("screen");
		startImage=$(document.createElement('img'));
		startImage.attr("src","images/start.png");
		startImage.css("width","100%");
		startImage.css("height","100%");
		screen.append(startImage);
		$('script').filter(function(index) {
			return this.src.match(/webventure_(min|full)\.js/);
		}).after(screen);
		files=new FileManager(gamename);
		res=new ResourceManager(files);
		objects=new ObjectManager(files);
		texts=new TextManager(objects,res);
		ctls=new ControlManager();
		wins=new WindowManager(screen,res,ctls);
		graphics=new GraphicManager(objects);
		sounds=new SoundManager(objects);
		menus=new MenuManager(screen);
		engine=new Engine(objects,texts,res,graphics);
		waitForLoad();
	}
	function waitForLoad()
	{
		if (!files.isReady())
		{
			setTimeout(waitForLoad,10);
			return;
		}
		self.gameState=0;
		var main;
		for (var i=1;main==undefined && i<5;i++)
			main=files.getResByKind('APPL','MCV'+i);
		res.open(main);
		var title=res.getIndStr(0x81,2);
		var titleres=files.getRes(title);
		var bmp;
		if (titleres!=undefined)
		{
			var id=res.open(titleres);
			bmp=decodePPIC(res.get('PPIC',0));
			res.close(id);
		}
		else
			bmp=decodePack(files.getData(title));
		startImage.remove();
		startImage=undefined;
		titleWin=wins.create('','plainDBox',false,false,0,0,512,342);
		titleWin.show();
		bmp.draw(titleWin.port,0,0);

		for (var i=0;i<5;i++)
			objects.load(i,res.getIndStr(0x81,i+4));

		loadGNRL(res.get('GNRL',0x80));
		texts.setHuff(res.get('GNRL',0x83));
		commandsWin=wins.get(res.get('WIND',0x80));
		commandsWin.kind=9;
		commandsWin.addClass('commands');
		for (var i=0;i<numCmds;i++)
			if (cmds[i])
				commandsWin.add(ctls.get(res.get('CNTL',0x81+i)));
		mainWin=wins.get(res.get('WIND',0x81));
		mainWin.kind=0xa;
		textWin=wins.get(res.get('WIND',0x82));
		textWin.kind=0xb;
		textEdit=$(document.createElement('div'));
		textEdit.addClass('textEdit');
		textWin.setCanvas(textEdit);
		selfWin=wins.get(res.get('WIND',0x83));
		selfWin.kind=0xc;
		selfWin.refCon={id:0,x:0,y:0,children:[{id:1,top:0,left:0,width:0,height:0}]};
		exitWin=wins.get(res.get('WIND',0x84));
		exitWin.kind=0xd;
		exitWin.addClass('exits');

		for (var i=0x80;i<=0x85;i++)
			menus.get(res.get('MENU',i));

		textWin.setTitle(res.getIndStr(0x80,1));

		if (gameparts.length>1)
		{
			saveName=gameparts[1];
			var g=JSON.parse(localStorage.getItem(saveName));
			game=g.gamedata;
			self.globals=g.globals;
			textEdit.html(g.text);
			textWin.setTitle(saveName);
		}
		else
		{
			var g=files.getData(res.getString(0x85));
			game=new Array(numGroups);
			self.globals=new Array(numGlobals);
			for (var i=0;i<numGroups;i++)
			{
				game[i]=new Array(numObjects);
				for (var o=0;o<numObjects;o++)
					game[i][o]=g.r16();
			}
			for (var i=0;i<numGlobals;i++)
				self.globals[i]=g.r16();
		}
		initObjlist();
		if (saveName=='')
		{
			self.cmdReady=true;
			self.selectedCtl=1;
			curSelection.push(self.get(1,0));
		}
		setTimeout(finishLoading,500);
	}
	function finishLoading()
	{
		showWindows();
		textEdit.scrollTop(10000);
		self.set(self.get(1,0),6,1);
		self.gameChanged=false;
		self.runMain();
	}
	function loadGNRL(data)
	{
		numObjects=data.r16();
		numGlobals=data.r16();
		numCmds=data.r16();
		numAttrs=data.r16();
		numGroups=data.r16();
		two=data.r16();
		inventory={};
		inventory.top=data.r16();
		inventory.left=data.r16();
		inventory.height=data.r16();
		inventory.width=data.r16();
		inventory.stepy=data.r16();
		inventory.stepx=data.r16();
		inventory.num=0;
		curFont=data.r16();
		curFontSize=data.r16();
		attrIdxs=new Array(numAttrs);
		for (var i=0;i<numAttrs;i++)
			attrIdxs[i]=data.r8();
		attrMasks=new Array(numAttrs);
		for (var i=0;i<numAttrs;i++)
			attrMasks[i]=data.r16();
		attrShifts=new Array(numAttrs);
		for (var i=0;i<numAttrs;i++)
			attrShifts[i]=data.r8();
		cmdNumObjs=new Array(numCmds);
		for (var i=0;i<numCmds;i++)
			cmdNumObjs[i]=data.r8();
		cmds=new Array(numCmds);
		for (var i=0;i<numCmds;i++)
			cmds[i]=data.r8();
		inQueue=[];
		
		initVars();
		selectedObjs=[];
		self.queue=[];
		self.soundQueue=[];
		self.textQueue=[];
		objlist=new Array(numObjects*2);
	}
	function initVars()
	{
		self.selectedCtl=0;
		activeCmd=undefined;
		curSelection=[];
		destObject=0;
		deltaPt={h:0,v:0};
		texts.input='';
		self.cmdReady=false;
		lastClick=0;
	}
	function initObjlist()
	{
		var val,next;
		for (var i=0;i<numObjects*2;i++)
			objlist[i]=0;
		for (var i=numObjects-1;i;i--)
		{
			val=game[0][i];
			next=objlist[val*2];
			if (next) objlist[i*2+1]=next;
			objlist[val*2]=i;
		}
	}
	function showWindows()
	{
		wins.close(titleWin);
		titleWin=undefined;
		menus.show();
		commandsWin.show();
		selfWin.show();
		self.updateWindow(selfWin);
		exitWin.show();
		textWin.show();
		mainWin.show();
		self.gameState=1;
	}
	this.get=function(obj,attr)
	{
		var val;
		var idx=attrIdxs[attr];
		if (!(idx&0x80))
			val=game[idx][obj];
		else
		{
			var p=objects.get(0,obj);
			if (p.length==0) return 0;
			idx&=0x7f;
			val=(p.charCodeAt(idx*2)&0xff)<<8;
			val|=p.charCodeAt(idx*2+1)&0xff;
		}
		val&=attrMasks[attr];
		return files.neg16(val>>attrShifts[attr]);
	}
	this.set=function(obj,attr,val)
	{
		if (attr==0)
			setParent(obj,val);
		if (attr<0xc)
			queueObject(obj);
		idx=attrIdxs[attr];
		val<<=attrShifts[attr];
		val&=attrMasks[attr];
		var oldval=game[idx][obj]&~attrMasks[attr];
		game[idx][obj]=val|oldval;
		self.gameChanged=true;
	}
	function setParent(obj,val)
	{
		var o=game[0][obj];
		if (val==obj) return;
		var p=o*2;
		o=objlist[p];
		while (o!=obj)
		{
			p=o*2+1;
			o=objlist[p];
		}
		objlist[p]=objlist[o*2+1];
		p=val*2;
		o=objlist[p];
		while (o && o<=obj)
		{
			p=o*2+1;
			o=objlist[p];
		}
		objlist[obj*2+1]=o;
		objlist[p]=obj;
	}
	this.updateObject=function(obj)
	{
		var w;
		if (this.get(1,0)==obj)
			w=mainWin;
		else
			w=getWindow(obj);
		if (w)
		{
			focusObjWin(obj);
			self.runQueue();
			self.updateWindow(w);
		}
	}
	function focusObjWin(obj)
	{
		if (obj)
		{
			var win=getWindow(obj);
			if (win)
				wins.bringToFront(win);
		}
	}
	function queueObject(obj)
	{
		if (inQueue.indexOf(obj)==-1)
		{
			inQueue.push(obj);
			var item={};
			item.obj=obj;
			item.parent=self.get(obj,0);
			item.x=self.get(obj,1);
			item.y=self.get(obj,2);
			item.exitx=self.get(obj,9);
			item.exity=self.get(obj,0xa);
			item.hidden=self.get(obj,0xb);
			item.offscreen=self.get(obj,3);
			item.invisible=self.get(obj,4);
			self.queue.push({id:0x7,val:item});
		}
	}
	this.updateWindow=function(win)
	{
		if (win==undefined) return;
		if (win.refCon==undefined) return;
		if (win==selfWin || self.get(win.refCon.id,6)==1)
		{
			if (win==mainWin)
			{
				var bmp=graphics.get(win.refCon.id*2);
				bmp.draw(mainWin.port,0,0);
			}
			else
				graphics.fill(win.port,0);
			for (var i=0;i<win.refCon.children.length;i++)
			{
				var bounds=self.drawObject(win.refCon.children[i].id,win,0);
				win.refCon.children[i].top=bounds.top;
				win.refCon.children[i].left=bounds.left;
				win.refCon.children[i].width=bounds.width;
				win.refCon.children[i].height=bounds.height;
			}
			/*if (win.kind==0xe)
			{
				//adjust scrollbars
			}*/
		}
	}
	this.drawObject=function(obj,win,flag)
	{
		var x=self.get(obj,1);
		var y=self.get(obj,2);
		var set=self.get(obj,3);
		if (flag || !set || !self.get(obj,4))
		{
			var mode=1;
			if (set || flag)
				mode=0;
			else if (selectedObjs.indexOf(obj)!=-1)
				mode=2;
			return graphics.draw(obj,x,y,win.port,mode);
		}
		return {top:0,left:0,width:0,height:0};
	}
	this.runMain=function()
	{
		if (self.gameState==4)
		{
			window.location="index.html";
			return;
		}
		if (!halted)
			self.updateScreen(false);
		if (self.cmdReady || halted)
		{
			halted=false;
			if (runEngine())
			{
				halted=true;
				self.isPaused=true;
				return;
			}
			self.isPaused=false;
			self.updateScreen(false);
			updateCtls();
		}
		if (self.gameState==2 || self.gameState==3)
			endGame();
	}
	function endGame()
	{
		if (self.gameState==2) //win
		{
			wins.closeAll();
			var title=res.getString(0x83);
			var diploma=files.getRes(title);
			var bmp;
			if (diploma!=undefined)
			{
				var id=res.open(diploma);
				var ppic=res.get('PPIC',0);
				if (ppic!=undefined)
					bmp=decodePPIC(ppic);
				res.close(id);
			}
			if (bmp==undefined)
				bmp=decodePack(files.getData(title));
			diplomaWin=wins.get(res.get('WIND',0x85));
			diplomaWin.show();
			bmp.draw(diplomaWin.port,0,0);
			doDiploma();
			self.gameState=4;
		}
		else if (self.gameState==3) //lose
		{
			updateCtls();
			var diewin=wins.getAlert(res.get('ALRT',0x86));
			diewin.show();
			self.modalDialog=function(id){
				wins.close(diewin);
				switch (id)
				{
					case 1: //restart
						doNew();
						break;
					case 3: //quit
						self.gameState=4;
						self.runMain();
						break;
					default: //load
						openDialog();
						break;
				}
			};
		}
	}
	function doDiploma()
	{
		var link=document.createElement('link');
		link.type="text/css";
		link.rel="stylesheet";
		link.href="print.css";
		link.media="print";
		$('head').append(link);
		var d=res.get('GNRL',0x81);
		var font=d.r16();
		var size=d.r16();
		var top=d.r16();
		var left=d.r16();
		var height=d.r16()-top;
		var width=d.r16()-left;
		var dialog=wins.getDialog(res.get('DLOG',0x87));
		dialog.show();
		self.isPaused=true;
		var te=ctls.create(left,top,width,height,0x1000,'',true,0,0,0,4);
		diplomaWin.add(te);
		te.css('text-align','center');
		te.css('font-size',size+'px');
		te.css('line-height',height+'px');
		te.focus();
		self.modalDialog=function(id){
			switch (id)
			{
				case 1: //print
					te.blur();
					window.print();
					break;
				case 2: //quit
					self.runMain();
					break;
			}
		};
	}
	function doNew()
	{
		var g=files.getData(res.getString(0x85));
		for (var i=0;i<numGroups;i++)
		{
			for (var o=0;o<numObjects;o++)
				game[i][o]=g.r16();
		}
		for (var i=0;i<numGlobals;i++)
			self.globals[i]=g.r16();
		resetWindows();
		initObjlist();
		textWin.setTitle(res.getIndStr(0x80,1));
		textEdit.html('');
		self.selectedCtl=1;
		curSelection=[self.get(1,0)];
		self.gameState=1;
		self.set(self.get(1,0),6,1);
		self.gameChanged=false;
		halted=false;
		haltedAtEnd=false;
		haltedInSelection=false;
		engine.reset();
		self.cmdReady=true;
		self.runMain();
	}
	function doSave()
	{
		if (saveName=='')
			saveDialog();
		else
			save();
	}
	function saveDialog()
	{
		var dialog=wins.createDialog('','dBox',true,false,104,79,304,184,undefined);
		dialog.add(ctls.create(218,132,70,18,0x00,'Save',true,0,0,0,1));
		dialog.add(ctls.create(218,158,70,18,0x00,'Cancel',true,0,0,0,2));
		dialog.add(ctls.create(14,136,183,16,0x1100,'Save as:',true,0,0,0,3));
		dialog.add(ctls.create(17,157,177,16,0x1000,'',true,0,0,0,7));
		dialog.add(ctls.create(14,29,183,98,0x1200,'',true,0,0,0,8));
		dialog.kind=2;
		self.isPaused=true;
		dialog.show();
		var list=dialog.getItem(8);
		var selectedItem=undefined;
		for (var i=0;i<localStorage.length;i++)
		{
			var title=localStorage.key(i);
			var game=JSON.parse(localStorage.getItem(title));
			if (game.game!=gamename) continue;
			var item=$(document.createElement('div'));
			item.addClass('listitem');
			item.click(function(event){
				if (selectedItem) selectedItem.removeClass('active');
				selectedItem=$(event.target);
				selectedItem.addClass('active');
				dialog.getItem(7).val(selectedItem.text());
			});
			item.text(title);
			list.append(item);
		}
		self.modalDialog=function(id){
			switch (id)
			{
				case 1: //save
					saveName=dialog.getItem(7).val();
					wins.close(dialog);
					self.isPaused=false;
					doSave();
					break;
				case 2: //cancel
					wins.close(dialog);
					self.isPaused=false;
					afterSave();
					break;
			}
		}
	}
	function save()
	{
		localStorage.setItem(saveName,JSON.stringify({game:gamename,gamedata:game,globals:self.globals,text:textEdit.html()}));
		textWin.setTitle(saveName);
		self.gameChanged=false;
		afterSave();
	}
	function resetWindows()
	{
		wins.reset();
		inventory.num=0;
		self.queue=[];
		self.soundQueue=[];
		self.textQueue=[];
		inQueue=[];
	}
	function updateCtls()
	{
		if (activeCmd)
			activeCmd.removeClass('active');
		toggleExits();
		initVars();
	}
	function toggleExits()
	{
		while (selectedObjs.length)
			hiliteExit(selectedObjs.pop());
	}
	function hiliteExit(obj)
	{
		var ctl=exitWin.find(obj);
		if (ctl)
		{
			if (selectedObjs.indexOf(obj)!=-1)
				ctl.addClass('active');
			else
				ctl.removeClass('active');
		}
		if (obj==self.get(1,0))
		{
			if (selectedObjs.indexOf(obj)!=-1)
				exitWin.addClass('selected');
			else
				exitWin.removeClass('selected');
		}
		self.updateWindow(self.getParentWin(obj));
	}
	this.updateScreen=function(pause)
	{
		this.runQueue();
		this.printTexts();
		return this.playSounds(pause);
	}
	this.runQueue=function()
	{
		while (self.queue.length)
		{
			var index;
			var biggest=0;
			for (var i=0;i<self.queue.length;i++)
			{
				if (self.queue[i].id>biggest)
				{
					biggest=self.queue[i].id;
					index=i;
				}
			}
			var item=self.queue.splice(index,1)[0];
			switch (item.id)
			{
				case 0x2:
					focusObjWin(item.val);
					break;	
				case 0x3: //open
					openObject(item.val);
					break;
				case 0x4: //close
					closeObject(item.val);
					break;
				case 0x7:
					checkObject(item.val);
					break;
				case 0x8:
					reflectSwap(item.val);
					break;
				case 0xc:
					self.set(mainWin.refCon.id,6,0);
					self.set(self.get(1,0),6,1);
					break;
				case 0xd:
					toggleExits();
					break;
				case 0xe:
					zoomObject(item.val);
					break;
			}
		}
	}
	this.playSounds=function(pause)
	{
		var delay=0;
		while (self.soundQueue.length)
		{
			var item=self.soundQueue.splice(0,1)[0];
			switch (item.id)
			{
				case 1:
					sounds.play(item.val);
					break;
				case 2:
					delay=sounds.play(item.val);
					break;
				case 3:
					console.log("wait?");
					//wait for sound to finish?
					break;
			}
		}
		if (pause && delay)
		{
			setTimeout(self.runMain,delay*1000);
			return true;
		}
		return false;
	}
	this.printTexts=function()
	{
		while (self.textQueue.length)
		{
			var item=self.textQueue.splice(0,1)[0];
			switch (item.id)
			{
				case 1: //print number
					textEdit.append(item.val);
					textEdit.scrollTop(10000);
					self.gameChanged=true;
					break;
				case 2:
					textEdit.append('<br/>');
					textEdit.scrollTop(10000);
					self.gameChanged=true;
					break;
				case 3:
					texts.source=item.val[1];
					texts.target=item.val[0];
					textEdit.append(texts.get(item.val[2]));
					textEdit.scrollTop(10000);
					self.gameChanged=true;
					break;
			}
		}
	}
	this.invertmain=function()
	{
		mainWin.invert();
	}
	this.revertmain=function()
	{
		mainWin.invert();
		self.runMain();
	}
	function checkObject(old)
	{
		var changed=false;
		var id=old.obj;
		var i=inQueue.indexOf(id);
		if (i!=-1) inQueue.splice(i,1);
		if (id==1)
		{
			if (old.parent!=self.get(id,0))
				self.queue.push({id:0xc});
			if (old.offscreen!=self.get(id,3) ||
				old.invisible!=self.get(id,4))
				self.updateWindow(self.getParentWin(id));
		}
		else if (old.parent!=self.get(id,0) ||
			old.x!=self.get(id,1) ||
			old.y!=self.get(id,2))
		{
			var oldwin=getWindow(old.parent);
			if (oldwin)
			{
				removeChild(oldwin,id);
				changed=true;
			}
			var newwin=self.getParentWin(id);
			if (newwin)
			{
				addChild(newwin,id);
				changed=true;
			}
		}
		else if (old.offscreen!=self.get(id,3) ||
			old.invisible!=self.get(id,4))
			self.updateWindow(self.getParentWin(id));
		if (self.get(id,8))
		{
			if (changed ||
				old.hidden!=self.get(id,0xb) ||
				old.exitx!=self.get(id,9) ||
				old.exity!=self.get(id,0xa))
				drawExit(id);
		}
		var win=getWindow(id);
		var cur=id;
		var root=self.get(1,0);
		while (cur!=root)
		{
			if (cur==0 || !self.get(cur,6)) break;
			cur=self.get(cur,0);
		}
		if (cur==root)
		{
			if (win) return;
			self.queue.push({id:0x3,val:id}); //open
		}
		else
		{
			if (!win) return;
			self.queue.push({id:0x4,val:id}); //close
		}
		var children=getChildren(id,true);
		for (i=0;i<children.length;i++)
			queueObject(children[i]);
	}
	function getWindow(obj)
	{
		switch (obj)
		{
			case 0xfffc: return exitWin;
			case 0xfffd: return selfWin;
			case 0xfffe: return textWin;
			case 0xffff: return commandsWin;
		}
		return wins.find(obj);
	}
	this.getParentWin=function(obj)
	{
		if (obj==1) return selfWin;
		var parent=self.get(obj,0);
		if (!parent) return undefined;
		return getWindow(parent);
	}
	this.getFamily=function(obj,recurs)
	{
		var rels=[obj];
		return rels.concat(getChildren(obj,recurs));
	}
	function getChildren(obj,recurs)
	{
		var rels=[];
		var v=objlist[obj*2];
		while (v)
		{
			rels.push(v);
			if (!recurs)
				rels=rels.concat(getChildren(v,false));
			v=objlist[v*2+1];
		}
		return rels;
	}
	function openObject(obj)
	{
		if (getWindow(obj)) return; 
		if (obj==self.get(1,0))
		{
			setRefCon(obj,mainWin);
			self.updateWindow(mainWin);
			drawExits();
			var title=texts.get(obj);
			mainWin.setTitle(texts.capitalize(title));
		}
		else
		{
			var p={h:self.get(obj,1),v:self.get(obj,2)};
			self.getParentWin(obj).localToGlobal(p);
			var rect=getInventoryRect();
			var title=texts.get(obj);
			var iw=wins.create(title,'zoomDoc',false,true,rect.left,rect.top,rect.width,rect.height);
			iw.kind=0xe;
			iw.scrollbars();
			setRefCon(obj,iw);
			iw.refCon.flag=true;

			var zoom=$(document.createElement('div'));
			var pos=screen.position();
			zoom.addClass('zoom');
			screen.append(zoom);
			zoom.css('top',p.v+'px');
			zoom.css('left',p.h+'px');
			zoom.css('width','0px');
			zoom.css('height','0px');
			zoom.animate({
				top:(rect.top+pos.top)+'px',
				left:(rect.left+pos.left)+'px',
				width:rect.width+'px',
				height:rect.height+'px'
			},500,function () {
				zoom.remove();
				iw.show();
				self.updateWindow(iw);
			});
		}
	}
	function closeObject(obj)
	{
		var info=wins.tryClose(getWindow(obj));
		if (info==undefined) return;
		var w=self.getParentWin(info.obj);
		if (w==undefined) return;
		var zoom=$(document.createElement('div'));
		zoom.addClass('zoom');
		screen.append(zoom);
		zoom.css('top',info.top+'px');
		zoom.css('left',info.left+'px');
		zoom.css('width',info.width+'px');
		zoom.css('height',info.height+'px');
		var p={h:self.get(info.obj,1),v:self.get(info.obj,2)};
		w.localToGlobal(p);
		zoom.animate({
			top:p.v+'px',
			left:p.h+'px',
			width:'0px',
			height:'0px'
			},500,function () {
				zoom.remove();
				inventory.num--;
			}
		);
	}
	function doLasso(win,start,canDrag)
	{
		var bounds={};
		var pt={h:0,v:0}
		win.localToGlobal(pt);
		bounds.minx=pt.h;
		bounds.miny=pt.v;
		bounds.maxx=pt.h+win.port.width();
		bounds.maxy=pt.v+win.port.height();
		var lasso=$(document.createElement('div'))
		lasso.addClass('lasso');
		screen.append(lasso);
		lasso.css('top',start.pageY+'px');
		lasso.css('left',start.pageX+'px');
		lasso.css('width',0+'px');
		lasso.css('height',0+'px');
		$(document).mousemove(function(event){
			var sx=Math.max(Math.min(start.pageX,event.pageX),bounds.minx);
			var sy=Math.max(Math.min(start.pageY,event.pageY),bounds.miny);
			var ex=Math.min(Math.max(start.pageX,event.pageX),bounds.maxx);
			var ey=Math.min(Math.max(start.pageY,event.pageY),bounds.maxy);
			lasso.css('top',sy+'px');
			lasso.css('left',sx+'px');
			lasso.css('width',(ex-sx)+'px');
			lasso.css('height',(ey-sy)+'px');
		});
		$(document).mouseup(function(event){
			$(document).unbind('mousemove');
			$(document).unbind('mouseup');
			var sx=Math.max(Math.min(start.pageX,event.pageX),bounds.minx);
			var sy=Math.max(Math.min(start.pageY,event.pageY),bounds.miny);
			var ex=Math.min(Math.max(start.pageX,event.pageX),bounds.maxx);
			var ey=Math.min(Math.max(start.pageY,event.pageY),bounds.maxy);
			lasso.remove();
			var pt={h:sx,v:sy};
			win.globalToLocal(pt);
			var select={top:pt.v,left:pt.h,width:ex-sx,height:ey-sy};
			var h=[];
			for (var i=0;i<win.refCon.children.length;i++)
			{
				var obj=win.refCon.children[i].id;
				if (!self.get(obj,4))
				{
					select.left=pt.h-self.get(obj,1);
					select.top=pt.v-self.get(obj,2);
					if (intersectObj(obj,select))
						h.push(obj);
				}
			}
			if (start.shiftkey)
			{
				if (h.length==0)
				{
					if (curSelection.length==0 ||
						win!=self.getParentWin(curSelection[0]))
					{
						if (curSelection.indexOf(win.refCon.id)!=-1)
							unselectObj(win.refCon.id);
						else
							self.selectObj(win.refCon.id);
					}
				}
				else while (h.length)
				{
					var sel=h.shift();
					if (curSelection.indexOf(sel)!=-1)
						unselectObj(sel);
					else
						self.selectObj(sel);
				}
				self.runMain();
			}
			else
			{
				var obj;
				if (h.length==0)
					obj=win.refCon.id;
				else while (h.length)
				{
					obj=h.shift();
					self.selectObj(obj);
				}
				self.handleObjectSelect(obj,win,start,canDrag);
			}
		});
	}
	function getInventoryRect()
	{
		var x=inventory.left;
		var y=inventory.top;
		for (var i=0;i<inventory.num;i++)
		{
			x+=inventory.stepx;
			y+=inventory.stepy;
			if (y>=342-12)
				y=inventory.top;
			if (x>=512-12)
				x=inventory.left;
		}
		inventory.num++;
		return {top:y,left:x,width:inventory.width,height:inventory.height};
	}
	function setRefCon(obj,w)
	{
		var children=getChildren(obj,true);
		w.refCon={id:obj,x:0,y:0,flag:false,children:[]};
		var originx=0x7fff;
		var originy=0x7fff;
		for (var i=0;i<children.length;i++)
		{
			if (children[i]!=1)
			{
				child={id:children[i],top:0,left:0,width:0,height:0};
				if (w!=mainWin)
				{
					var x=self.get(obj,1);
					var y=self.get(obj,2);
					if (originx>x) originx=x;
					if (originy>y) originy=y;
				}
				w.refCon.children.push(child);
			}
		}
		if (originx!=0x7fff) w.refCon.x=originx-8;
		if (originy!=0x7fff) w.refCon.y=originy-8;
		if (w!=mainWin) w.refCon.flag=true;
	}
	function drawExits()
	{
		exitWin.killControls();
		var exits=getChildren(self.get(1,0),true);
		for (var i=0;i<exits.length;i++)
			drawExit(exits[i]);
	}
	function drawExit(obj)
	{
		if (!self.get(obj,8)) return;
		var ctl=exitWin.find(obj);
		if (ctl)
			exitWin.remove(ctl);
		if (!self.get(obj,0xb) && self.get(obj,0)==self.get(1,0))
		{
			var ctl=ctls.get(res.get('CNTL',0x80));
			ctl.data('refcon',obj);
			ctls.move(ctl,self.get(obj,9),self.get(obj,0xa));
			exitWin.add(ctl);
		}
	}
	function runEngine()
	{
		if (haltedAtEnd)
		{
			haltedAtEnd=false;
			if (engine.resume())
			{
				haltedAtEnd=true;
				return true;
			}
			return false;
		}
		if (haltedInSelection)
		{
			haltedInSelection=false;
			if (engine.resume())
			{
				haltedInSelection=true;
				return true;
			}
			self.updateScreen(false);
		}
		while (curSelection.length)
		{
			var obj=curSelection.shift();
			if ((self.gameState==0 || self.gameState==1) && isActiveObject(obj))
			{
				if (engine.run(self.selectedCtl,obj,destObject,deltaPt))
				{
					haltedInSelection=true;
					return true;
				}
				self.updateScreen(false);
			}
		}
		if (self.selectedCtl==1)
			self.gameChanged=false;
		else if (self.gameState==0 || self.gameState==1)
			if (engine.run(3,self.selectedCtl,destObject,deltaPt))
			{
				haltedAtEnd=true;
				return true;
			}
		return false;
	}
	function isActiveObject(obj)
	{
		if (!getAncestor(obj)) return false;
		if (numCmdObjs()>=2 && destObject>0 && !getAncestor(destObject))
			return false;
		if (self.selectedCtl!=5) return true;
		if (!isDraggable(obj)) return false;
		if (self.get(1,0)!=destObject) return true;
		var rect={top:0,left:0,width:mainWin.port.width(),height:mainWin.port.height()};
		rect.top-=self.get(obj,2)+deltaPt.v;
		rect.left-=self.get(obj,1)+deltaPt.h;
		return intersectObj(obj,rect);
	}
	function intersectObj(obj,rect)
	{
		var scrap={top:0,left:0,width:0,height:0};
		var bmp;
		if (bmp=graphics.get(obj*2+1))
		{
			scrap.width=bmp.width;
			scrap.height=bmp.height;
			if (graphics.sectRect(scrap,rect,scrap))
				return bmp.intersect(scrap);
			return false;
		}
		if (bmp=graphics.get(obj*2))
		{
			scrap.width=bmp.width;
			scrap.height=bmp.height;
			return graphics.sectRect(scrap,rect,scrap);
		}
		return false;
	}
	function isDraggable(obj)
	{
		return (self.get(obj,3)==0 &&
			self.get(obj,4)==0 &&
			self.get(obj,5)==0);
	}
	function getAncestor(obj)
	{
		var root=self.get(1,0);
		while (obj!=0 && obj!=1 && obj!=root)
			obj=self.get(obj,0);
		return obj;
	}
	function numCmdObjs()
	{
		if (!self.selectedCtl) return 3000;
		return cmdNumObjs[self.selectedCtl-1];
	}
	this.getChildIdx=function(children,obj)
	{
		var i;
		for (i=0;i<children.length && children[i].id!=obj;i++) {}
		if (i==children.length) return 0;
		return i+1;
	}
	function addChild(win,obj)
	{
		if (win.refCon==undefined) return;
		var i;
		for (i=0;i<win.refCon.children.length && obj>win.refCon.children[i].id;i++) {}
		if (i==win.refCon.children.length || obj!=win.refCon.children[i].id)
		{
			var child={id:obj,top:0,left:0,width:0,height:0};
			win.refCon.children.splice(i,0,child);
			self.updateWindow(win);
		}
	}
	function removeChild(win,obj)
	{
		if (win.refCon==undefined) return;
		var idx=self.getChildIdx(win.refCon.children,obj);
		if (idx==0) return;
		win.refCon.children.splice(idx-1,1);
		win.refCon.flag=true;
		self.updateWindow(win);
	}
	this.unselectall=function()
	{
		while (curSelection.length)
			unselectObj(curSelection.shift());
	}
	this.selectObj=function(obj)
	{
		if (curSelection.length)
		{
			if (self.getParentWin(obj)!=self.getParentWin(curSelection[0]))
				self.unselectall();
		}
		if (curSelection.indexOf(obj)==-1)
			curSelection.push(obj);
		if (selectedObjs.indexOf(obj)==-1)
		{
			selectedObjs.push(obj);
			hiliteExit(obj);
		}
	}
	function unselectObj(obj)
	{
		var idx=curSelection.indexOf(obj);
		if (idx!=-1) curSelection.splice(idx,1);
		if ((idx=selectedObjs.indexOf(obj))!=-1)
		{
			selectedObjs.splice(idx,1);
			hiliteExit(obj);
		}
	}
	this.activateCommand=function(val)
	{
		var cmd=commandsWin.find(val);
		if (cmd!=activeCmd)
		{
			if (activeCmd)
				activeCmd.removeClass('active');
			activeCmd=cmd;
			if (cmd)
				cmd.addClass('active');
		}
	}
	var afterSave=undefined;
	this.menuSelect=function(menu,item)
	{
		switch (menu)
		{
			case 0x80: //about
				doAbout();
				break;
			case 0x81: //file
				switch (item)
				{
					case 1: checkNew(); break;
					case 3: checkOpen(); break;
					case 4:
						afterSave=function(){}
						doSave();
						break;
					case 5:
						afterSave=function(){}
						saveDialog();
						break;
					case 7: checkQuit(); break;
				}
				break;
			case 0x82: //edit
				break;
			case 0x83: //special
				switch (item)
				{
					case 1: cleanup(); break;
					case 2: messup(); break;
				}
				break;
			case 0x84: //font;
				doFont(item);
				break;
			case 0x85: //fontsize
				doFontSize(item);
				break;
		}
	}
	function doAbout()
	{
		var r=res.get(res.getIndStr(0x81,1),0);
		var len=r.r8();
		var name=self.mac2ascii(r.read(len));

		var dialog=wins.createDialog('','dBox',true,false,146,96,220,150,undefined);
		dialog.add(ctls.create(75,120,70,18,0x00,'Ok',true,0,0,0,1));
		dialog.add(ctls.create(20,30,180,40,0x1100,name,true,0,0,0,2));
		dialog.add(ctls.create(20,80,180,40,0x1100,'WebVenture <br /> &#169; 2010 Sean Kasun',true,0,0,0,3));
		dialog.getItem(2).css('text-align','center');
		dialog.getItem(3).css('text-align','center');
		dialog.kind=2;
		self.isPaused=true;
		dialog.show();
		self.modalDialog=function(id){
			wins.close(dialog);
			self.isPaused=false;
		}
	}
	function checkNew()
	{
		if (!self.gameChanged)
			doNew();
		else
		{
			var name=self.mac2ascii(res.getIndStr(0x80,8));
			var win=wins.getAlert(res.get('ALRT',0x83));
			self.isPaused=true;
			win.param([name]);
			win.show();
			self.modalDialog=function(id){
				wins.close(win);
				switch (id)
				{
					case 1: //yes
						afterSave=checkNew;
						doSave();
						break;
					case 2: //cancel
						self.isPaused=false;
						break;
					case 3: //no
						doNew();
						break;
				}
			};
		}
	}
	function checkOpen()
	{
		if (!self.gameChanged)
			openDialog();
		else
		{
			var name=self.mac2ascii(res.getIndStr(0x80,9));
			var win=wins.getAlert(res.get('ALRT',0x83));
			win.param([name]);
			win.show();
			self.isPaused=true;
			self.modalDialog=function(id){
				wins.close(win);
				switch (id)
				{
					case 1: //yes
						afterSave=checkOpen;
						doSave();
						break;
					case 2: //cancel
						self.isPaused=false;
						break;
					case 3: //no
						openDialog();
						break;
				}
			}
		}
	}
	function openDialog()
	{
		var dialog=wins.createDialog('','dBox',true,false,82,71,348,200,undefined);
		dialog.add(ctls.create(256,138,80,18,0x00,'Open',true,0,0,0,1));
		dialog.add(ctls.create(256,163,80,18,0x00,'Cancel',true,0,0,0,3));
		dialog.add(ctls.create(12,39,218,146,0x1200,'',true,0,0,0,7));
		dialog.kind=2;
		self.isPaused=true;
		dialog.show();
		var list=dialog.getItem(7);
		var selectedItem=undefined;
		for (var i=0;i<localStorage.length;i++)
		{
			var title=localStorage.key(i);
			var g=JSON.parse(localStorage.getItem(title));
			if (g.game!=gamename) continue;
			var item=$(document.createElement('div'));
			item.addClass('listitem');
			item.click(function(event){
				if (selectedItem) selectedItem.removeClass('active');
				selectedItem=$(event.target);
				selectedItem.addClass('active');
			});
			item.text(title);
			list.append(item);
		}
		self.modalDialog=function(id){
			switch (id)
			{
				case 1: //open
					if (selectedItem==undefined) break;
					saveName=selectedItem.text();
					wins.close(dialog);
					self.isPaused=false;
					doOpen();
					break;
				case 3: //cancel
					wins.close(dialog);
					self.isPaused=false;
					break;
			}
		}
	}
	function doOpen()
	{
		var g=JSON.parse(localStorage.getItem(saveName));
		game=g.gamedata;
		self.globals=g.globals;
		resetWindows();
		initObjlist();
		textWin.setTitle(saveName);
		textEdit.html(g.text);
		textEdit.scrollTop(10000);
		self.gameState=1;
		halted=false;
		haltedAtEnd=false;
		haltedInSelection=false;
		curSelection=[];
		self.selectedCtl=0;
		engine.reset();
		self.set(self.get(1,0),6,1);
		self.gameChanged=false;
		self.runMain();
	}
	function checkQuit()
	{
		if (!self.gameChanged)
		{
			self.gameState=4;
			self.runMain();
		}
		else
		{
			var name=self.mac2ascii(res.getIndStr(0x80,7));
			var win=wins.getAlert(res.get('ALRT',0x83));
			win.param([name]);
			win.show();
			self.isPaused=true;
			self.modalDialog=function(id){
				wins.close(win);
				switch (id)
				{
					case 1: //yes
						afterSave=checkQuit;
						doSave();
						break;
					case 2: //cancel
						self.isPaused=false;
						break;
					case 3: //no
						self.gameState=4;
						self.runMain();
						break;
				}
			}
		}
	}
	this.buttonClicked=function(btn,event)
	{
		var win=btn.data('win');
		if (win.kind==2)
			return this.modalDialog(btn.data('refcon'));
		if (win==exitWin)
			exitClicked(btn,event);
		else
			commandClicked(btn);
	}
	function exitClicked(btn,event)
	{
		if (self.isPaused) return;
		self.handleObjectSelect(btn.data('refcon'),exitWin,event,false);
	}
	function commandClicked(btn)
	{
		if (btn.data('refcon')==0)
		{
			continueClicked();
			return;
		}
		if (self.isPaused) return;
		if (activeCmd && btn!=activeCmd)
			activeCmd.removeClass('active');
		self.selectedCtl=btn.data('refcon');
		self.activateCommand(self.selectedCtl);
		switch (numCmdObjs())
		{
			case 0:
				self.cmdReady=true;
				break;
			case 1:
				self.cmdReady=curSelection.length!=0;
				break;
			case 2:
				if (destObject>0)
					self.cmdReady=true;
				break;
		}
		self.runMain();
	}
	this.handleObjectSelect=function(obj,win,event,canDrag)
	{
		if (win==exitWin)
			win=mainWin;
		if (event.shiftKey)
		{
			if (!obj)
			{
				if (win.kind==0xe)
					doLasso(win,event,canDrag);
				else
				{
					if (curSelection.length==0 ||
						win!=self.getParentWin(curSelection[0]))
					{
						if (curSelection.indexOf(win.refCon.id)!=-1)
							unselectObj(win.refCon.id);
						else
							self.selectObj(win.refCon.id);
					}
					self.runMain();
				}
			}
			else
			{
				if (curSelection.indexOf(obj)!=-1)
					unselectObj(obj);
				else
					self.selectObj(obj);
				self.runMain();
			}
		}
		else
		{
			if (self.selectedCtl && curSelection.length &&
				numCmdObjs()>1)
			{
				if (!obj)
					primaryObject(win.refCon.id);
				else
					primaryObject(obj);
				self.runMain();
			}
			else
			{
				if (!obj)
				{
					self.unselectall();
					if (win.kind==0xe)
						doLasso(win,event,canDrag);
					else
						obj=win.refCon.id;
				}
				if (obj)
				{
					if (isDoubleClick(event))
					{
						if (curSelection.indexOf(obj)==-1)
							self.unselectall();
						self.selectObj(obj);
						doubleClickObject(obj,win,event,canDrag);
					}
					else
					{
						if (curSelection.indexOf(obj)==-1)
							self.unselectall();
						self.selectObj(obj);
						singleClickObject(obj,win,event,canDrag);
					}
				}
			}
		}
	}
	function primaryObject(obj)
	{
		if (obj==destObject) return;
		var idx;
		if (destObject>0 &&
			(idx=selectedObjs.indexOf(destObject))!=-1 &&
			curSelection.indexOf(destObject)==-1)
		{
			selectedObjs.splice(idx,1);
			hiliteExit(destObject);
		}
		destObject=obj;
		if (selectedObjs.indexOf(destObject)==-1)
		{
			selectedObjs.push(destObject);
			hiliteExit(destObject);
		}
		self.cmdReady=true;
	}
	function isDoubleClick(event)
	{
		if (event.timeStamp-lastClick<=300)
		{
			lastClick=0;
			return true;
		}
		return false;
	}
	var dragObject=undefined;
	function doubleClickObject(obj,win,event,canDrag)
	{
		var lastX=event.pageX;
		var lastY=event.pageY;
		var start={h:0,v:0};
		var moved=false;
		dragObject=undefined;
		if (canDrag)
		{
			$(document).mousemove(function(event){
				if (dragObject==undefined)
				{
					if (Math.abs(event.pageX-lastX)+Math.abs(event.pageY-lastY)<=7) return false;
					moved=true;
					dragObject=createProxy(obj);
					var child=self.getChildIdx(win.refCon.children,obj);
					if (child)
					{
						start.h=win.refCon.children[child-1].left;
						start.v=win.refCon.children[child-1].top;
					}
					win.localToGlobal(start);
					dragObject.css('top',start.v+'px');
					dragObject.css('left',start.h+'px');
				}
				var pos=dragObject.position();
				dragObject.css('top',(pos.top+(event.pageY-lastY))+'px');
				dragObject.css('left',(pos.left+(event.pageX-lastX))+'px');
				lastX=event.pageX;
				lastY=event.pageY;
				return false;
			});
		}
		$(document).mouseup(function(event){
			var pos;
			if (canDrag)
			{
				$(document).unbind('mousemove');
				if (dragObject)
				{
					pos=dragObject.position();
					dragObject.remove();
				}
			}
			$(document).unbind('mouseup');
			if (moved)
			{
				deltaPt.h=pos.left;
				deltaPt.v=pos.top;
				var loc=getWindowLocation(event.pageX,event.pageY);
				destObject=loc.id;
				deltaPt.h-=start.h;
				deltaPt.v-=start.v;
				if (loc.win!=win)
				{
					win.localToGlobal(deltaPt);
					if (loc.win)
						loc.win.globalToLocal(deltaPt);
				}
				self.selectedCtl=5;
				self.activateCommand(5);
				self.cmdReady=true;
			}
			if (!self.cmdReady)
			{
				primaryObject(obj);
				if (!self.selectedCtl)
				{
					self.selectedCtl=4;
					self.activateCommand(4);
					self.cmdReady=true;
				}
			}
			self.runMain();
		});
	}
	function singleClickObject(obj,win,event,canDrag)
	{
		var lastX=event.pageX;
		var lastY=event.pageY;
		var start={h:0,v:0};
		var moved=false;
		dragObject=undefined;
		if (canDrag)
		{
			$(document).mousemove(function(event){
				if (dragObject==undefined)
				{
					if (Math.abs(event.pageX-lastX)+Math.abs(event.pageY-lastY)<=7) return false;
					moved=true;
					dragObject=createProxy(obj);
					var child=self.getChildIdx(win.refCon.children,obj);
					if (child)
					{
						start.h=win.refCon.children[child-1].left;
						start.v=win.refCon.children[child-1].top;
					}
					win.localToGlobal(start);
					dragObject.css('top',start.v+'px');
					dragObject.css('left',start.h+'px');
				}
				var pos=dragObject.position();
				dragObject.css('top',(pos.top+(event.pageY-lastY))+'px');
				dragObject.css('left',(pos.left+(event.pageX-lastX))+'px');
				lastX=event.pageX;
				lastY=event.pageY;
				return false;
			});
		}
		$(document).mouseup(function(event){
			lastClick=event.timeStamp;
			var pos;
			if (canDrag)
			{
				$(document).unbind('mousemove');
				if (dragObject)
				{
					pos=dragObject.position();
					dragObject.remove();
				}
			}
			$(document).unbind('mouseup');
			if (moved)
			{
				deltaPt.h=pos.left;
				deltaPt.v=pos.top;
				var loc=getWindowLocation(event.pageX,event.pageY);
				destObject=loc.id;
				deltaPt.h-=start.h;
				deltaPt.v-=start.v;
				if (loc.win!=win)
				{
					win.localToGlobal(deltaPt);
					if (loc.win)
						loc.win.globalToLocal(deltaPt);
				}
				self.selectedCtl=5;
				self.activateCommand(5);
				self.cmdReady=true;
			}
			if (numCmdObjs()==1)
				self.cmdReady=true;
			self.runMain();
		});
	}
	function reflectSwap(swap)
	{
		var from=getWindow(swap.from);
		var to=getWindow(swap.to);
		var win=to;
		if (!to) win=from;
		if (win)
		{
			var str=texts.get(swap.to);
			win.setTitle(str);
			setRefCon(swap.to,win);
			win.refCon.flag=true;
			self.updateWindow(win);
		}
	}
	function zoomObject(obj)
	{
		screen.append(dragObject);
		var pt={h:self.get(obj,1),v:self.get(obj,2)};
		self.getParentWin(obj).localToGlobal(pt);
		dragObject.animate({
			top:pt.v+'px',
			left:pt.h+'px'
			},300,function () {
				dragObject.remove();
			}
		);
	}
	function createProxy(obj)
	{
		var img=graphics.get(obj*2);
		var mask=graphics.get(obj*2+1);
		var w=img.width;
		var h=img.height;
		if (mask)
		{
			if (w<mask.width) w=mask.width;
			if (h<mask.height) h=mask.height;
		}
		var drag=$(document.createElement('canvas'));
		drag.addClass('proxy');
		drag.attr('width',w);
		drag.attr('height',h);
		screen.append(drag);
		if (mask)
			mask.bic(drag,0,0);
		else
			graphics.fill(drag,0);
		img.xor(drag,0,0);
		return drag;
	}
	function getWindowLocation(x,y)
	{
		var info=wins.findWindow(x,y);
		var kind=0;
		if (info.win!=undefined) kind=info.win.kind;
		if (info.id==3 && (kind==0xe || kind==0xa)) //content
			info.id=info.win.refCon.id;
		else switch (kind)
		{
			case 0x9: info.id=-1; break;
			case 0xb: info.id=-2; break;
			case 0xc: info.id=-3; break;
			case 0xd: info.id=-4; break;
			default:
				switch (info.id)
				{
					case 0: info.id=-5; break; //nohit
					case 1: info.id=-6; break; //menubar
					case 2: info.id=-7; break; //dialog
					case 3: info.id=-8; break; //content
					case 4: info.id=-9; break; //indrag
					case 5: info.id=-10; break; //grow
					case 6: info.id=-11; break; //goaway
					default: info.id=-12; break; //zoom
				}
				break;
		}
		return info;
	}
	this.objHit=function(pt,child)
	{
		var obj=0;
		if (!this.get(child.id,4) &&
			inRect(pt,child))
		{
			if (bmp=graphics.get(child.id*2+1))
			{
				if (bmp.hit(pt.h-child.left,pt.v-child.top))
					obj=child.id;
			}
			else obj=child.id;
		}
		return obj;
	}
	function inRect(pt,rect)
	{
		if (pt.h>=rect.left && pt.v>=rect.top &&
			pt.h<rect.left+rect.width &&
			pt.v<rect.top+rect.height) return true;
		return false;
	}
	var continueButton;
	this.clickToContinue=function()
	{
		var w=commandsWin.port.width();
		var h=commandsWin.port.height();
		continueButton=ctls.create(4,4,w-8,h-8,0x800,'Click to continue',true,0,0,0,0);
		continueButton.addClass('ctc');
		commandsWin.hideControls();
		commandsWin.add(continueButton);
	}
	function continueClicked()
	{
		commandsWin.remove(continueButton);
		commandsWin.showControls();
		self.runMain();
	}
	this.textEntry=function(txt,obj,target)
	{
		texts.target=target;
		texts.source=obj;
		var dialog=wins.getDialog(res.get('DLOG',0x84));
		dialog.param([texts.get(txt)]);
		dialog.show();
		self.modalDialog=function(id){
			texts.input=dialog.getItem(3).val();
			if (id!=2)
				engine.push(0xffff);
			else
				engine.push(0);
			wins.close(dialog);
			self.runMain();
		};
	}
	this.mac2ascii=function(str)
	{
		var newstr='';
		for (var c=0;c<str.length;c++)
		{
			switch (str.charCodeAt(c))
			{
				case 13: newstr+='<br />'; break;
				case 63368: newstr+='&#224;'; break;
				case 63374: newstr+='&#233;'; break;
				case 63401: newstr+='&#169;'; break;
				case 63433: newstr+='...'; break;
				case 63441: newstr+='&#8212;'; break;
				default: newstr+=str.charAt(c); break;
			}
		}
		return newstr;
	}
}
var webventure=new WebVenture();
