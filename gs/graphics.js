/********************** public functions *********************/

function draw(id,x,y,port,mode)
{
	var rect={top:0,left:0,width:0,height:0};
	var bmp;
	if (bmp=getGraphic(id*2))
	{
		rect={top:y,left:x,width:bmp.width,height:bmp.height};
		switch (mode)
		{
			case 1:
				bmp.draw(port,x,y);
				break;
			case 2:
				bmp.inv(port,x,y);
				break;
		}
	}
	return rect;
}

function fillRect(port,left,top,width,height,color)
{
	var ctx=port.get(0).getContext('2d');
	var image=ctx.getImageData(left,top,width,height);
	for (var y=0;y<height;y++)
	{
		var imgofs=y*image.width*4;
		for (var x=0;x<width;x++)
		{
			var pix=((color>>(4*(x&3)))&0xf)*3;
			image.data[imgofs++]=palette[pix++];
			image.data[imgofs++]=palette[pix++];
			image.data[imgofs++]=palette[pix++];
			image.data[imgofs++]=0xff;
		}
	}
	ctx.putImageData(image,left,top);
}

/********************** private functions *********************/
