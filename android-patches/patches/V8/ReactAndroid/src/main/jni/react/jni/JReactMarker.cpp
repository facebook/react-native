--- "E:\\github\\rnm-63-fresh\\ReactAndroid\\src\\main\\jni\\react\\jni\\JReactMarker.cpp"	2020-10-27 20:26:17.027172300 -0700
+++ "E:\\github\\rnm-63\\ReactAndroid\\src\\main\\jni\\react\\jni\\JReactMarker.cpp"	2020-10-13 21:51:47.447172900 -0700
@@ -75,6 +75,15 @@
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
 
