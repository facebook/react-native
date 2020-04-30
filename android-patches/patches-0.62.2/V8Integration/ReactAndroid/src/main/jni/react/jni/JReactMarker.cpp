--- "D:\\code\\work\\rn-62-db\\ReactAndroid\\src\\main\\jni\\react\\jni\\JReactMarker.cpp"	2020-04-30 15:18:42.261526400 -0700
+++ "D:\\code\\work\\rn-62-d\\ReactAndroid\\src\\main\\jni\\react\\jni\\JReactMarker.cpp"	2020-04-30 15:37:35.633614200 -0700
@@ -70,6 +70,16 @@
     case ReactMarker::NATIVE_REQUIRE_STOP:
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
+
   }
 }
 
