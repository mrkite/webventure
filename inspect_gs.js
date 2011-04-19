var Modules=[
	"gs/gs.js",
	"gs/files.js",
	"gs/graphics.js",
	"gs/resources.js",
	"gs/sound.js",
	"files.js",
	"graphics.js",
	"sound.js",
	"inspect_text.js",
	"objects.js",
	"inspect_disasm.js",
	"inspect_main.js"
];
var loadedModules=0;
for (var i in Modules)
{
	$.getScript(Modules[i],function() {
		if (++loadedModules==Modules.length)
			initialize();
	});
}
