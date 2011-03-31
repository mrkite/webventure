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

/********************** private functions *********************/
