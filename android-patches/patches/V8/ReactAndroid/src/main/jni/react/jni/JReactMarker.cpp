--- ./ReactAndroid/src/main/jni/react/jni/JReactMarker.cpp	2021-11-08 14:22:26.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/V8/ReactAndroid/src/main/jni/react/jni/JReactMarker.cpp	2022-01-12 15:04:31.000000000 -0800
@@ -92,6 +92,15 @@
     case ReactMarker::REACT_INSTANCE_INIT_STOP:
       // These are not used on Android.
       break;
+    case ReactMarker::BYTECODE_CREATION_FAILED:
+      JReactMarker::logMarker("BYTECODE_CREATION_FAILED");
+      break;
+    case ReactMarker::BYTECODE_READ_FAILED:
+      JReactMarker::logMarker("BYTECODE_READ_FAILED", tag);
+      break;
+    case ReactMarker::BYTECODE_WRITE_FAILED:
+      JReactMarker::logMarker("BYTECODE_WRITE_FAILED");
+      break;
   }
 }
 
