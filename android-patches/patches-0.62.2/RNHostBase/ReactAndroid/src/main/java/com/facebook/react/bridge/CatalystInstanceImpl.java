--- "D:\\code\\work\\rn-62-db\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\CatalystInstanceImpl.java"	2020-04-30 21:53:45.722320000 -0700
+++ "D:\\code\\work\\rn-62-d\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\CatalystInstanceImpl.java"	2020-04-30 23:20:49.552017200 -0700
@@ -122,7 +122,8 @@
       final JavaScriptExecutor jsExecutor,
       final NativeModuleRegistry nativeModuleRegistry,
       final JSBundleLoader jsBundleLoader,
-      NativeModuleCallExceptionHandler nativeModuleCallExceptionHandler) {
+      NativeModuleCallExceptionHandler nativeModuleCallExceptionHandler,
+      CatalystInstanceEventListener catalystInstanceEventListener) {
     Log.d(ReactConstants.TAG, "Initializing React Xplat Bridge.");
     Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "createCatalystInstanceImpl");
 
@@ -140,15 +141,23 @@
     mTraceListener = new JSProfilerTraceListener(this);
     Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
 
+    Log.d(ReactConstants.TAG, "Create module registry");
+
+    createModuleRegistry(mNativeModulesQueueThread,
+      mNativeModuleRegistry.getJavaModules(this),
+      mNativeModuleRegistry.getCxxModules());
+
+    if (catalystInstanceEventListener != null) {
+      Log.d(ReactConstants.TAG, "Invoking callback onModuleRegistryCreated");
+      catalystInstanceEventListener.onModuleRegistryCreated(this);
+    }
+
     Log.d(ReactConstants.TAG, "Initializing React Xplat Bridge before initializeBridge");
     Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "initializeCxxBridge");
     initializeBridge(
         new BridgeCallback(this),
         jsExecutor,
-        mReactQueueConfiguration.getJSQueueThread(),
-        mNativeModulesQueueThread,
-        mNativeModuleRegistry.getJavaModules(this),
-        mNativeModuleRegistry.getCxxModules());
+        mReactQueueConfiguration.getJSQueueThread());
     Log.d(ReactConstants.TAG, "Initializing React Xplat Bridge after initializeBridge");
     Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
 
@@ -209,13 +218,15 @@
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
@@ -404,7 +415,8 @@
                                             mJavaScriptContextHolder.clear();
 
                                             mHybridData.resetNative();
-                                            getReactQueueConfiguration().destroy();
+                                            // TODO :: Office patch :: Not sure why is this needed ? 
+                                            // getReactQueueConfiguration().destroy();
                                             Log.d(
                                                 ReactConstants.TAG,
                                                 "CatalystInstanceImpl.destroy() end");
@@ -664,6 +676,8 @@
 
   private native long getJavaScriptContext();
 
+  public native long getPointerOfInstancePointer();
+
   private void incrementPendingJSCalls() {
     int oldPendingCalls = mPendingJSCalls.getAndIncrement();
     boolean wasIdle = oldPendingCalls == 0;
@@ -766,6 +780,7 @@
     private @Nullable NativeModuleRegistry mRegistry;
     private @Nullable JavaScriptExecutor mJSExecutor;
     private @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
+    private @Nullable CatalystInstanceEventListener mCatalystInstanceEventListener;
 
     public Builder setReactQueueConfigurationSpec(
         ReactQueueConfigurationSpec ReactQueueConfigurationSpec) {
@@ -793,13 +808,20 @@
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
