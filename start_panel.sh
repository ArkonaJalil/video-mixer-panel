#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONFIGPATH="$1"
if [ -z "$CONFIGPATH" ]; then
  echo "You need to specify the path to your config file"
  exit 1
fi
tsc -p tsconfig.json
node .dist/panel_script.js "$CONFIGPATH"
