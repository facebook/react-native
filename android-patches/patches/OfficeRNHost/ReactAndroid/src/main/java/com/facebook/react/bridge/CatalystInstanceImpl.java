--- ./ReactAndroid/src/main/java/com/facebook/react/bridge/CatalystInstanceImpl.java	2022-01-11 17:41:29.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/OfficeRNHost/ReactAndroid/src/main/java/com/facebook/react/bridge/CatalystInstanceImpl.java	2022-01-12 16:18:35.000000000 -0800
@@ -119,7 +119,8 @@
       final JavaScriptExecutor jsExecutor,
       final NativeModuleRegistry nativeModuleRegistry,
       final JSBundleLoader jsBundleLoader,
-      NativeModuleCallExceptionHandler nativeModuleCallExceptionHandler) {
+      NativeModuleCallExceptionHandler nativeModuleCallExceptionHandler,
+      CatalystInstanceEventListener catalystInstanceEventListener) {
     FLog.d(ReactConstants.TAG, "Initializing React Xplat Bridge.");
     Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "createCatalystInstanceImpl");
 
@@ -137,6 +138,15 @@
     mTraceListener = new JSProfilerTraceListener(this);
     Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
 
+    FLog.d(ReactConstants.TAG, "Create module registry");
+    createModuleRegistry(mNativeModulesQueueThread,
+      mNativeModuleRegistry.getJavaModules(this),
+      mNativeModuleRegistry.getCxxModules());
+    if (catalystInstanceEventListener != null) {
+      FLog.d(ReactConstants.TAG, "Invoking callback onModuleRegistryCreated");
+      catalystInstanceEventListener.onModuleRegistryCreated(this);
+    }
+
     FLog.d(ReactConstants.TAG, "Initializing React Xplat Bridge before initializeBridge");
     Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "initializeCxxBridge");
 
@@ -147,10 +157,7 @@
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
 
@@ -211,15 +218,17 @@
   private native void jniExtendNativeModules(
       Collection<JavaModuleWrapper> javaModules, Collection<ModuleHolder> cxxModules);
 
+  private native void createModuleRegistry(
+    MessageQueueThread moduleQueue,
+    Collection<JavaModuleWrapper> javaModules,
+    Collection<ModuleHolder> cxxModules);
+
   private native void warnOnLegacyNativeModuleSystemUse();
 
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
@@ -400,7 +409,8 @@
                                             mJavaScriptContextHolder.clear();
 
                                             mHybridData.resetNative();
-                                            getReactQueueConfiguration().destroy();
+                                            // TODO :: Office patch :: Not sure why is this needed ?
+                                            // getReactQueueConfiguration().destroy();
                                             FLog.d(
                                                 ReactConstants.TAG,
                                                 "CatalystInstanceImpl.destroy() end");
@@ -569,6 +579,7 @@
   }
 
   private native long getJavaScriptContext();
+  public native long getPointerOfInstancePointer();
 
   private void incrementPendingJSCalls() {
     int oldPendingCalls = mPendingJSCalls.getAndIncrement();
@@ -672,6 +683,7 @@
     private @Nullable NativeModuleRegistry mRegistry;
     private @Nullable JavaScriptExecutor mJSExecutor;
     private @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
+    private @Nullable CatalystInstanceEventListener mCatalystInstanceEventListener;
 
     public Builder setReactQueueConfigurationSpec(
         ReactQueueConfigurationSpec ReactQueueConfigurationSpec) {
@@ -699,13 +711,20 @@
       return this;
     }
 
+    public Builder setCatalystInstanceEventListener(
+      CatalystInstanceEventListener catalystInstanceEventListener) {
+        mCatalystInstanceEventListener = catalystInstanceEventListener;
+        return this;
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
