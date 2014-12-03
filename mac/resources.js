/********************** public functions *********************/

function openResources()
{
	var main;
	for (var i=1;main==undefined && i<5;i++)
		main=getKind('APPL','MCV'+i);
	for (var i=1;main==undefined && i<5;i++)
		main=getKind('APPL','MCv'+i);
	openRes(main);
}
function openRes(res)
{
	resources.push(res);
	return resources.length-1;
}
function closeRes(id)
{
	delete resources[id];
	resources.splice(id,1);
}

// name of default save game
function resGetUntitled()
{
	return resGetIndStr(0x80,1);
}

// get name of start game
function resGetDefault()
{
	return resGetString(0x85);
}

function getRes(type,id)
{
	var resnum=(type.charCodeAt(0)<<24)|
		(type.charCodeAt(1)<<16)|
		(type.charCodeAt(2)<<8)|
		type.charCodeAt(3);
	for (var r=resources.length-1;r>=0;r--)
	{
		var res=resources[r];
		res.seek(0,res.set);
		var dataOfs=res.r32();
		var mapOfs=res.r32();
		res.seek(mapOfs+24,res.set);
		var typelist=mapOfs+res.r16();
		res.seek(typelist,res.set);
		var numtypes=res.r16()+1;
		for (var i=0;i<numtypes;i++)
		{
			var typ=res.r32();
			if (typ==resnum)
			{
				var numres=res.r16()+1;
				res.seek(typelist+res.r16(),res.set);
				for (i=0;i<numres;i++)
				{
					var resid=res.r16();
					if (resid==id)
					{
						res.seek(2,res.cur);
						dataOfs+=res.r32()&0xffffff;
						res.seek(dataOfs,res.set);
						var len=res.r32();
						return new GFile(res.read(len));
					}
					res.seek(10,res.cur);
				}
				return undefined;
			}
			res.seek(4,res.cur);
		}
	}
	return undefined;
}

function resGetString(resid)
{
	var res=getRes('STR ',resid);
	if (res==undefined) return '';
	var len=res.r8();
	return res.read(len);
}

function resGetIndStr(resid,index)
{
	if (index==0) return '';
	var res=getRes('STR#',resid);
	if (res==undefined) return '';
	var num=res.r16();
	if (index>num) return '';
	while (true)
	{
		index--;
		if (index==0)
		{
			var len=res.r8();
			return res.read(len);
		}
		var len=res.r8();
		res.seek(len,res.cur);
	}
}

function getCtl(res)
{
	var top=res.r16();
	var left=res.r16();
	var height=res.r16()-top;
	var width=res.r16()-left;
	var value=res.r16();
	var vis=res.r8();
	res.r8();
	var max=res.r16();
	var min=res.r16();
	var cdef=res.r16();
	var refcon=res.r32();
	var titleLen=res.r8();
	var title='';
	if (titleLen!=0)
		title=res.read(titleLen);
	var opts=[];
	var type=0;
	switch (cdef>>4)
	{
		case 0x00: //button
			type=0xa;
			opts=[title];
			break;
		case 0x80: //custom buttom
			type=0x19;
			opts=[title];
			break;
	}
	return createCtl([left,top,width,height],refcon,type,opts);
}


/********************** private functions *********************/
var resources=[];
