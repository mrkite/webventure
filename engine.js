/********************** public functions *********************/

function resetEngine()
{
	frames=[];
}

function run(curCtl,curObj,target,pt)
{
	frames.unshift({curCtl:curCtl,curObj:curObj,
		target:target,ptx:pt.h,pty:pt.v,
		state:new EngineState(),saves:[],p:[]});
	return resume(true);
}
function resume(doAll)
{
	var initial=typeof(doAll)!='undefined'?doAll:false;
	while (frames.length)
	{
		var fail=resumeOne(initial);
		if (fail) return true;
	}
	return false;
}

/********************** private functions *********************/
var frames=[];
/**
 * @constructor
 */
function EngineState()
{
	this.stack=new Array(0x80);
	this.sp=0x80;
}
EngineState.prototype.push=function(val)
{
	this.stack[--this.sp]=unneg16(val);
}
EngineState.prototype.pop=function()
{
	return this.stack[this.sp++];
}
EngineState.prototype.peek=function(x)
{
	return this.stack[this.sp+x];
}
EngineState.prototype.poke=function(x,v)
{
	this.stack[this.sp+x]=unneg16(v);
}
EngineState.prototype.clear=function()
{
	this.sp=0x80;
}
EngineState.prototype.size=function()
{
	return 0x80-this.sp;
}

