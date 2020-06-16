--- "D:\\code\\work\\rn-62-db\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\ReactInstanceManager.java"	2020-04-30 21:53:45.697313300 -0700
+++ "D:\\code\\work\\rn-62-d\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\ReactInstanceManager.java"	2020-04-30 23:18:47.718545100 -0700
@@ -52,6 +52,7 @@
 import com.facebook.infer.annotation.ThreadSafe;
 import com.facebook.react.bridge.Arguments;
 import com.facebook.react.bridge.CatalystInstance;
+import com.facebook.react.bridge.CatalystInstance.CatalystInstanceEventListener;
 import com.facebook.react.bridge.CatalystInstanceImpl;
 import com.facebook.react.bridge.JSBundleLoader;
 import com.facebook.react.bridge.JSIModule;
@@ -174,6 +175,7 @@
   private final @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
   private final @Nullable JSIModulePackage mJSIModulePackage;
   private List<ViewManager> mViewManagers;
+  private @Nullable CatalystInstanceEventListener mCatalystInstanceEventListener;
 
   private class ReactContextInitParams {
     private final JavaScriptExecutorFactory mJsExecutorFactory;
@@ -895,6 +897,15 @@
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
@@ -1199,7 +1210,8 @@
             .setJSExecutor(jsExecutor)
             .setRegistry(nativeModuleRegistry)
             .setJSBundleLoader(jsBundleLoader)
-            .setNativeModuleCallExceptionHandler(exceptionHandler);
+            .setNativeModuleCallExceptionHandler(exceptionHandler)
+            .setCatalystInstanceEventListener(mCatalystInstanceEventListener);
 
     ReactMarker.logMarker(CREATE_CATALYST_INSTANCE_START);
     // CREATE_CATALYST_INSTANCE_END is in JSCExecutor.cpp
