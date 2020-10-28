--- "E:\\github\\rnm-63-fresh\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\CatalystInstanceImpl.java"	2020-10-27 20:26:16.742190400 -0700
+++ "E:\\github\\rnm-63\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\CatalystInstanceImpl.java"	2020-10-13 22:13:10.906813300 -0700
@@ -121,7 +121,8 @@
       final JavaScriptExecutor jsExecutor,
       final NativeModuleRegistry nativeModuleRegistry,
       final JSBundleLoader jsBundleLoader,
-      NativeModuleCallExceptionHandler nativeModuleCallExceptionHandler) {
+      NativeModuleCallExceptionHandler nativeModuleCallExceptionHandler,
+      CatalystInstanceEventListener catalystInstanceEventListener) {
     FLog.d(ReactConstants.TAG, "Initializing React Xplat Bridge.");
     Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "createCatalystInstanceImpl");
 
@@ -139,15 +140,23 @@
     mTraceListener = new JSProfilerTraceListener(this);
     Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
 
+    FLog.d(ReactConstants.TAG, "Create module registry");
+
+    createModuleRegistry(mNativeModulesQueueThread,
+      mNativeModuleRegistry.getJavaModules(this),
+      mNativeModuleRegistry.getCxxModules());
+
+    if (catalystInstanceEventListener != null) {
+      FLog.d(ReactConstants.TAG, "Invoking callback onModuleRegistryCreated");
+      catalystInstanceEventListener.onModuleRegistryCreated(this);
+    }
+
     FLog.d(ReactConstants.TAG, "Initializing React Xplat Bridge before initializeBridge");
     Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "initializeCxxBridge");
     initializeBridge(
         new BridgeCallback(this),
         jsExecutor,
-        mReactQueueConfiguration.getJSQueueThread(),
-        mNativeModulesQueueThread,
-        mNativeModuleRegistry.getJavaModules(this),
-        mNativeModuleRegistry.getCxxModules());
+        mReactQueueConfiguration.getJSQueueThread());
     FLog.d(ReactConstants.TAG, "Initializing React Xplat Bridge after initializeBridge");
     Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
 
@@ -208,13 +217,15 @@
   private native void jniExtendNativeModules(
       Collection<JavaModuleWrapper> javaModules, Collection<ModuleHolder> cxxModules);
 
+  private native void createModuleRegistry(
+    MessageQueueThread moduleQueue,
+    Collection<JavaModuleWrapper> javaModules,
+    Collection<ModuleHolder> cxxModules);
+
   private native void initializeBridge(
       ReactCallback callback,
       JavaScriptExecutor jsExecutor,
-      MessageQueueThread jsQueue,
-      MessageQueueThread moduleQueue,
-      Collection<JavaModuleWrapper> javaModules,
-      Collection<ModuleHolder> cxxModules);
+      MessageQueueThread jsQueue);
 
   @Override
   public void setSourceURLs(String deviceURL, String remoteURL) {
@@ -403,7 +414,8 @@
                                             mJavaScriptContextHolder.clear();
 
                                             mHybridData.resetNative();
-                                            getReactQueueConfiguration().destroy();
+                                            // TODO :: Office patch :: Not sure why is this needed ? 
+                                            // getReactQueueConfiguration().destroy();
                                             FLog.d(
                                                 ReactConstants.TAG,
                                                 "CatalystInstanceImpl.destroy() end");
@@ -670,6 +682,8 @@
 
   private native long getJavaScriptContext();
 
+  public native long getPointerOfInstancePointer();
+
   private void incrementPendingJSCalls() {
     int oldPendingCalls = mPendingJSCalls.getAndIncrement();
     boolean wasIdle = oldPendingCalls == 0;
@@ -775,6 +789,7 @@
     private @Nullable NativeModuleRegistry mRegistry;
     private @Nullable JavaScriptExecutor mJSExecutor;
     private @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
+    private @Nullable CatalystInstanceEventListener mCatalystInstanceEventListener;
 
     public Builder setReactQueueConfigurationSpec(
         ReactQueueConfigurationSpec ReactQueueConfigurationSpec) {
@@ -802,13 +817,20 @@
       return this;
     }
 
+    public Builder setCatalystInstanceEventListener(
+      CatalystInstanceEventListener catalystInstanceEventListener) {
+      mCatalystInstanceEventListener = catalystInstanceEventListener;
+      return this;
+    }
+
     public CatalystInstanceImpl build() {
       return new CatalystInstanceImpl(
           Assertions.assertNotNull(mReactQueueConfigurationSpec),
           Assertions.assertNotNull(mJSExecutor),
           Assertions.assertNotNull(mRegistry),
           Assertions.assertNotNull(mJSBundleLoader),
-          Assertions.assertNotNull(mNativeModuleCallExceptionHandler));
+          Assertions.assertNotNull(mNativeModuleCallExceptionHandler),
+          mCatalystInstanceEventListener);
     }
   }
 }
