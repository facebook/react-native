## Using React-Native's CLI to package a Java Script Asset Bundle

React Native is distributed as two npm packages, `react-native-cli` and `react-native`. The first one is a lightweight package that should be installed globally (`npm install -g react-native-cli`), while the second one contains the actual React Native framework code and is installed locally into your project when you run `react-native init`.

`react-native init` is a CLI utility that stands up a React Native project environment for both Android and iOS. The React Native Windows team will add Visual Studio support for UWP builds. 

### Creating a Javascript Bundle File

Run this to setup react native CLI

    $ npm install -g react-native-cli
    $ cd {REACT_NATIVE_CWD}/windows-packager
    $ npm install
    
Your bundles entry point file(<entry-file>) needs to be named as either index.ios.js or index.android.js. We have an open issue to enhance RN to support index.windows.js named files. 

    $ react-native bundle --dev false --entry-file <entry-file> --bundle-output <main.jsbundle>
