--- "D:\\code\\work\\react-native-fb61merge-dirty-base\\ReactAndroid\\src\\main\\jni\\react\\jni\\JReactMarker.cpp"	2020-04-27 19:36:21.764740900 -0700
+++ "D:\\code\\work\\react-native-fb61merge-dirty\\ReactAndroid\\src\\main\\jni\\react\\jni\\JReactMarker.cpp"	2020-04-27 21:01:59.685199700 -0700
@@ -63,6 +63,15 @@
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
   }
 }
 
