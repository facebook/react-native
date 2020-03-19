REM node %~dp0\..\bundle\bundle.js diff %~dp0\..\.. E:\github\fb-rn-p --patch-name patches

REM node %~dp0\..\bundle\bundle.js diff %~dp0\..\.. E:\github\fb-rn-p --patch-name DynamicFromObject --whitelist-dirs ReactAndroid\src\main\java\com\facebook\react\bridge\

node %~dp0\..\bundle\bundle.js diff %~dp0\..\.. E:\github\ms-react-native-minus --patch-name TextInputJS --whitelist-dirs Libraries\Components\TextInput\
