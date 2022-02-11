REM node %~dp0\..\bundle\bundle.js diff %~dp0\..\.. E:\github\fb-rn-p --patch-name patches

REM node %~dp0\..\bundle\bundle.js diff %~dp0\..\.. E:\github\fb-rn-p --patch-name DynamicFromObject --whitelist-dirs ReactAndroid\src\main\java\com\facebook\react\bridge\

REM node %~dp0\..\bundle\bundle.js diff %~dp0\..\.. E:\github\ms-react-native-minus --patch-name TextInputJS --whitelist-dirs Libraries\Components\TextInput\

REM node ./android-patches/bundle/bundle.js diff . ../rn-macos-fb62merge-fresh --patch-name Focus --whitelist-dirs ReactAndroid/src/main/java/com/facebook/react/views/view/

node ./android-patches/bundle/bundle.js diff . ../rnm-63-fresh --patch-name V8 --whitelist-dirs ReactAndroid\src\main\java\com\facebook\react\v8executor\,ReactCommon\cxxreact\ReactMarker.h,ReactAndroid\src\main\jni\third-party\v8jsi\Android.mk,ReactAndroid\src\main\java\com\facebook\react\ReactInstanceManagerBuilder.java,ReactAndroid\src\main\java\com\facebook\react\bridge\ReactMarkerConstants.java,ReactAndroid\src\main\jni\react\jni\JReactMarker.cpp

node ./android-patches/bundle/bundle.js diff . ../rnm-63-fresh --patch-name OfficeRNHost --whitelist-dirs ReactCommon,ReactAndroid\src\main\jni\react\jni\,ReactAndroid\src\main\java\com\facebook\react\ReactInstanceManager.java,ReactAndroid\src\main\java\com\facebook\react\bridge\

node ./android-patches/bundle/bundle.js diff . ../rnm-63-fresh --patch-name Focus --whitelist-dirs ReactAndroid\src\main\java\com\facebook\react\views\view\,Libraries\Components\View\ReactNativeViewViewConfigAndroid.js

node ./android-patches/bundle/bundle.js diff . ../rnm-63-fresh --patch-name Build --whitelist-dirs ReactAndroid\build.gradle,ReactAndroid\gradle.properties,ReactAndroid\NuGet.Config,ReactAndroid\packages.config,ReactAndroid\ReactAndroid.nuspec,ReactAndroid\src\main\jni\third-party\boost\Android.mk