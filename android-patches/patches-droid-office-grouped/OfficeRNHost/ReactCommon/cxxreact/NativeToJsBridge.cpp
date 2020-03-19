--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\cxxreact\\NativeToJsBridge.cpp"	2020-01-30 13:55:48.520581000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\cxxreact\\NativeToJsBridge.cpp"	2020-02-20 11:21:17.380512500 -0800
@@ -38,7 +38,7 @@
     return m_registry;
   }
   
-  bool isBatchActive() {
+  virtual bool isBatchActive() override {
     return m_batchHadNativeModuleCalls;
   }
 
@@ -85,11 +85,12 @@
 
 NativeToJsBridge::NativeToJsBridge(
     JSExecutorFactory *jsExecutorFactory,
+    std::shared_ptr<ExecutorDelegate> delegate, // TODO(OSS Candidate ISS#2710739)
     std::shared_ptr<ModuleRegistry> registry,
     std::shared_ptr<MessageQueueThread> jsQueue,
     std::shared_ptr<InstanceCallback> callback)
     : m_destroyed(std::make_shared<bool>(false)),
-      m_delegate(std::make_shared<JsToNativeBridge>(registry, callback)),
+      m_delegate(delegate ? delegate : (std::make_shared<JsToNativeBridge>(registry, callback))),
       m_executor(jsExecutorFactory->createJSExecutor(m_delegate, jsQueue)),
       m_executorMessageQueueThread(std::move(jsQueue)),
       m_inspectable(m_executor->isInspectable()) {}
@@ -239,6 +240,10 @@
   });
 }
 
+int64_t NativeToJsBridge::getPeakJsMemoryUsage() const noexcept {
+  return m_executor->getPeakJsMemoryUsage();
+}
+
 void NativeToJsBridge::destroy() {
   // All calls made through runOnExecutorQueue have an early exit if
   // m_destroyed is true. Setting this before the runOnQueueSync will cause
