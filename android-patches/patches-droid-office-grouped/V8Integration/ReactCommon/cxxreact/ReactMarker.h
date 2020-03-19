--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\cxxreact\\ReactMarker.h"	2020-01-30 13:55:48.522580900 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\cxxreact\\ReactMarker.h"	2020-01-29 14:10:09.753923200 -0800
@@ -24,7 +24,10 @@
   NATIVE_MODULE_SETUP_START,
   NATIVE_MODULE_SETUP_STOP,
   REGISTER_JS_SEGMENT_START,
-  REGISTER_JS_SEGMENT_STOP
+  REGISTER_JS_SEGMENT_STOP,
+  BYTECODE_CREATION_FAILED,
+  BYTECODE_READ_FAILED,
+  BYTECODE_WRITE_FAILED
 };
 
 #ifdef __APPLE__
