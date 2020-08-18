REM node %~dp0\..\bundle\bundle.js diff %~dp0\..\.. E:\github\fb-rn-p --patch-name patches

REM node %~dp0\..\bundle\bundle.js diff %~dp0\..\.. E:\github\fb-rn-p --patch-name DynamicFromObject --whitelist-dirs ReactAndroid\src\main\java\com\facebook\react\bridge\

REM node %~dp0\..\bundle\bundle.js diff %~dp0\..\.. E:\github\ms-react-native-minus --patch-name TextInputJS --whitelist-dirs Libraries\Components\TextInput\

node ./android-patches/bundle/bundle.js diff . ../rn-macos-fb62merge-fresh --patch-name Focus --whitelist-dirs ReactAndroid/src/main/java/com/facebook/react/views/view/
