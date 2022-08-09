--- ./ReactAndroid/src/main/java/com/facebook/react/bridge/ReactMarkerConstants.java	2022-01-11 17:41:29.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/V8/ReactAndroid/src/main/java/com/facebook/react/bridge/ReactMarkerConstants.java	2022-01-12 17:07:55.000000000 -0800
@@ -115,6 +115,9 @@
   FABRIC_BATCH_EXECUTION_END,
   FABRIC_UPDATE_UI_MAIN_THREAD_START,
   FABRIC_UPDATE_UI_MAIN_THREAD_END,
+  BYTECODE_CREATION_FAILED,
+  BYTECODE_READ_FAILED,
+  BYTECODE_WRITE_FAILED,
   // New markers used by bridge and bridgeless loading below this line
   REACT_BRIDGE_LOADING_START,
   REACT_BRIDGE_LOADING_END,
