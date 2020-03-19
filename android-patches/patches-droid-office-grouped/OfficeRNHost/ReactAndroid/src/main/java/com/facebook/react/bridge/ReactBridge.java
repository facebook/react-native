--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\ReactBridge.java"	2020-01-30 13:55:48.274578500 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\ReactBridge.java"	2020-02-20 11:21:17.368516500 -0800
@@ -28,6 +28,14 @@
     sLoadStartTime = SystemClock.uptimeMillis();
     Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "ReactBridge.staticInit::load:reactnativejni");
     ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_START);
+
+    SoLoader.loadLibrary("v8_libbase.cr");
+    SoLoader.loadLibrary("v8_libplatform.cr");
+    SoLoader.loadLibrary("v8.cr");
+
+    SoLoader.loadLibrary("glog_init");
+    SoLoader.loadLibrary("fb");
+    SoLoader.loadLibrary("yoga");
     SoLoader.loadLibrary("reactnativejni");
     ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_END);
     Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
@@ -41,4 +49,4 @@
   public static long getLoadEndTime() {
     return sLoadEndTime;
   }
-}
+}
\ No newline at end of file
