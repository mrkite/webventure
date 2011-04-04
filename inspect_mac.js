var Modules=[
	"mac/mac.js",
	"mac/files.js",
	"mac/graphics.js",
	"mac/resources.js",
	"mac/sound.js",
	"files.js",
	"graphics.js",
	"sound.js",
	"text.js",
	"objects.js",
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
