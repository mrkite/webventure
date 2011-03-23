/**
 * @constructor
 */
function ResourceManager(files)
{
	var self=this;
	var resources=[];
	this.open=function(res)
	{
		resources.push(res);
		return resources.length-1;
	}
	this.close=function(resid)
	{
		resources.splice(resid,1);
	}
	this.get=function(type,id)
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
	this.getString=function(resid)
	{
		var res=self.get('STR ',resid);
		if (res==undefined) return '';
		var len=res.r8();
		return res.read(len);
	}
	this.getIndStr=function(resid,index)
	{
		if (index==0) return '';
		var res=self.get('STR#',resid);
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
}
