var startImage;
function initialize()
{
	var link=document.createElement('link');
	link.type="text/css";
	link.rel="stylesheet";
	link.href="gs.css";
	$('head').append(link);
	startImage=$(document.createElement('img'));
	startImage.attr('src','images/gs/start.png');
	startImage.css('width','100%');
	startImage.css('height','100%');
	screen.append(startImage);
}
