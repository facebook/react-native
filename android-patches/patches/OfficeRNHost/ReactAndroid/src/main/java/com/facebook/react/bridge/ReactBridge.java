--- /dev/code/rnm-66-fresh/ReactAndroid/src/main/java/com/facebook/react/bridge/ReactBridge.java	2022-02-13 19:54:48.563686391 -0800
+++ /dev/code/react-native-macos/ReactAndroid/src/main/java/com/facebook/react/bridge/ReactBridge.java	2022-02-13 22:53:50.732054489 -0800
@@ -31,6 +31,27 @@
     Systrace.beginSection(
         TRACE_TAG_REACT_JAVA_BRIDGE, "ReactBridge.staticInit::load:reactnativejni");
     ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_START);
+
+    // JS Engine is configurable.. And we exepct only one packaged
+    // Hence ignore failure
+    try {
+	SoLoader.loadLibrary("hermes");
+    }catch (UnsatisfiedLinkError jscE){}
+
+    try {
+	SoLoader.loadLibrary("v8jsi");
+    }catch (UnsatisfiedLinkError jscE){}
+
+    SoLoader.loadLibrary("glog");
+    SoLoader.loadLibrary("glog_init");
+    SoLoader.loadLibrary("fb");
+    SoLoader.loadLibrary("fbjni");
+    SoLoader.loadLibrary("yoga");
+    SoLoader.loadLibrary("folly_json");
+    SoLoader.loadLibrary("reactperfloggerjni");
+    SoLoader.loadLibrary("jsinspector");
+    SoLoader.loadLibrary("jsi");
+    SoLoader.loadLibrary("logger");
     SoLoader.loadLibrary("reactnativejni");
     ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_END);
     Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
