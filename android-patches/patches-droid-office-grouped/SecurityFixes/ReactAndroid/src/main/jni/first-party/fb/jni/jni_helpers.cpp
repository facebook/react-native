--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\first-party\\fb\\jni\\jni_helpers.cpp"	2020-01-30 13:55:48.472582000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\first-party\\fb\\jni\\jni_helpers.cpp"	2020-01-29 14:10:09.670923700 -0800
@@ -9,6 +9,7 @@
 #include <stddef.h>
 #include <cstdio>
 
+#include <fb/CRTSafeAPIs.h>
 #include <jni/jni_helpers.h>
 
 #define MSG_SIZE 1024
@@ -25,8 +26,8 @@
  * @return 0 on success; a negative value on failure
  */
 jint throwException(JNIEnv* pEnv, const char* szClassName, const char* szFmt, va_list va_args) {
-  char szMsg[MSG_SIZE];
-  vsnprintf(szMsg, MSG_SIZE, szFmt, va_args);
+  char szMsg[MSG_SIZE] = {0};
+  vsnprintf_safe(szMsg, MSG_SIZE, szFmt, va_args);
   jclass exClass = pEnv->FindClass(szClassName);
   return pEnv->ThrowNew(exClass, szMsg);
 }
