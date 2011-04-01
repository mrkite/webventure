/********************** public functions *********************/
var startImage;	//the icom splash img object
var textLH=15; //line height of text window
function initialize()
{
	var link=document.createElement('link');
	link.type="text/css";
	link.rel="stylesheet"
	link.href="mac.css";
	$('head').append(link);
	startImage=$(document.createElement('img'));
	startImage.attr('src','images/mac/start.png');
	startImage.css('width','100%');
	startImage.css('height','100%');
	desktop.append(startImage);

	setTimeout(waitForLoad,10);
}

//convert mac string to valid string
function toascii(str)
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

/********************** private functions *********************/
