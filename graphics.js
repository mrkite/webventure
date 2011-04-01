/********************** public functions *********************/

function getGraphic(id)
{
	var gfx=getObject(3,id);
	if (gfx.length<2) return undefined;
	if (gfx.length==2)
	{
		var next=((gfx.charCodeAt(0)&0xff)<<8)|
			(gfx.charCodeAt(1)&0xff);
		return getGraphic(next);
	}
	return decodePPIC(new GFile(gfx));
}

function fill(port,color)
{
	fillRect(port,0,0,port.width(),port.height(),color);
}

/********************** private functions *********************/
