diff --git a/ReactAndroid/src/main/java/com/facebook/react/ReactInstanceManager.java b/ReactAndroid/src/main/java/com/facebook/react/ReactInstanceManager.java
index 63ac2ec11..26fee8860 100644
--- a/ReactAndroid/src/main/java/com/facebook/react/ReactInstanceManager.java
+++ b/ReactAndroid/src/main/java/com/facebook/react/ReactInstanceManager.java
@@ -51,6 +51,7 @@ import com.facebook.infer.annotation.ThreadConfined;
 import com.facebook.infer.annotation.ThreadSafe;
 import com.facebook.react.bridge.Arguments;
 import com.facebook.react.bridge.CatalystInstance;
+import com.facebook.react.bridge.CatalystInstance.CatalystInstanceEventListener;
 import com.facebook.react.bridge.CatalystInstanceImpl;
 import com.facebook.react.bridge.JSBundleLoader;
 import com.facebook.react.bridge.JSIModule;
@@ -173,6 +174,7 @@ public class ReactInstanceManager {
   private final @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
   private final @Nullable JSIModulePackage mJSIModulePackage;
   private List<ViewManager> mViewManagers;
+  private @Nullable CatalystInstanceEventListener mCatalystInstanceEventListener;
 
   private class ReactContextInitParams {
     private final JavaScriptExecutorFactory mJsExecutorFactory;
@@ -193,6 +195,15 @@ public class ReactInstanceManager {
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
@@ -1267,7 +1278,8 @@ public class ReactInstanceManager {
             .setJSExecutor(jsExecutor)
             .setRegistry(nativeModuleRegistry)
             .setJSBundleLoader(jsBundleLoader)
-            .setNativeModuleCallExceptionHandler(exceptionHandler);
+            .setNativeModuleCallExceptionHandler(exceptionHandler)
+	    .setCatalystInstanceEventListener(mCatalystInstanceEventListener);
 
     ReactMarker.logMarker(CREATE_CATALYST_INSTANCE_START);
     // CREATE_CATALYST_INSTANCE_END is in JSCExecutor.cpp
