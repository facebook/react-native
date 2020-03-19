--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\cxxreact\\Instance.cpp"	2020-01-30 13:55:48.514580900 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\cxxreact\\Instance.cpp"	2020-02-20 11:21:17.377514000 -0800
@@ -36,16 +36,28 @@
   }
 }
 
+void Instance::setModuleRegistry(
+    std::shared_ptr<ModuleRegistry> moduleRegistry) {
+  moduleRegistry_ = std::move(moduleRegistry);
+}
+
 void Instance::initializeBridge(
     std::unique_ptr<InstanceCallback> callback,
+    std::shared_ptr<ExecutorDelegateFactory> edf,
     std::shared_ptr<JSExecutorFactory> jsef,
     std::shared_ptr<MessageQueueThread> jsQueue,
     std::shared_ptr<ModuleRegistry> moduleRegistry) {
   callback_ = std::move(callback);
   moduleRegistry_ = std::move(moduleRegistry);
-  jsQueue->runOnQueueSync([this, &jsef, jsQueue]() mutable {
+  
+  std::shared_ptr<ExecutorDelegate> delegate;
+  if (edf) {
+    delegate = edf->createExecutorDelegate(moduleRegistry_, callback_);
+  }
+
+  jsQueue->runOnQueueSync([this, delegate, &jsef, jsQueue]() mutable {
     nativeToJsBridge_ = folly::make_unique<NativeToJsBridge>(
-        jsef.get(), moduleRegistry_, jsQueue, callback_);
+        jsef.get(), delegate, moduleRegistry_, jsQueue, callback_);
 
     std::lock_guard<std::mutex> lock(m_syncMutex);
     m_syncReady = true;
@@ -184,6 +196,10 @@
   nativeToJsBridge_->invokeCallback((double)callbackId, std::move(params));
 }
 
+void Instance::setJSEConfigParams(std::shared_ptr<JSEConfigParams>&& jseConfigParams) {
+  jseConfigParams_ = std::move(jseConfigParams);
+}
+
 void Instance::registerBundle(uint32_t bundleId, const std::string& bundlePath) {
   nativeToJsBridge_->registerBundle(bundleId, bundlePath);
 }
@@ -198,6 +214,10 @@
   nativeToJsBridge_->handleMemoryPressure(pressureLevel);
 }
 
+int64_t Instance::getPeakJsMemoryUsage() const noexcept {
+  return nativeToJsBridge_->getPeakJsMemoryUsage();
+}
+
 void Instance::invokeAsync(std::function<void()>&& func) {
   nativeToJsBridge_->runOnExecutorQueue([func=std::move(func)](JSExecutor *executor) {
     func();
