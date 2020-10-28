--- "E:\\github\\rnm-63-fresh\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\ReactInstanceManager.java"	2020-10-27 20:26:16.728167300 -0700
+++ "E:\\github\\rnm-63\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\ReactInstanceManager.java"	2020-10-13 21:26:17.779198100 -0700
@@ -51,6 +51,7 @@
 import com.facebook.infer.annotation.ThreadSafe;
 import com.facebook.react.bridge.Arguments;
 import com.facebook.react.bridge.CatalystInstance;
+import com.facebook.react.bridge.CatalystInstance.CatalystInstanceEventListener;
 import com.facebook.react.bridge.CatalystInstanceImpl;
 import com.facebook.react.bridge.JSBundleLoader;
 import com.facebook.react.bridge.JSIModule;
@@ -173,6 +174,7 @@
   private final @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
   private final @Nullable JSIModulePackage mJSIModulePackage;
   private List<ViewManager> mViewManagers;
+  private @Nullable CatalystInstanceEventListener mCatalystInstanceEventListener;
 
   private class ReactContextInitParams {
     private final JavaScriptExecutorFactory mJsExecutorFactory;
@@ -915,6 +917,15 @@
     }
   }
 
+  /**
+  *
+  * Register CatalystInstanceEventListener
+  * This methods is called from Office ReactNativeHost
+  */
+  public void setCatalystInstanceEventListener(CatalystInstanceEventListener catalystInstanceEventListener) {
+    mCatalystInstanceEventListener = catalystInstanceEventListener;
+  }
+
   /** Add a listener to be notified of react instance events. */
   public void addReactInstanceEventListener(ReactInstanceEventListener listener) {
     mReactInstanceEventListeners.add(listener);
@@ -1230,7 +1241,8 @@
             .setJSExecutor(jsExecutor)
             .setRegistry(nativeModuleRegistry)
             .setJSBundleLoader(jsBundleLoader)
-            .setNativeModuleCallExceptionHandler(exceptionHandler);
+            .setNativeModuleCallExceptionHandler(exceptionHandler)
+            .setCatalystInstanceEventListener(mCatalystInstanceEventListener);
 
     ReactMarker.logMarker(CREATE_CATALYST_INSTANCE_START);
     // CREATE_CATALYST_INSTANCE_END is in JSCExecutor.cpp
