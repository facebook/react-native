--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\cxxreact\\NativeToJsBridge.h"	2020-01-30 13:55:48.520581000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\cxxreact\\NativeToJsBridge.h"	2020-02-20 11:21:17.381512700 -0800
@@ -40,10 +40,11 @@
    * This must be called on the main JS thread.
    */
   NativeToJsBridge(
-      JSExecutorFactory* jsExecutorFactory,
-      std::shared_ptr<ModuleRegistry> registry,
-      std::shared_ptr<MessageQueueThread> jsQueue,
-      std::shared_ptr<InstanceCallback> callback);
+    JSExecutorFactory* jsExecutorFactory,
+    std::shared_ptr<ExecutorDelegate> delegate, // TODO(OSS Candidate ISS#2710739)
+    std::shared_ptr<ModuleRegistry> registry,
+    std::shared_ptr<MessageQueueThread> jsQueue,
+    std::shared_ptr<InstanceCallback> callback);
   virtual ~NativeToJsBridge();
 
   /**
@@ -80,6 +81,13 @@
   void handleMemoryPressure(int pressureLevel);
 
   /**
+   * Returns the current peak memory usage due to m_executor's JavaScript
+   * execution environment in bytes. If m_executor does not track this
+   * information, return -1.
+   */
+  int64_t getPeakJsMemoryUsage() const noexcept;
+
+  /**
    * Synchronously tears down the bridge and the main executor.
    */
   void destroy();
@@ -92,7 +100,7 @@
   // will try to run the task on m_callback which will have been destroyed
   // within ~NativeToJsBridge(), thus causing a SIGSEGV.
   std::shared_ptr<bool> m_destroyed;
-  std::shared_ptr<JsToNativeBridge> m_delegate;
+  std::shared_ptr<react::ExecutorDelegate> m_delegate; // TODO(OSS Candidate ISS#2710739)
   std::unique_ptr<JSExecutor> m_executor;
   std::shared_ptr<MessageQueueThread> m_executorMessageQueueThread;
 
@@ -107,7 +115,7 @@
   bool m_applicationScriptHasFailure = false;
 
   #ifdef WITH_FBSYSTRACE
-  std::atomic_uint_least32_t m_systraceCookie = ATOMIC_VAR_INIT();
+  std::atomic_uint_least32_t m_systraceCookie{};
   #endif
 };
 
