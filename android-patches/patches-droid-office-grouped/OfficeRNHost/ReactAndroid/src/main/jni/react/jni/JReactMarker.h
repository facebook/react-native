--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\react\\jni\\JReactMarker.h"	2020-01-30 13:55:48.479581200 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\react\\jni\\JReactMarker.h"	2020-01-29 14:10:09.679889700 -0800
@@ -13,10 +13,14 @@
 namespace facebook {
 namespace react {
 
+#ifndef RN_EXPORT
+#define RN_EXPORT __attribute__((visibility("default")))
+#endif
+
 class JReactMarker : public facebook::jni::JavaClass<JReactMarker> {
 public:
   static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/ReactMarker;";
-  static void setLogPerfMarkerIfNeeded();
+  static RN_EXPORT void setLogPerfMarkerIfNeeded();
 
 private:
   static void logMarker(const std::string& marker);
