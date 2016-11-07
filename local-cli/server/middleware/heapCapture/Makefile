SHELL := /bin/bash

all:
	NODE_PATH="../../../../node_modules/" babel --presets babel-preset-react-native --source-maps inline -d out src
	for f in out/*.js; do echo -e "\n// @generated" >> $$f; done

watch:
	NODE_PATH="../../../../node_modules/" babel --watch --presets babel-preset-react-native -d out src
