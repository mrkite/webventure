#!/bin/sh

# This is the path to the Closure Compiler from http://code.google.com/closure/compiler/
COMPILER=~/compiler.jar

java -jar $COMPILER --warning_level VERBOSE --compilation_level SIMPLE_OPTIMIZATIONS --js webventure.js --js windows.js --js files.js --js graphics.js --js objects.js --js text.js --js engine.js --js resource.js --js controls.js --js sounds.js --js menus.js --js last.js --externs externs.js --externs jquery_externs.js --js_output_file webventure_min.js

echo "Webventure compiled, webventure_min.js created"
