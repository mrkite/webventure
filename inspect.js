var desktop;
//initialize screen and determine platform
$(document).ready(function(){
	desktop=$(document.createElement('div'));
	desktop.addClass('screen');
	$('script[src="inspect.js"]').after(desktop);

	if (gamename.match(/\.dsk$/)) //macintosh
		$.getScript("inspect_mac.js");
	else if (gamename.match(/\.2mg$/)) //IIgs
		$.getScript("inspect_gs.js");
	else
		fatal("Unknown disk type");
});
function fatal(err)
{
//	desktop.html('<h3>'+err+'</h3>');
	throw err;
}
