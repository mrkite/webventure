/**
 * @constructor
 */
function EngineState()
{
	var stack=new Array(0x80);
	var sp=0x80;
	this.push=function(val)
	{
		sp--;
		stack[sp]=unneg16(val)&0xffff;
	}
	this.pop=function()
	{
		return stack[sp++];
	}
	this.peek=function(x)
	{
		return stack[sp+x];
	}
	this.poke=function(x,v)
	{
		stack[sp+x]=unneg16(v)&0xffff;
	}
	function unneg16(val)
	{
		if (val<0)
			val=((-val)^0xffff)+1;
		return val;
	}
	this.clear=function()
	{
		sp=0x80;
	}
	this.size=function()
	{
		return 0x80-sp;
	}
}
/**
 * @constructor
 */
function Engine(objects,text,res,graphics)
{
	var self=this;
	var frames=[];
	this.reset=function()
	{
		frames=[];
	}
	this.push=function(val)
	{
		frames[0].state.push(val);
	}
	this.run=function(curCtl,curObj,target,pt)
	{
		frames.unshift({curCtl:curCtl,curObj:curObj,
			target:target,ptx:pt.h,pty:pt.v,
			state:new EngineState(),saves:[],p:[]});
		return self.resume(true);
	}
	this.resume=function(doAll)
	{
		var initial=typeof(doAll)!='undefined'?doAll:false;
		while (frames.length)
		{
			var fail=resumeOne(initial);
			if (fail) return true;
		}
		return false;
	}
	function resumeOne(doAll)
	{
		var doFirst=typeof(doAll)!='undefined'?doAll:false;
		var doFamily=false;
		var fail;
		if (frames[0].haltedInFirst || doFirst)
		{
			frames[0].haltedInFirst=false;
			if (doFirst) fail=loadFunc(0);
			else fail=resumeFunc();
			if (fail)
			{
				frames[0].haltedInFirst=true;
				return true;
			}
			doFamily=true;
			frames[0].familyIdx=0;
		}
		if (frames[0].haltedInFamily || doFamily)
		{
			frames[0].haltedInFamily=false;
			var funcs=webventure.getFamily(webventure.get(1,0),false);
			var i=frames[0].familyIdx;
			for (;i<funcs.length;i++)
			{
				if (doFamily) fail=loadFunc(funcs[i]);
				else fail=resumeFunc();
				if (fail)
				{
					frames[0].haltedInFamily=true;
					frames[0].familyIdx=i;
					return true;
				}
				doFamily=true;
			}
		}
		var highest;
		var high;
		if (frames[0].haltedInSaves)
		{
			frames[0].haltedInSaves=false;
			if (resumeFunc())
			{
				frames[0].haltedInSaves=true;
				return true;
			}
		}
		do {
			highest=0;
			for (var i=0;i<frames[0].saves.length;i++)
			{
				if (highest<frames[0].saves[i].rank)
				{
					highest=frames[0].saves[i].rank;
					high=i;
				}
			}
			if (highest)
			{
				frames[0].saves[high].rank=0;
				if (loadFunc(frames[0].saves[high].func))
				{
					frames[0].haltedInSaves=true;
					return true;
				}
			}
		} while (highest);
		frames.shift();
		return false;
	}
	function loadFunc(id)
	{
		var func;
		if ((func=objects.get(1,id)))
		{
			frames[0].p[0]=new GFile(func);
			return runFunc();
		}
		return false;
	}
	function resumeFunc()
	{
		var fail=runFunc();
		if (fail) return fail;
		frames[0].p.shift();
		if (frames[0].p.length)
			return resumeFunc();
	}
	function neg8(val)
	{
		if (val&0x80)
			val=-((val^0xff)+1);
		return val;
	}
	function neg16(val)
	{
		if (val&0x8000)
			val=-((val^0xffff)+1);
		return val;
	}
	var fib=0;
	function runFunc()
	{
		var p=frames[0].p[0];
		var state=frames[0].state;
		while (!p.eof())
		{
			var ch=p.r8();
			//console.log("ch: "+ch.toString(16)+" "+state.peek(0)+" "+state.peek(1)+" "+state.peek(2));
			if (!(ch&0x80))
			{
				state.push(ch);
				continue;
			}
			switch (ch)
			{
			case 0x80: //get attribute
				var obj=state.pop();
				var attr=state.pop()
				var val=webventure.get(obj,attr);
				state.push(val);
				break;
			case 0x81: //set attribute
				var obj=state.pop();
				var attr=state.pop();
				var val=neg16(state.pop());
				webventure.set(obj,attr,val);
				break;
			case 0x82: //sum family attribute
				var obj=state.pop();
				var attr=state.pop();
				var recurs=state.pop();
				state.push(sumFamilyAttr(obj,attr,recurs!=0));
				break;
			case 0x83: //push cur control
				state.push(frames[0].curCtl);
				break;
			case 0x84: //push cur object
				state.push(frames[0].curObj);
				break;
			case 0x85: //push target
				state.push(frames[0].target);
				break;
			case 0x86: //push pointx
				state.push(frames[0].ptx);
				break;
			case 0x87: //push pointy
				state.push(frames[0].pty);
				break;
			case 0x88: //push immediate.b
				state.push(p.r8());
				break;
			case 0x89: //push immediate
				state.push(p.r16());
				break;
			case 0x8a: //get global value
				var idx=state.pop();
				state.push(webventure.globals[idx]);
				break;
			case 0x8b: //set global value
				var idx=state.pop();
				var val=neg16(state.pop());
				webventure.globals[idx]=val;
				webventure.gameChanged=true;
				break;
			case 0x8c: //random
				var max=state.pop();
				state.push(Math.round((max-1)*Math.random()));
				break;
			case 0x8d: //copy
				var val=state.peek(0);
				state.push(val);
				break;
			case 0x8e: //copyn
				var num=state.pop();
				var ofs=num-1;
				while (num--)
				{
					var val=state.peek(ofs);
					state.push(val);
				}
				break;
			case 0x8f: //swap
				var b=state.pop();
				var a=state.pop();
				state.push(b)
				state.push(a)
				break;
			case 0x90: //swapn
				var idx=state.pop();
				var a=state.peek(idx);
				var b=state.peek(0);
				state.poke(idx,b);
				state.poke(0,a);
				break;
			case 0x91: //pop
				state.pop();
				break;
			case 0x92: //copy+1
				var val=state.peek(1);
				state.push(val);
				break;
			case 0x93: //copy+n
				var idx=state.pop();
				var val=state.peek(idx);
				state.push(val);
				break;
			case 0x94: //shuffle
				var a=state.pop();
				var b=state.pop();
				var c=state.pop();
				state.push(a);
				state.push(c);
				state.push(b);
				break;
			case 0x95: //sort
				var step=neg16(state.pop());
				var num=neg16(state.pop());
				step%=num;
				if (step<0) step+=num;
				var end=0;
				var start=0;
				for (var i=1;i<num;i++)
				{
					start+=step;
					if (start>=num) start-=num;
					if (start==end)
					{
						end++;
						start=end;
					}
					else
					{
						var a=state.peek(end);
						var b=state.peek(start);
						state.poke(end,b);
						state.poke(start,a);
					}
				}
				break;
			case 0x96: //clear stack
				state.clear();
				break;
			case 0x97: //get stack size
				state.push(state.size());
				break;
			case 0x98: //add
				var b=state.pop();
				var a=state.pop();
				state.push(a+b);
				break;
			case 0x99: //subtract
				var b=state.pop();
				var a=state.pop();
				state.push(a-b);
				break;
			case 0x9a: //multiply
				var b=state.pop();
				var a=state.pop();
				state.push(a*b);
				break;
			case 0x9b: //divide
				var b=state.pop();
				var a=state.pop();
				state.push((a/b)|0);
				break;
			case 0x9c: //mod
				var b=state.pop();
				var a=state.pop();
				state.push(a%b);
				break;
			case 0x9d: //divmod
				var b=state.pop();
				var a=state.pop();
				state.push(a%b);
				state.push((a/b)|0);
				break;
			case 0x9e: //abs
				var val=neg16(state.pop());
				if (val<0) val=-val;
				state.push(val);
				break;
			case 0x9f: //neg
				var val=-neg16(state.pop());
				state.push(val);
				break;
			case 0xa0: //and
				var b=state.pop();
				var a=state.pop();
				state.push(a&b);
				break;
			case 0xa1: //or
				var b=state.pop();
				var a=state.pop();
				state.push(a|b);
				break;
			case 0xa2: //xor
				var b=state.pop();
				var a=state.pop();
				state.push(a^b);
				break;
			case 0xa3: //not
				var val=state.pop();
				state.push(val^0xffff);
				break;
			case 0xa4: //logical and
				var b=state.pop();
				var a=state.pop();
				state.push((a && b)?0xffff:0);
				break;
			case 0xa5: //logical or
				var b=state.pop();
				var a=state.pop();
				state.push((a || b)?0xffff:0);
				break;
			case 0xa6: //logical xor
				var b=state.pop();
				var a=state.pop();
				state.push((!a != !b)?0xffff:0);
				break;
			case 0xa7: //logical not
				var val=state.pop();
				state.push((val==0)?0xffff:0);
				break;
			case 0xa8: //gt? unsigned
				var b=state.pop();
				var a=state.pop();
				state.push((a>b)?0xffff:0);
				break;
			case 0xa9: //lt? unsigned
				var b=state.pop();
				var a=state.pop();
				state.push((a<b)?0xffff:0);
				break;
			case 0xaa: //gt? signed
				var b=neg16(state.pop());
				var a=neg16(state.pop());
				state.push((a>b)?0xffff:0);
				break;
			case 0xab: //lt? signed
				var b=neg16(state.pop());
				var a=neg16(state.pop());
				state.push((a<b)?0xffff:0);
				break;
			case 0xac: //eq?
				var b=state.pop();
				var a=state.pop();
				state.push((a==b)?0xffff:0);
				break;
			case 0xad: //eq string?
				var b=text.get(state.pop());
				var a=text.get(state.pop());
				state.push((a==b)?1:0);
				break;
			case 0xae: //contains
				var needle=text.get(state.pop());
				var haystack=text.get(state.pop());
				state.push(haystack.toLowerCase().indexOf(needle.toLowerCase())!=-1?1:0);
				break;
			case 0xaf: //contains word?
				var needle=text.get(state.pop());
				var haystack=text.get(state.pop());
				var search=new RegExp("\\b"+needle+"\\b","i");
				state.push(search.test(haystack)?0xffff:0);
				break;
			case 0xb0: //bra
				var delta=neg16(p.r16());
				p.seek(delta,p.cur);
				break;
			case 0xb1: //bra.b
				var delta=neg8(p.r8());
				p.seek(delta,p.cur);
				break;
			case 0xb2: //beq
				var delta=neg16(p.r16());
				var b=state.pop();
				if (b!=0) p.seek(delta,p.cur);
				break;
			case 0xb3: //beq.b
				var delta=neg8(p.r8());
				var b=state.pop();
				if (b!=0) p.seek(delta,p.cur);
				break;
			case 0xb4: //bne
				var delta=neg16(p.r16());
				var b=state.pop();
				if (b==0) p.seek(delta,p.cur);
				break;
			case 0xb5: //bne.b
				var delta=neg8(p.r8());
				var b=state.pop();
				if (b==0) p.seek(delta,p.cur);
				break;
			case 0xb6: //call later
				var rank=state.pop();
				var func=state.pop();
				frames[0].saves.push({rank:rank,func:func});
				break;
			case 0xb7: //clear saved func
				var func=state.pop();
				for (var i=0;i<frames[0].saves.length;i++)
				{
					if (frames[0].saves[i].func==func)
						frames[0].saves[i].rank=0;
				}
				break;
			case 0xb8: //clear saved low
				var hi=state.pop();
				for (var i=0;i<frames[0].saves.length;i++)
				{
					if (frames[0].saves[i].rank<=hi)
						frames[0].saves[i].rank=0;
				}
				break;
			case 0xb9: //clear saved high
				var lo=state.pop();
				for (var i=0;i<frames[0].saves.length;i++)
				{
					if (frames[0].saves[i].rank>=lo)
						frames[0].saves[i].rank=0;
				}
				break;
			case 0xba: //clear saved range
				var hi=state.pop();
				var lo=state.pop(); 
				for (var i=0;i<frames[0].saves.length;i++)
				{
					if (frames[0].saves[i].rank>=lo &&
						frames[0].saves[i].rank<=hi)
						frames[0].saves[i].rank=0;
				}
				break;
			case 0xbb: //fork
				var newctl=state.pop();
				var newobj=state.pop();
				var newtarget=state.pop();
				var newx=state.pop();
				var newy=state.pop();
				frames.unshift({curCtl:newctl,
					curObj:newobj,target:newtarget,
					ptx:newx,pty:newy,
					state:new EngineState(),
					saves:[],p:[undefined]});
				if (resumeOne(true))
					return true;
				break;
			case 0xbc: //call function
				var id=state.pop();
				frames[0].p.unshift(undefined);
				if (loadFunc(id))
					return true;
				frames[0].p.shift();
				p=frames[0].p[0];
				break;
			case 0xbd: //open object
				var obj=state.pop();
				webventure.queue.push({id:2,val:obj});
				break;
			case 0xbe: //swap objects
				var swap={};
				swap.from=state.pop();
				swap.to=state.pop();
				webventure.queue.push({id:8,val:swap});
				swapObjects(swap);
				break;
			case 0xbf: //snap object
				webventure.queue.push({id:0xe,val:frames[0].curObj});
				break;
			case 0xc0: //toggle exits
				webventure.queue.push({id:0xd});
				break;
			case 0xc1: //print text
				var id=state.pop();
				webventure.textQueue.push({id:3,val:[frames[0].target,frames[0].curObj,id]});
				break;
			case 0xc2: //print newline
				webventure.textQueue.push({id:2});
				break;
			case 0xc3: //print text+nl
				var id=state.pop();
				webventure.textQueue.push({id:3,val:[frames[0].target,frames[0].curObj,id]});
				webventure.textQueue.push({id:2});
				break;
			case 0xc4: //print nl+text+nl
				webventure.textQueue.push({id:2});
				var id=state.pop();
				webventure.textQueue.push({id:3,val:[frames[0].target,frames[0].curObj,id]});
				webventure.textQueue.push({id:2});
				break;
			case 0xc5: //print number
				var id=state.pop();
				webventure.textQueue.push({id:1,val:id});
				break;
			case 0xc6: //push 2
				state.push(2);
				break;
			case 0xc7: //play sound in background
				var obj=state.pop();
				webventure.soundQueue.push({id:1,val:obj});
				break;
			case 0xc8: //play sound and wait for it to finish
				var obj=state.pop();
				webventure.soundQueue.push({id:2,val:obj});
				break;
			case 0xc9: //wait for sound to finish?
				webventure.soundQueue.push({id:3});
				break;
			case 0xca: //get current time
				var time=getTime();
				state.push(time[0]);
				state.push(time[1]);
				state.push(time[2]);
				state.push(time[3]);
				state.push(time[4]);
				state.push(time[5]);
				break;
			case 0xcb: //get current day
				state.push(getDOTW());
				break;
			case 0xcc: //get children
				var recurs=state.pop();
				var obj=state.pop();
				var fam=webventure.getFamily(obj,recurs!=0);
				for (var i=1;i<fam.length;i++)
					state.push(fam[i]);
				state.push(fam.length-1);
				break;
			case 0xcd: //get num children
				var recurs=state.pop();
				var obj=state.pop();
				var fam=webventure.getFamily(obj,recurs!=0);
				state.push(fam.length-1);
				break;
			case 0xce: //get engine version
				state.push(86);
				break;
			case 0xcf: //push scenario number
				var scenario=res.getIndStr(0x81,1);
				state.push(scenario.charCodeAt(3)-48);
				break;
			case 0xd0: //push 1
				state.push(1);
				break;
			case 0xd1: //get object dimensions
				var obj=state.pop();
				var pt=getObjDims(obj);
				state.push(pt.h);
				state.push(pt.v);
				break;
			case 0xd2: //get overlap percent
				var b=state.pop();
				var a=state.pop();
				state.push(getOverlap(b,a));
				break;
			case 0xd3: //capture children
				var obj=state.pop();
				captureChildren(obj);
				break;
			case 0xd4: //release children
				var obj=state.pop();
				releaseChildren(obj);
				break;
			case 0xd5: //show speech dialog
				var txt=state.pop();
				webventure.textEntry(txt,frames[0].curObj,frames[0].target);
				return true;
				break;
			case 0xd6: //activate command
				webventure.activateCommand(state.pop());
				break;
			case 0xd7: //lose screen
				webventure.gameState=3;
				break;
			case 0xd8: //win screen
				webventure.gameState=2;
				break;
			case 0xd9: //sleep
				var len=state.pop();
				setTimeout(webventure.runMain,(len/60)*1000);
				return true;
				break;
			case 0xda: //click to continue
				webventure.updateScreen(false);
				webventure.clickToContinue();
				return true;
				break;
			case 0xdb: //run queue
				webventure.runQueue();
				break;
			case 0xdc: //run soundQueue
				if (webventure.playSounds(true))
					return true;
				break;
			case 0xdd: //run textQueue
				webventure.printTexts();
				break;
			case 0xde: //update screen
				if (webventure.updateScreen(true))
					return true;
				break;
			case 0xdf: //invert main screen and sleep
				var len=state.pop();
				webventure.invertmain();
				setTimeout(webventure.revertmain,(len/60)*1000);
				return true;
				break;
			case 0xe0: //cache graphic and object
				var val=state.pop();
				break;
			case 0xe1: //cache sound
				var obj=state.pop();
				break;
			case 0xe2: //muldiv
				var b=state.pop();
				var a=state.pop();
				a*=b;
				var c=state.pop();
				a/=c;
				state.push(a|0);
				break;
			case 0xe3: //update object
				var obj=state.pop();
				webventure.updateObject(obj);
				break;
			case 0xe4: //currently playing event?
				state.push(0);
				break;
			case 0xe5: //wait for event to finish
				break;
			case 0xe6: //get fibonacci.. I swear this is a joke
				state.push(fib);
				break;
			case 0xe7: //calculate fibonacci.. these are never used
				var num=state.pop();
				var y=1;
				fib=0;
				for (var i=0;i<num;i++)
				{
					fib+=y;
					fib^=y; y^=fib; fib^=y;
				}
				break;
			default:
				throw "func: "+ch.toString(16);
			}
		}
		return false;
	}

	function getDOTW()
	{
		var d=new Date();
		return d.getDay()+1;
	}
	function getTime()
	{
		var d=new Date();
		return [d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds()];
	}
	function getObjDims(val)
	{
		var rect=getObjBounds(val);
		return {v:rect.height,h:rect.width};
	}
	function emptyRect(r)
	{
		return (r.width==0 || r.height==0);
	}
	function getObjBounds(obj)
	{
		var rect={top:0,left:0,width:0,height:0};
		var win=webventure.getParentWin(obj);
		var child=0;
		if (win && win.refCon)
			child=webventure.getChildIdx(win.refCon.children,obj);
		if (child)
		{
			if (emptyRect(win.refCon.children[child-1]))
			{
				var r=webventure.drawObject(obj,win,true);
				win.refCon.children[child-1].top=r.top;
				win.refCon.children[child-1].left=r.left;
				win.refCon.children[child-1].width=r.width;
				win.refCon.children[child-1].height=r.height;
			}
			rect.top=win.refCon.children[child-1].top;
			rect.left=win.refCon.children[child-1].left;
			rect.width=win.refCon.children[child-1].width;
			rect.height=win.refCon.children[child-1].height;
		}
		else
		{
			var bmp;
			if ((bmp=graphics.get(obj*2))!=undefined)
			{
				rect.top=webventure.get(obj,2);
				rect.left=webventure.get(obj,1);
				rect.width=bmp.width;
				rect.height=bmp.height;
			}
			else if ((bmp=graphics.get(obj*2+1))!=null)
			{
				rect.top=webventure.get(obj,2);
				rect.left=webventure.get(obj,1);
				rect.width=bmp.width;
				rect.height=bmp.height;
			}
			else
			{
				rect.top=0;
				rect.left=0;
				rect.width=0;
				rect.height=0;
			}
		}
		return rect;
	}
	function sumFamilyAttr(obj,attr,recurs)
	{
		var sum=0;
		var fam=webventure.getFamily(obj,recurs);
		for (var i=1;i<fam.length;i++)
			sum+=webventure.get(fam[i],attr);
		return sum;
	}
	function swapObjects(p)
	{
		webventure.set(p.to,6,webventure.get(p.from,6));
		webventure.set(p.from,6,0);
		var fam=webventure.getFamily(p.from,true);
		for (var i=1;i<fam.length;i++)
			webventure.set(fam[i],0,p.to);
	}
	function captureChildren(obj)
	{
		var captured=[];
		var fam=webventure.getFamily(webventure.get(obj,0),1);
		for (var i=1;i<fam.length;i++)
			if (obj<fam[i] && getOverlap(fam[i],obj)>=40)
				captured.push(fam[i]);
		while (captured.length)
			webventure.set(captured.pop(),0,obj);
	}
	function releaseChildren(obj)
	{
		var fam=webventure.getFamily(obj,1);
		var parent=webventure.get(obj,0);
		for (var i=1;i<fam.length;i++)
			webventure.set(fam[i],0,parent);
	}
	function getOverlap(obj1,obj2)
	{
		if (webventure.get(obj1,0)!=webventure.get(obj2,0))
			return 0;
		var bounds1=getObjBounds(obj1);
		var bounds2=getObjBounds(obj2);
		if (graphics.sectRect(bounds2,bounds1,bounds2))
		{
			var area=bounds1.width*bounds1.height;
			var area2=bounds2.width*bounds2.height;
			return (area2*100/area)|0;
		}
		return 0;
	}
}
