--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\react\\jni\\JReactMarker.cpp"	2020-01-30 13:55:48.479581200 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\react\\jni\\JReactMarker.cpp"	2020-01-29 14:10:09.678890000 -0800
@@ -53,6 +53,15 @@
     case ReactMarker::NATIVE_MODULE_SETUP_STOP:
       JReactMarker::logMarker("NATIVE_MODULE_SETUP_END", tag);
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
     case ReactMarker::REGISTER_JS_SEGMENT_START:
       JReactMarker::logMarker("REGISTER_JS_SEGMENT_START", tag);
       break;
