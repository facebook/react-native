--- /home/mganandraj/code/react-native-0.62.2/ReactAndroid/src/main/java/com/facebook/react/bridge/ReactBridge.java	2020-06-15 22:45:58.585487954 -0700
+++ /home/mganandraj/code/react-native-macos/ReactAndroid/src/main/java/com/facebook/react/bridge/ReactBridge.java	2020-06-15 23:32:29.375721209 -0700
@@ -31,6 +31,14 @@
     Systrace.beginSection(
         TRACE_TAG_REACT_JAVA_BRIDGE, "ReactBridge.staticInit::load:reactnativejni");
     ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_START);
+
+    SoLoader.loadLibrary("v8jsi");
+    SoLoader.loadLibrary("glog_init");
+    SoLoader.loadLibrary("fb");
+    SoLoader.loadLibrary("fbjni");
+    SoLoader.loadLibrary("yoga");
+    SoLoader.loadLibrary("jsinspector");
+
     SoLoader.loadLibrary("reactnativejni");
     ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_END);
     Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
