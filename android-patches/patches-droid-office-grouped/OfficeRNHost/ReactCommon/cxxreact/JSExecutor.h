--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\cxxreact\\JSExecutor.h"	2020-01-30 13:55:48.517581300 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\cxxreact\\JSExecutor.h"	2020-02-20 11:21:17.379512600 -0800
@@ -8,6 +8,7 @@
 #include <memory>
 #include <string>
 
+#include <cxxreact/ModuleRegistry.h>
 #include <cxxreact/NativeModule.h>
 #include <folly/dynamic.h>
 
@@ -19,11 +20,21 @@
 namespace react {
 
 class JSBigString;
+class ExecutorDelegate;
 class JSExecutor;
 class JSModulesUnbundle;
 class MessageQueueThread;
 class ModuleRegistry;
 class RAMBundleRegistry;
+struct InstanceCallback;
+
+class ExecutorDelegateFactory {
+public:
+  virtual std::unique_ptr<ExecutorDelegate> createExecutorDelegate(
+    std::shared_ptr<ModuleRegistry> registry,
+    std::shared_ptr<InstanceCallback> callback) = 0;
+  virtual ~ExecutorDelegateFactory() {}
+};
 
 // This interface describes the delegate interface required by
 // Executor implementations to call from JS into native code.
@@ -37,6 +48,8 @@
     JSExecutor& executor, folly::dynamic&& calls, bool isEndOfBatch) = 0;
   virtual MethodCallResult callSerializableNativeHook(
     JSExecutor& executor, unsigned int moduleId, unsigned int methodId, folly::dynamic&& args) = 0;
+
+  virtual bool isBatchActive() = 0;
 };
 
 using NativeExtensionsProvider = std::function<folly::dynamic(const std::string&)>;
@@ -105,6 +118,15 @@
 
   virtual void handleMemoryPressure(__unused int pressureLevel) {}
 
+  /**
+   * Returns the current peak memory usage due to the JavaScript
+   * execution environment in bytes. If the JavaScript execution
+   * environment does not track this information, return -1.
+   */
+  virtual int64_t getPeakJsMemoryUsage() const noexcept { // ISS
+    return -1;
+  }
+
   virtual void destroy() {}
   virtual ~JSExecutor() {}
 
