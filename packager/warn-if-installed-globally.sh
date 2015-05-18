#!/bin/bash

npm list -g react-native &>/dev/null

if [ $? -eq 0 ]; then
  echo "WARNING: Looks like you installed react-native globally, did you mean react-native-cli?"
fi

exit 0
