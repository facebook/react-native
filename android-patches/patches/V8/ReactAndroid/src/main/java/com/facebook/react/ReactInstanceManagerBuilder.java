--- ./ReactAndroid/src/main/java/com/facebook/react/ReactInstanceManagerBuilder.java	2022-01-11 17:41:29.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/V8/ReactAndroid/src/main/java/com/facebook/react/ReactInstanceManagerBuilder.java	2022-01-12 15:04:31.000000000 -0800
@@ -26,6 +26,7 @@
 import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
 import com.facebook.react.devsupport.interfaces.DevSupportManager;
 import com.facebook.react.jscexecutor.JSCExecutorFactory;
+import com.facebook.react.v8executor.V8ExecutorFactory;
 import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
 import com.facebook.react.packagerconnection.RequestHandler;
 import com.facebook.react.uimanager.UIImplementationProvider;
@@ -60,8 +61,21 @@
   private @Nullable Map<String, RequestHandler> mCustomPackagerCommandHandlers;
   private @Nullable ReactPackageTurboModuleManagerDelegate.Builder mTMMDelegateBuilder;
 
+  public enum JSEngine {
+    Hermes,
+    V8
+  }
+
+  private JSEngine mJSEngine = JSEngine.V8;
+
   /* package protected */ ReactInstanceManagerBuilder() {}
 
+  public ReactInstanceManagerBuilder setJSEngine(
+      JSEngine jsEngine) {
+    mJSEngine = jsEngine;
+    return this;
+  }
+
   /** Sets a provider of {@link UIImplementation}. Uses default provider if null is passed. */
   public ReactInstanceManagerBuilder setUIImplementationProvider(
       @Nullable UIImplementationProvider uiImplementationProvider) {
@@ -299,40 +313,10 @@
 
   private JavaScriptExecutorFactory getDefaultJSExecutorFactory(
       String appName, String deviceName, Context applicationContext) {
-    try {
-      // If JSC is included, use it as normal
-      initializeSoLoaderIfNecessary(applicationContext);
-      SoLoader.loadLibrary("jscexecutor");
-      return new JSCExecutorFactory(appName, deviceName);
-    } catch (UnsatisfiedLinkError jscE) {
-      // https://github.com/facebook/hermes/issues/78 shows that
-      // people who aren't trying to use Hermes are having issues.
-      // https://github.com/facebook/react-native/issues/25923#issuecomment-554295179
-      // includes the actual JSC error in at least one case.
-      //
-      // So, if "__cxa_bad_typeid" shows up in the jscE exception
-      // message, then we will assume that's the failure and just
-      // throw now.
-
-      if (jscE.getMessage().contains("__cxa_bad_typeid")) {
-        throw jscE;
-      }
-
-      // Otherwise use Hermes
-      try {
+      if(mJSEngine == JSEngine.V8) {
+        return new V8ExecutorFactory(appName, deviceName);
+      } else {
         return new HermesExecutorFactory();
-      } catch (UnsatisfiedLinkError hermesE) {
-        // If we get here, either this is a JSC build, and of course
-        // Hermes failed (since it's not in the APK), or it's a Hermes
-        // build, and Hermes had a problem.
-
-        // We suspect this is a JSC issue (it's the default), so we
-        // will throw that exception, but we will print hermesE first,
-        // since it could be a Hermes issue and we don't want to
-        // swallow that.
-        hermesE.printStackTrace();
-        throw jscE;
       }
-    }
   }
 }
