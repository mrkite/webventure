/********************** public functions *********************/

function loadGame(root)
{
	$.ajax({
		url:root,
		beforeSend: function(xhr) {
			xhr.overrideMimeType('text/html; charset=x-user-defined');
		},
		complete: function(xhr) {
			var img=new GFile(xhr.responseText);
			if (img.r4()!="2IMG")
				fatal("Not a valid 2mg file");
			img.seek(0xc,img.set);
			if (img.r32le()!=1)
				fatal("Not in ProDOS format");
			img.seek(0x14,img.set);
			var len=img.r32le()*512;
			var offset=img.r32le();
			img.seek(offset,img.set);
			disk=new GFile(img.read(len));
			delete img;
		}
	});
}
function gameLoaded()
{
	return disk!=undefined;
}

/********************** private functions *********************/

var disk=undefined;

