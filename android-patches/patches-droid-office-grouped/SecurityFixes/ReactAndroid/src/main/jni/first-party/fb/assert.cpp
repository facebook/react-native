--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\first-party\\fb\\assert.cpp"	2020-01-29 14:11:26.473527800 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\first-party\\fb\\assert.cpp"	2020-01-29 14:10:09.654914600 -0800
@@ -9,6 +9,7 @@
 #include <stdio.h>
 
 #include <fb/assert.h>
+#include <fb/CRTSafeAPIs.h>
 #include <fb/log.h>
 
 namespace facebook {
@@ -20,7 +21,7 @@
 void assertInternal(const char* formatstr ...) {
     va_list va_args;
     va_start(va_args, formatstr);
-    vsnprintf(sAssertBuf, sizeof(sAssertBuf), formatstr, va_args);
+    vsnprintf_safe(sAssertBuf, sizeof(sAssertBuf), formatstr, va_args);
     va_end(va_args);
     if (gAssertHandler != NULL) {
         gAssertHandler(sAssertBuf);
