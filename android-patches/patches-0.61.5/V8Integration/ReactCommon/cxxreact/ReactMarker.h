--- "D:\\code\\work\\react-native-fb61merge-dirty-base\\ReactCommon\\cxxreact\\ReactMarker.h"	2020-04-27 19:36:21.885709100 -0700
+++ "D:\\code\\work\\react-native-fb61merge-dirty\\ReactCommon\\cxxreact\\ReactMarker.h"	2020-04-27 19:57:54.186846600 -0700
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