function unneg16(val)
{
	if (val<0)
		val=((-val)^0xffff)+1;
	return val&0xffff;
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
		var funcs=getFamily(get(1,0),false);
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
	if (func=getObject(1,id))
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
var fib;
function runFunc()
{
	var ch,obj,attr,val,recurs,idx,max;
	var x,y,len,txt,pt,fam,time,swap,id,newstate,hi,lo,func,rank,delta;
	var search,haystack,needle,i,start,end,step,a,b,c,ofs,num;

	var p=frames[0].p[0];
	var state=frames[0].state;
	while (!p.eof())
	{
		ch=p.r8();
		if (!(ch&0x80))
		{
			state.push(ch);
			continue;
		}
		switch (ch)
		{
		case 0x80: //get attribute
			obj=state.pop();
			attr=state.pop();
			state.push(get(obj,attr));
			break;
		case 0x81: //set attribute
			obj=state.pop();
			attr=state.pop();
			val=neg16(state.pop());
			set(obj,attr,val);
			break;
		case 0x82: //sum family attribute
			obj=state.pop();
			attr=state.pop();
			recurs=state.pop()!=0;
			state.push(sumFamilyAttr(obj,attr,recurs));
			break;
		case 0x83: //push selected control
			state.push(frames[0].curCtl);
			break;
		case 0x84: //push selected object
			state.push(frames[0].curObj);
			break;
		case 0x85: //push target
			state.push(frames[0].target);
			break;
		case 0x86: //push deltax
			state.push(frames[0].ptx);
			break;
		case 0x87: //push deltay
			state.push(frames[0].pty);
			break;
		case 0x88: //push immediate.b
			state.push(p.r8());
			break;
		case 0x89: //push immediate
			state.push(p.r16());
			break;
		case 0x8a: //get global
			idx=state.pop();
			state.push(globals[idx]);
			break;
		case 0x8b: //set global
			idx=state.pop();
			val=neg16(state.pop());
			globals[idx]=val;
			gameChanged=true;
			break;
		case 0x8c: //random
			max=state.pop();
			state.push(Math.round((max-1)*Math.random()));
			break;
		case 0x8d: //copy
			val=state.peek(0);
			state.push(val);
			break;
		case 0x8e: //copyn
			num=state.pop();
			ofs=num-1;
			while (num--)
			{
				val=state.peek(ofs);
				state.push(val);
			}
			break;
		case 0x8f: //swap
			b=state.pop();
			a=state.pop();
			state.push(b);
			state.push(a);
			break;
		case 0x90: //swapn
			idx=state.pop();
			a=state.peek(idx);
			b=state.peek(0);
			state.poke(idx,b);
			state.poke(0,a);
			break;
		case 0x91: //pop
			state.pop();
			break;
		case 0x92: //copy+1
			val=state.peek(1);
			state.push(val);
			break;
		case 0x93: //copy+n
			idx=state.pop();
			val=state.peek(idx);
			state.push(val);
			break;
		case 0x94: //shuffle
			a=state.pop();
			b=state.pop();
			c=state.pop();
			state.push(a);
			state.push(c);
			state.push(b);
			break;
		case 0x95: //sort
			step=neg16(state.pop());
			num=neg16(state.pop());
			step%=num;
			if (step<0) step+=num;
			end=0;
			start=0;
			for (i=1;i<num;i++)
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
					a=state.peek(end);
					b=state.peek(start);
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
			b=state.pop();
			a=state.pop();
			state.push(a+b);
			break;
		case 0x99: //subtract
			b=state.pop();
			a=state.pop();
			state.push(a-b);
			break;
		case 0x9a: //multiply
			b=state.pop();
			a=state.pop();
			state.push(a*b);
			break;
		case 0x9b: //divide
			b=state.pop();
			a=state.pop();
			state.push((a/b)|0);
			break;
		case 0x9c: //mod
			b=state.pop();
			a=state.pop();
			state.push(a%b);
			break;
		case 0x9d: //divmod
			b=state.pop();
			a=state.pop();
			state.push(a%b);
			state.push((a/b)|0);
			break;
		case 0x9e: //abs
			val=neg16(state.pop());
			if (val<0) val=-val;
			state.push(val);
			break;
		case 0x9f: //neg
			val=-neg16(state.pop());
			state.push(val);
			break;
		case 0xa0: //and
			b=state.pop();
			a=state.pop();
			state.push(a&b);
			break;
		case 0xa1: //or
			b=state.pop();
			a=state.pop();
			state.push(a|b);
			break;
		case 0xa2: //xor
			b=state.pop();
			a=state.pop();
			state.push(a^b);
			break;
		case 0xa3: //not
			val=state.pop();
			state.push(val^0xffff);
			break;
		case 0xa4: //logical and
			b=state.pop();
			a=state.pop();
			state.push((a && b)?0xffff:0);
			break;
		case 0xa5: //logical or
			b=state.pop();
			a=state.pop();
			state.push((a || b)?0xffff:0);
			break;
		case 0xa6: //logical xor
			b=state.pop();
			a=state.pop();
			state.push((!a != !b)?0xffff:0);
			break;
		case 0xa7: //logical not
			val=state.pop();
			state.push((val==0)?0xffff:0);
			break;
		case 0xa8: //gt? unsigned
			b=state.pop();
			a=state.pop();
			state.push((a>b)?0xffff:0);
			break;
		case 0xa9: //lt? unsigned
			b=state.pop();
			a=state.pop();
			state.push((a<b)?0xffff:0);
			break;
		case 0xaa: //gt? signed
			b=neg16(state.pop());
			a=neg16(state.pop());
			state.push((a>b)?0xffff:0);
			break;
		case 0xab: //lt? signed
			b=neg16(state.pop());
			a=neg16(state.pop());
			state.push((a<b)?0xffff:0);
			break;
		case 0xac: //eq?
			b=state.pop();
			a=state.pop();
			state.push((a==b)?0xffff:0);
			break;
		case 0xad: //eq string?
			b=getText(state.pop());
			a=getText(state.pop());
			state.push((a==b)?1:0);	//FIXME: verify this is 1 and not -1
			break;
		case 0xae: //contains
			needle=getText(state.pop());
			haystack=getText(state.pop());
			state.push(haystack.toLowerCase().indexOf(needle.toLowerCase())!=-1?1:0); //FIXME: verify this is 1 and not -1
			break;
		case 0xaf: //contains word
			needle=getText(state.pop());
			haystack=getText(state.pop());
			search=new RegExp("\\b"+needle+"\\b","i");
			state.push(search.test(haystack)?0xffff:0);
			break;
		case 0xb0: //bra
			delta=neg16(p.r16());
			p.seek(delta,p.cur);
			break;
		case 0xb1: //bra.b
			delta=neg8(p.r8());
			p.seek(delta,p.cur);
			break;
		case 0xb2: //beq
			delta=neg16(p.r16());
			b=state.pop();
			if (b!=0) p.seek(delta,p.cur);
			break;
		case 0xb3: //beq.b
			delta=neg8(p.r8());
			b=state.pop();
			if (b!=0) p.seek(delta,p.cur);
			break;
		case 0xb4: //bne
			delta=neg16(p.r16());
			b=state.pop();
			if (b==0) p.seek(delta,p.cur);
			break;
		case 0xb5: //bne.b
			delta=neg8(p.r8());
			b=state.pop();
			if (b==0) p.seek(delta,p.cur);
			break;
		case 0xb6: //call later
			rank=state.pop();
			func=state.pop();
			frames[0].saves.push({rank:rank,func:func});
			break;
		case 0xb7: //cancel call
			func=state.pop();
			for (i=0;i<frames[0].saves.length;i++)
				if (frames[0].saves[i].func==func)
					frames[0].saves[i].rank=0;
			break;
		case 0xb8: //cancel low priority
			hi=state.pop();
			for (i=0;i<frames[0].saves.length;i++)
				if (frames[0].saves[i].rank<=hi)
					frames[0].saves[i].rank=0;
			break;
		case 0xb9: //cancel high priority
			lo=state.pop();
			for (i=0;i<frames[0].saves.length;i++)
				if (frames[0].saves[i].rank>=lo)
					frames[0].saves[i].rank=0;
			break;
		case 0xba: //cancel priority range
			hi=state.pop();
			lo=state.pop();
			for (i=0;i<frames[0].saves.length;i++)
				if (frames[0].saves[i].rank>=lo &&
					frames[0].saves[i].rank<=hi)
					frames[0].saves[i].rank=0;
			break;
		case 0xbb: //fork
			newstate={state:new EngineState(),saves:[],p:[undefined]};
			newstate.curCtl=state.pop();
			newstate.curObj=state.pop();
			newstate.target=state.pop();
			newstate.ptx=state.pop();
			newstate.pty=state.pop();
			frames.unshift(newstate);
			if (resumeOne(true))
				return true;
			break;
		case 0xbc: //call
			id=state.pop();
			frames[0].p.unshift(undefined);
			if (loadFunc(id))
				return true;
			frames[0].p.shift();
			p=frames[0].p[0];
			break;
		case 0xbd: //open object
			obj=state.pop();
			queue.push({id:2,val:obj});
			break;
		case 0xbe: //swap objects
			swap={};
			swap.from=state.pop();
			swap.to=state.pop();
			queue.push({id:8,val:swap});
			swapObjects(swap);
			break;
		case 0xbf: //snap object
			queue.push({id:0xe,val:frames[0].curObj});
			break;
		case 0xc0: //toggle exits
			queue.push({id:0xd});
			break;
		case 0xc1: //print text
			id=state.pop();
			textQueue.push({id:3,val:[frames[0].target,frames[0].curObj,id]});
			break;
		case 0xc2: //print newline
			textQueue.push({id:2});
			break;
		case 0xc3: //print text+nl
			id=state.pop();
			textQueue.push({id:3,val:[frames[0].target,frames[0].curObj,id]});
			textQueue.push({id:2});
			break;
		case 0xc4: //print nl+text+nl
			id=state.pop();
			textQueue.push({id:2});
			textQueue.push({id:3,val:[frames[0].target,frames[0].curObj,id]});
			textQueue.push({id:2});
			break;
		case 0xc5: //print number
			id=state.pop();
			textQueue.push({id:1,val:id});
			break;
		case 0xc6: //push 2
			state.push(2);
			break;
		case 0xc7: //play sound in background
			obj=state.pop();
			soundQueue.push({id:1,val:obj});
			break;
		case 0xc8: //play sound and wait
			obj=state.pop();
			soundQueue.push({id:2,val:obj});
			break;
		case 0xc9: //wait for sound to finish?
			soundQueue.push({id:3});
			break;
		case 0xca: //get current time
			time=getTime();
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
			recurs=state.pop()!=0;
			obj=state.pop();
			fam=getFamily(obj,recurs);
			for (i=1;i<fam.length;i++)
				state.push(fam[i]);
			state.push(fam.length-1);
			break;
		case 0xcd: //get num children
			recurs=state.pop()!=0;
			obj=state.pop();
			fam=getFamily(obj,recurs);
			state.push(fam.length-1);
			break;
		case 0xce: //get engine version
			state.push(86);
			break;
		case 0xcf: //push scenario number
			state.push(3);
			break;
		case 0xd0: //push 1
			state.push(1);
			break;
		case 0xd1: //get object dimensions
			obj=state.pop();
			pt=getObjDims(obj);
			state.push(pt.h);
			state.push(pt.v);
			break;
		case 0xd2: //get overlap percent
			b=state.pop();
			a=state.pop();
			state.push(getOverlap(b,a));
			break;
		case 0xd3: //capture children
			obj=state.pop();
			captureChildren(obj);
			break;
		case 0xd4: //release children
			obj=state.pop();
			releaseChildren(obj);
			break;
		case 0xd5: //show speech dialog
			txt=state.pop();
			textEntry(txt,frames[0].curObj,frames[0].target);
			return true;
		case 0xd6: //activate command
			activateCommand(state.pop());
			break;
		case 0xd7: //lose game
			gameState=3;
			break;
		case 0xd8: //win game
			gameState=2;
			break;
		case 0xd9: //sleep
			len=state.pop();
			setTimeout(runMain,(len/60)*1000);
			return true;
		case 0xda: //click to continue
			updateScreen(false);
			clickToContinue();
			return true;
		case 0xdb: //run queue
			runQueue();
			break;
		case 0xdc: //run sound queue
			if (playSounds(true))
				return true;
			break;
		case 0xdd: //run text queue
			if (printTexts())
				return true;
			break;
		case 0xde: //update screen
			if (updateScreen(true))
				return true;
			break;
		case 0xdf: //flash main window
			len=state.pop();
			mainWin.invert();
			setTimeout(revertmain,(len/60)*1000);
			return true;
		case 0xe0: //cache graphic and object
			state.pop();
			break;
		case 0xe1: //cache sound
			state.pop();
			break;
		case 0xe2: //muldiv
			b=state.pop();
			a=state.pop();
			a*=b;
			c=state.pop();
			a/=c;
			state.push(a|0);
			break;
		case 0xe3: //update object
			obj=state.pop();
			updateObject(obj);
			break;
		case 0xe4: //currently playing event?
			state.push(0);
			break;
		case 0xe5: //wait for event to finish
			break;
		case 0xe6: //get fibonacci (joke)
			state.push(fib);
			break;
		case 0xe7: //calc fibonacci
			num=state.pop();
			y=1;
			fib=0;
			for (i=0;i<num;i++)
			{
				fib+=y;
				fib^=y; y^=fib; fib^=y;
			}
			break;
		default:
			fatal("Unknown function:"+ch.toString(16));
		}
	}
	return false;
}

function updateObject(obj)
{
	var w;
	if (get(1,0)==obj)
		w=mainWin;
	else
		w=getObjectWindow(obj);
	if (w)
	{
		focusObjWin(obj);
		runQueue();
		updateWindow(w);
	}
}

function revertmain()
{
	mainWin.invert();
	runMain();
}
