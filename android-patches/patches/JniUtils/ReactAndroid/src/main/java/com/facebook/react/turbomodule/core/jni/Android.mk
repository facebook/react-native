--- /dev/code/rnm-66-fresh/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni/Android.mk	2022-02-13 19:54:48.579686559 -0800
+++ /dev/code/react-native-macos/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni/Android.mk	2022-02-13 19:53:04.134612248 -0800
@@ -19,7 +19,7 @@
 
 LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall
 
-LOCAL_SHARED_LIBRARIES = libfb libfbjni libreactnativeutilsjni libruntimeexecutor
+LOCAL_SHARED_LIBRARIES = libfb libfbjni libreactnativejni libruntimeexecutor
 
 LOCAL_STATIC_LIBRARIES = libcallinvoker libreactperfloggerjni
 
