var Modules=[
	"mac/mac.js",
	"mac/files.js"
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
