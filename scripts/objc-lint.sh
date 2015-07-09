#!/bin/bash

brew cask install Caskroom/cask/oclint

xctool -project ../Examples/UIExplorer/UIExplorer.xcodeproj \
        -scheme UIExplorer -sdk iphonesimulator \
        -destination 'platform=iOS Simulator,name=iPhone 5,OS=8.4' \
        -reporter json-compilation-database:compile_commands.json \
  clean build

# http://docs.oclint.org/en/dev/customizing/rules.html
oclint-json-compilation-database compile_commands.json -- -rc LONG_LINE=200 CYCLOMATIC_COMPLEXITY=25
