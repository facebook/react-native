--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\jsi\\V8Runtime.h"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\jsi\\V8Runtime.h"	2020-01-29 14:10:09.825892100 -0800
@@ -0,0 +1,67 @@
+//  Copyright (c) Facebook, Inc. and its affiliates.
+//
+// This source code is licensed under the MIT license found in the
+ // LICENSE file in the root directory of this source tree.
+
+#pragma once
+
+#include <memory>
+#include <jsi/jsi.h>
+
+namespace facebook {
+  namespace react {
+    class MessageQueueThread;
+  }
+}
+
+namespace v8 {
+  template <class T> class Local;
+  class Context;
+  class Platform;
+  class Isolate;
+}
+
+namespace folly {
+  struct dynamic;
+}
+
+namespace facebook {
+namespace v8runtime {
+
+  class V8Platform;
+
+  struct InspectorInterface {
+
+    virtual ~InspectorInterface() {};
+
+    // This will start the server and listen for connections .. Don't create instance if debugger is not needed.
+    // Creating multiple inspectors in the same process is untested and not supported as of now.
+    static std::unique_ptr<InspectorInterface> create(V8Platform& platform, int port);
+
+    // We have an overly simplified model to start with. i.e. we support only one isolate+context for debugging.
+    // This must be called from inside the isolate and context scope to be debugged.
+    virtual void initialize(v8::Isolate* isolate, v8::Local<v8::Context> context, const char* context_name /*must be null terminated*/) = 0;
+
+    virtual void waitForDebugger() = 0;
+  };
+
+  // This might change in future.
+  using CacheProvider = std::function<std::unique_ptr<const jsi::Buffer>(const std::string& sourceUrl)>;
+
+  using Logger = std::function<void(const std::string& message, unsigned int logLevel)>;
+
+  std::unique_ptr<jsi::Runtime> makeV8Runtime(
+    const v8::Platform* platform, /*platform must be managed outside.*/
+    std::shared_ptr<Logger>&& logger,
+    std::shared_ptr<facebook::react::MessageQueueThread>&& jsQueue,
+    std::shared_ptr<CacheProvider>&& cacheProvider = nullptr, /*Optional*/
+    std::unique_ptr<InspectorInterface> inspector = nullptr, /*Optional*/
+    std::unique_ptr<const jsi::Buffer> default_snapshot_blob = nullptr, /*Optional*/
+    std::unique_ptr<const jsi::Buffer> default_natives_blob = nullptr, /*Optional*/
+    std::unique_ptr<const jsi::Buffer> custom_snapshot = nullptr); /*Optional*/
+
+  std::unique_ptr<jsi::Runtime> makeV8Runtime();
+  std::unique_ptr<jsi::Runtime> makeV8Runtime(const folly::dynamic& v8Config, const std::shared_ptr<Logger>& logger);
+
+} // namespace v8runtime
+} // namespace facebook
