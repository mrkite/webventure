#!/bin/sh

# This is the path to the Closure Compiler from http://code.google.com/closure/compiler/
COMPILER=~/compiler.jar

java -jar $COMPILER --js=webventure.js --js=windows.js --js=files.js --js=graphics.js --js=objects.js --js=text.js --js=engine.js --js=resource.js --js=controls.js --js=sounds.js --js=menus.js --js=last.js --js_output_file=webventure_min.js

echo "Webventure compiled, webventure_min.js created"
