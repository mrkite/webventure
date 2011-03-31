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

/********************** private functions *********************/
