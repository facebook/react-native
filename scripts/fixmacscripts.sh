#!/bin/sh

# npm publish is currently performed on Windows build agents and loses the executable bit on files.
# restore the executable bit during npm postinstall

echo "Fixing the executable bit on macOS scripts"

find . -iname \*.sh -exec chmod +x {} \;
find . -iname \*.command -exec chmod +x {} \;
