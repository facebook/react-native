--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\OnLoad.cpp"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\OnLoad.cpp"	2020-01-29 14:10:09.469888200 -0800
@@ -0,0 +1,50 @@
+//  Copyright (c) Facebook, Inc. and its affiliates.
+//
+// This source code is licensed under the MIT license found in the
+ // LICENSE file in the root directory of this source tree.
+
+#include <react/jni/JavaScriptExecutorHolder.h>
+#include <react/jni/JReactMarker.h>
+#include <react/jni/ReadableNativeMap.h>
+
+#include "V8ExecutorFactory.h"
+
+namespace facebook {
+namespace react {
+
+// This is not like JSCJavaScriptExecutor, which calls JSC directly.  This uses
+// JSIExecutor with V8Runtime.
+class V8ExecutorHolder
+    : public jni::HybridClass<V8ExecutorHolder, JavaScriptExecutorHolder> {
+ public:
+  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/v8executor/V8Executor;";
+
+  static jni::local_ref<jhybriddata> initHybrid(
+      jni::alias_ref<jclass>, ReadableNativeMap* v8Config) {
+    // This is kind of a weird place for stuff, but there's no other
+    // good place for initialization which is specific to JSC on
+    // Android.
+    JReactMarker::setLogPerfMarkerIfNeeded();
+    // TODO mhorowitz T28461666 fill in some missing nice to have glue
+    return makeCxxInstance(folly::make_unique<jsi::V8ExecutorFactory>(v8Config->consume()));
+  }
+
+  static void registerNatives() {
+    registerHybrid({
+      makeNativeMethod("initHybrid", V8ExecutorHolder::initHybrid),
+    });
+  }
+
+ private:
+  friend HybridBase;
+  using HybridBase::HybridBase;
+};
+
+} // namespace react
+} // namespace facebook
+
+JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* reserved) {
+  return facebook::jni::initialize(vm, [] {
+      facebook::react::V8ExecutorHolder::registerNatives();
+  });
+}
\ No newline at end of file
