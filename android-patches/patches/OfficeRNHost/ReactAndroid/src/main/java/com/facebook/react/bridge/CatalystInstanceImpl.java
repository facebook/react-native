diff --git a/ReactAndroid/src/main/java/com/facebook/react/bridge/CatalystInstanceImpl.java b/ReactAndroid/src/main/java/com/facebook/react/bridge/CatalystInstanceImpl.java
index dae969346..4b60fd1a7 100644
--- a/ReactAndroid/src/main/java/com/facebook/react/bridge/CatalystInstanceImpl.java
+++ b/ReactAndroid/src/main/java/com/facebook/react/bridge/CatalystInstanceImpl.java
@@ -121,7 +121,8 @@ public class CatalystInstanceImpl implements CatalystInstance {
       final JavaScriptExecutor jsExecutor,
       final NativeModuleRegistry nativeModuleRegistry,
       final JSBundleLoader jsBundleLoader,
-      NativeModuleCallExceptionHandler nativeModuleCallExceptionHandler) {
+      NativeModuleCallExceptionHandler nativeModuleCallExceptionHandler,
+      CatalystInstanceEventListener catalystInstanceEventListener) {
     FLog.d(ReactConstants.TAG, "Initializing React Xplat Bridge.");
     Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "createCatalystInstanceImpl");
 
@@ -139,15 +140,21 @@ public class CatalystInstanceImpl implements CatalystInstance {
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
 
@@ -208,13 +215,15 @@ public class CatalystInstanceImpl implements CatalystInstance {
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
@@ -395,7 +401,8 @@ public class CatalystInstanceImpl implements CatalystInstance {
                                             mJavaScriptContextHolder.clear();
 
                                             mHybridData.resetNative();
-                                            getReactQueueConfiguration().destroy();
+                                            // TODO :: Office patch :: Not sure why is this needed ?
+                                            // getReactQueueConfiguration().destroy();
                                             FLog.d(
                                                 ReactConstants.TAG,
                                                 "CatalystInstanceImpl.destroy() end");
@@ -565,6 +572,7 @@ public class CatalystInstanceImpl implements CatalystInstance {
   }
 
   private native long getJavaScriptContext();
+  public native long getPointerOfInstancePointer();
 
   private void incrementPendingJSCalls() {
     int oldPendingCalls = mPendingJSCalls.getAndIncrement();
@@ -668,6 +676,7 @@ public class CatalystInstanceImpl implements CatalystInstance {
     private @Nullable NativeModuleRegistry mRegistry;
     private @Nullable JavaScriptExecutor mJSExecutor;
     private @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
+    private @Nullable CatalystInstanceEventListener mCatalystInstanceEventListener;
 
     public Builder setReactQueueConfigurationSpec(
         ReactQueueConfigurationSpec ReactQueueConfigurationSpec) {
@@ -695,13 +704,20 @@ public class CatalystInstanceImpl implements CatalystInstance {
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
