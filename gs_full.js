var Modules=[
	"gs/gs.js",
	"gs/files.js",
	"gs/graphics.js",
	"gs/resources.js",
	"gs/windows.js",
	"gs/menus.js",
	"files.js",
	"init.js",
	"main.js",
	"graphics.js",
	"menus.js",
	"windows.js",
	"engine.js",
	"controls.js",
	"text.js",
	"objects.js"
];
var loadedModules=0;
for (var i in Modules)
{
	$.getScript(Modules[i],function()
	{
		if (++loadedModules==Modules.length)
			initialize();
	});
}
