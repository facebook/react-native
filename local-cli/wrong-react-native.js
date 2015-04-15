#!/usr/bin/env node
console.error([
  '\033[31mLooks like you installed react-native globally, maybe you meant react-native-cli?',
  'To fix the issue, run:\033[0m',
  'npm uninstall -g react-native',
  'npm install -g react-native-cli'
].join('\n'));
