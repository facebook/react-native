# react-native-info

This package is intended to be used as a part of [creating issues](https://reactnative.dev/contributing/how-to-file-an-issue) with the [React Native](https://reactnative.dev/) project. It provides accurate information about your system, and helps our team triage and debug issues.

## Usage

```
$ cd YourProject
$ npx react-native-info@latest
info Fetching system and libraries information...
System:
  OS: macOS 14.4.1
  CPU: (10) arm64 Apple M1 Pro
  Memory: 527.52 MB / 32.00 GB
  Shell:
    version: "5.9"
    path: /bin/zsh
Binaries:
  Node:
    version: 20.12.0
...
```

## Notes
This is built upon the work of the [React Native Community CLI](https://github.com/react-native-community/cli#react-native-cli) 🎉.
