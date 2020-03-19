--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\cxxreact\\Instance.h"	2020-01-30 13:55:48.515581300 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\cxxreact\\Instance.h"	2020-02-20 11:21:17.377514000 -0800
@@ -34,10 +34,28 @@
   virtual void decrementPendingJSCalls() {}
 };
 
+enum class CachingType {
+  NoCaching,
+  PartialCaching,
+  PartialCachingWithNoLazy,
+  FullCaching,
+  FullCachingWithNoLazy
+};
+
+struct JSEConfigParams {
+  std::string cachePath;
+  CachingType cacheType;
+  int loggingLevel;
+};
+
 class RN_EXPORT Instance {
 public:
-  ~Instance();
+  virtual ~Instance();
+
+  void setModuleRegistry(std::shared_ptr<ModuleRegistry> moduleRegistry);
+
   void initializeBridge(std::unique_ptr<InstanceCallback> callback,
+                        std::shared_ptr<ExecutorDelegateFactory> edf, // if nullptr, will use default delegate (JsToNativeBridge) // TODO(OSS Candidate ISS#2710739)
                         std::shared_ptr<JSExecutorFactory> jsef,
                         std::shared_ptr<MessageQueueThread> jsQueue,
                         std::shared_ptr<ModuleRegistry> moduleRegistry);
@@ -64,6 +82,7 @@
   void callJSFunction(std::string &&module, std::string &&method,
                       folly::dynamic &&params);
   void callJSCallback(uint64_t callbackId, folly::dynamic &&params);
+  virtual void setJSEConfigParams(std::shared_ptr<JSEConfigParams>&& jseConfigParams);
 
   // This method is experimental, and may be modified or removed.
   void registerBundle(uint32_t bundleId, const std::string& bundlePath);
@@ -73,6 +92,13 @@
 
   void handleMemoryPressure(int pressureLevel);
 
+   /**
+   * Returns the current peak memory usage due to the JavaScript
+   * execution environment in bytes. If the JavaScript execution
+   * environment does not track this information, return -1.
+   */
+  int64_t getPeakJsMemoryUsage() const noexcept;
+
   void invokeAsync(std::function<void()>&& func);
 
 private:
@@ -87,6 +113,7 @@
   std::shared_ptr<InstanceCallback> callback_;
   std::unique_ptr<NativeToJsBridge> nativeToJsBridge_;
   std::shared_ptr<ModuleRegistry> moduleRegistry_;
+  std::shared_ptr<JSEConfigParams> jseConfigParams_;
 
   std::mutex m_syncMutex;
   std::condition_variable m_syncCV;
