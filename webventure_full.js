var Modules=[
	"macventure.js",
	"windows.js",
	"files.js",
	"graphics.js",
	"objects.js",
	"text.js",
	"engine.js",
	"resource.js",
	"controls.js",
	"sounds.js",
	"menus.js"
];
var loadedModules=0;
for (var i in Modules)
{
	$.getScript(Modules[i],function()
	{
		if (++loadedModules==Modules.length)
			webventure.init();
	});
}
