var Modules=[
	"gs/gs.js",
	"gs/files.js"
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
