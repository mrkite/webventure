/********************** public functions *********************/
function draw(id,x,y,port,mode)
{
	var rect={top:0,left:0,width:0,height:0};
	var bmp;
	if (bmp=getGraphic(id*2+1))
	{
		rect={top:y,left:x,width:bmp.width,height:bmp.height};
		switch (mode)
		{
			case 1:
				bmp.bic(port,x,y);
				break;
			case 2:
				bmp.or(port,x,y);
				break;
		}
	}
	else if (bmp=getGraphic(id*2))
	{
		rect={top:y,left:x,width:bmp.width,height:bmp.height};
		switch (mode)
		{
			case 1:
				fillRect(port,x,y,bmp.width,bmp.height,0);
				break;
			case 2:
				fillRect(port,x,y,bmp.width,bmp.height,1);
				break;
		}
	}
	if (mode>0 && (bmp=getGraphic(id*2)))
		bmp.xor(port,x,y);
	return rect;
}

function fillRect(port,left,top,width,height,color)
{
	var ctx=port.get(0).getContext('2d');
	var image=ctx.getImageData(left,top,width,height);
	for (var y=0;y<height;y++)
	{
		var imgofs=y*image.width*4;
		var pix=color?0x00:0xff;
		for (var x=0;x<width;x++)
		{
			image.data[imgofs++]=pix;
			image.data[imgofs++]=pix;
			image.data[imgofs++]=pix;
			image.data[imgofs++]=0xff;
		}
	}
	ctx.putImageData(image,left,top);
}

/********************** private functions *********************/
