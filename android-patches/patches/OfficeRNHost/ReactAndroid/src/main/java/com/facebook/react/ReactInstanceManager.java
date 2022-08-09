--- ./ReactAndroid/src/main/java/com/facebook/react/ReactInstanceManager.java	2022-01-11 17:41:29.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/OfficeRNHost/ReactAndroid/src/main/java/com/facebook/react/ReactInstanceManager.java	2022-01-12 15:04:31.000000000 -0800
@@ -52,6 +52,7 @@
 import com.facebook.infer.annotation.ThreadSafe;
 import com.facebook.react.bridge.Arguments;
 import com.facebook.react.bridge.CatalystInstance;
+import com.facebook.react.bridge.CatalystInstance.CatalystInstanceEventListener;
 import com.facebook.react.bridge.CatalystInstanceImpl;
 import com.facebook.react.bridge.JSBundleLoader;
 import com.facebook.react.bridge.JSIModulePackage;
@@ -186,6 +187,7 @@
   private final @Nullable ReactPackageTurboModuleManagerDelegate.Builder mTMMDelegateBuilder;
   private List<ViewManager> mViewManagers;
   private boolean mUseFallbackBundle = false;
+  private @Nullable CatalystInstanceEventListener mCatalystInstanceEventListener;
 
   private class ReactContextInitParams {
     private final JavaScriptExecutorFactory mJsExecutorFactory;
@@ -206,6 +208,15 @@
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
   /** Creates a builder that is capable of creating an instance of {@link ReactInstanceManager}. */
   public static ReactInstanceManagerBuilder builder() {
     return new ReactInstanceManagerBuilder();
@@ -1333,7 +1344,8 @@
             .setJSExecutor(jsExecutor)
             .setRegistry(nativeModuleRegistry)
             .setJSBundleLoader(jsBundleLoader)
-            .setNativeModuleCallExceptionHandler(exceptionHandler);
+            .setNativeModuleCallExceptionHandler(exceptionHandler)
+	    .setCatalystInstanceEventListener(mCatalystInstanceEventListener);
 
     ReactMarker.logMarker(CREATE_CATALYST_INSTANCE_START);
     // CREATE_CATALYST_INSTANCE_END is in JSCExecutor.cpp
