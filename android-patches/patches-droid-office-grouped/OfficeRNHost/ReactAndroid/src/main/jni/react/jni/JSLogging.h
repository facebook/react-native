--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\react\\jni\\JSLogging.h"	2020-01-30 13:55:48.481580100 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\react\\jni\\JSLogging.h"	2020-01-29 14:10:09.679889700 -0800
@@ -11,12 +11,17 @@
 namespace facebook {
 namespace react {
 
-void reactAndroidLoggingHook(
-    const std::string& message,
-    android_LogPriority logLevel);
-void reactAndroidLoggingHook(
-    const std::string& message,
-    unsigned int logLevel);
+#ifndef RN_EXPORT
+#define RN_EXPORT __attribute__((visibility("default")))
+#endif
+
+void RN_EXPORT reactAndroidLoggingHook(
+  const std::string& message,
+  android_LogPriority logLevel);
+
+void RN_EXPORT reactAndroidLoggingHook(
+  const std::string& message,
+  unsigned int logLevel);
 
 } // namespace react
 } // namespace facebook
