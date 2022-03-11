--- /dev/code/rnm-66-fresh/ReactAndroid/src/main/jni/react/jni/Android.mk	2022-02-13 19:54:48.595686727 -0800
+++ /dev/code/react-native-macos/ReactAndroid/src/main/jni/react/jni/Android.mk	2022-02-13 19:53:07.962650850 -0800
@@ -77,7 +77,7 @@
 LOCAL_LDLIBS += -landroid
 
 # The dynamic libraries (.so files) that this module depends on.
-LOCAL_SHARED_LIBRARIES := libreactnativeutilsjni libfolly_json libfb libfbjni libglog_init libyoga logger
+LOCAL_SHARED_LIBRARIES := libreactnativejni libfolly_json libfb libfbjni libglog_init libyoga logger
 
 # The static libraries (.a files) that this module depends on.
 LOCAL_STATIC_LIBRARIES := libreactnative libruntimeexecutor libcallinvokerholder
