var Modules=[
	"mac/mac.js",
	"mac/files.js",
	"mac/graphics.js",
	"mac/resources.js",
	"mac/menus.js",
	"files.js",
	"init.js",
	"main.js",
	"graphics.js",
	"menus.js",
	"windows.js"
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
