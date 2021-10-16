--- "E:\\gh\\react-native-macos2\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\ReactBridge.java"	2021-10-12 13:35:49.124099000 -0700
+++ "E:\\gh\\react-native-macos\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\ReactBridge.java"	2021-10-12 13:22:46.508704400 -0700
@@ -31,6 +31,25 @@
     Systrace.beginSection(
         TRACE_TAG_REACT_JAVA_BRIDGE, "ReactBridge.staticInit::load:reactnativejni");
     ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_START);
+
+    // JS Engine is configurable .. And we expect only one packaged.
+    // Hence ignore failure.
+
+    try {
+      SoLoader.loadLibrary("hermes");
+    } catch (UnsatisfiedLinkError jscE) {}
+
+    try {
+      SoLoader.loadLibrary("v8jsi");
+    } catch (UnsatisfiedLinkError jscE) {}
+    
+    SoLoader.loadLibrary("glog_init");
+    SoLoader.loadLibrary("fb");
+    SoLoader.loadLibrary("fbjni");
+    SoLoader.loadLibrary("yoga");
+    SoLoader.loadLibrary("jsinspector");
+    SoLoader.loadLibrary("libreactnativeutilsjni");
+
     SoLoader.loadLibrary("reactnativejni");
     ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_END);
     Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
