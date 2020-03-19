--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\ReactInstanceManager.java"	2020-02-20 11:22:34.051346400 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\ReactInstanceManager.java"	2020-02-20 11:21:17.366516300 -0800
@@ -49,6 +49,7 @@
 import com.facebook.infer.annotation.ThreadSafe;
 import com.facebook.react.bridge.Arguments;
 import com.facebook.react.bridge.CatalystInstance;
+import com.facebook.react.bridge.CatalystInstance.CatalystInstanceEventListener;
 import com.facebook.react.bridge.CatalystInstanceImpl;
 import com.facebook.react.bridge.JSBundleLoader;
 import com.facebook.react.bridge.JSIModulePackage;
@@ -168,6 +169,8 @@
   private final @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
   private final @Nullable JSIModulePackage mJSIModulePackage;
   private List<ViewManager> mViewManagers;
+  private boolean mIsContextCreatedOnUIThread;
+  private @Nullable CatalystInstanceEventListener mCatalystInstanceEventListener;
 
   private class ReactContextInitParams {
     private final JavaScriptExecutorFactory mJsExecutorFactory;
@@ -341,6 +344,15 @@
   }
 
   /**
+   *
+   * Register CatalystInstanceEventListener
+   * This methods is called from Office ReactNativeHost
+   */
+  public void setCatalystInstanceEventListener(CatalystInstanceEventListener catalystInstanceEventListener) {
+    mCatalystInstanceEventListener = catalystInstanceEventListener;
+  }
+
+  /**
    * Recreate the react application and context. This should be called if configuration has changed
    * or the developer has requested the app to be reloaded. It should only be called after an
    * initial call to createReactContextInBackground.
@@ -922,6 +934,8 @@
       }
     }
 
+    // React context is getting created on a background thread.
+    mIsContextCreatedOnUIThread = false;
     mCreateReactContextThread =
         new Thread(
             null,
@@ -985,27 +999,75 @@
     mCreateReactContextThread.start();
   }
 
+/**
+   *
+   * This method was added for Office ReactNativeHost consumption. But currently is not being used. Candidate for deletion.
+   */
+  @ThreadConfined(UI)
+  public ReactContext createReactContextOnUIThread() {
+    Log.d(ReactConstants.TAG, "ReactInstanceManager.createReactContextOnUIThread()");
+    // React context is getting created on UI thread.
+    mIsContextCreatedOnUIThread = true;
+    final ReactContextInitParams initParams = new ReactContextInitParams(
+      mJavaScriptExecutorFactory,
+      mBundleLoader);
+
+    ReactApplicationContext reactApplicationContext = null;
+    // As destroy() may have run and set this to false, ensure that it is true before we create
+    mHasStartedCreatingInitialContext = true;
+    try {
+      reactApplicationContext = createReactContext(
+        initParams.getJsExecutorFactory().create(),
+        initParams.getJsBundleLoader());
+
+      mCreateReactContextThread = null;
+      ReactMarker.logMarker(PRE_SETUP_REACT_CONTEXT_START);
+
+      final ReactApplicationContext reactApplicationContextFinal = reactApplicationContext;
+
+      Runnable setupReactContextRunnable =
+        new Runnable() {
+          @Override
+          public void run() {
+            try {
+              setupReactContext(reactApplicationContextFinal);
+            } catch (Exception e) {
+              mDevSupportManager.handleException(e);
+            }
+          }
+        };
+
+      reactApplicationContext.runOnNativeModulesQueueThread(setupReactContextRunnable);
+    } catch (Exception e) {
+      mDevSupportManager.handleException(e);
+    }
+
+    return reactApplicationContext;
+  }
+
   private void setupReactContext(final ReactApplicationContext reactContext) {
     Log.d(ReactConstants.TAG, "ReactInstanceManager.setupReactContext()");
     ReactMarker.logMarker(PRE_SETUP_REACT_CONTEXT_END);
     ReactMarker.logMarker(SETUP_REACT_CONTEXT_START);
     Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "setupReactContext");
-    synchronized (mAttachedReactRoots) {
-      synchronized (mReactContextLock) {
-        mCurrentReactContext = Assertions.assertNotNull(reactContext);
-      }
-
-      CatalystInstance catalystInstance =
-          Assertions.assertNotNull(reactContext.getCatalystInstance());
+    synchronized (mReactContextLock) {
+      mCurrentReactContext = Assertions.assertNotNull(reactContext);
+    }
+    final CatalystInstance catalystInstance =
+      Assertions.assertNotNull(reactContext.getCatalystInstance());
 
       catalystInstance.initialize();
       mDevSupportManager.onNewReactContextCreated(reactContext);
       mMemoryPressureRouter.addMemoryPressureListener(catalystInstance);
       moveReactContextToCurrentLifecycleState();
 
+    // Do not attach root views if the context is created synchronously on UI thread.
+    if (!mIsContextCreatedOnUIThread) {
       ReactMarker.logMarker(ATTACH_MEASURED_ROOT_VIEWS_START);
-      for (ReactRoot reactRoot : mAttachedReactRoots) {
-        attachRootViewToInstance(reactRoot);
+      synchronized (mAttachedReactRoots) {
+        for (ReactRoot reactRoot : mAttachedReactRoots) {
+          attachRootViewToInstance(reactRoot);
+        }
       }
       ReactMarker.logMarker(ATTACH_MEASURED_ROOT_VIEWS_END);
     }
@@ -1127,7 +1189,8 @@
       .setJSExecutor(jsExecutor)
       .setRegistry(nativeModuleRegistry)
       .setJSBundleLoader(jsBundleLoader)
-      .setNativeModuleCallExceptionHandler(exceptionHandler);
+      .setNativeModuleCallExceptionHandler(exceptionHandler)
+      .setCatalystInstanceEventListener(mCatalystInstanceEventListener);
 
     ReactMarker.logMarker(CREATE_CATALYST_INSTANCE_START);
     // CREATE_CATALYST_INSTANCE_END is in JSCExecutor.cpp
