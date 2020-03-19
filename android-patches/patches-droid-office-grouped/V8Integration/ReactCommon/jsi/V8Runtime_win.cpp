--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\jsi\\V8Runtime_win.cpp"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\jsi\\V8Runtime_win.cpp"	2020-01-29 14:10:09.827891300 -0800
@@ -0,0 +1,29 @@
+//  Copyright (c) Facebook, Inc. and its affiliates.
+//
+// This source code is licensed under the MIT license found in the
+ // LICENSE file in the root directory of this source tree.
+
+#include "V8Runtime.h"
+#include "V8Runtime_impl.h"
+
+namespace facebook { namespace v8runtime {
+
+  V8Runtime::V8Runtime() {
+    // Not to be called on Windows.
+    std::abort();
+  }
+
+  V8Runtime::V8Runtime(const folly::dynamic& v8Config, const std::shared_ptr<Logger>& logger) : V8Runtime() {
+    // Not to be called on Windows.
+    std::abort();
+  }
+
+  jsi::Value V8Runtime::ExecuteString(const v8::Local<v8::String>& source, const std::string& sourceURL) {
+    // Not to be called on windows.
+    std::abort();
+  }
+
+  std::unique_ptr<jsi::Runtime> makeV8Runtime(const folly::dynamic& v8Config, const std::shared_ptr<Logger>& logger) {
+    return std::make_unique<V8Runtime>(v8Config, logger);
+  }
+}} // namespace facebook::v8runtime
