--- "E:\\github\\rnm-63-fresh\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\ReactInstanceManagerBuilder.java"	2020-10-27 20:26:16.728167300 -0700
+++ "E:\\github\\rnm-63\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\ReactInstanceManagerBuilder.java"	2020-10-13 21:27:45.535631600 -0700
@@ -26,6 +26,7 @@
 import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
 import com.facebook.react.devsupport.interfaces.DevSupportManager;
 import com.facebook.react.jscexecutor.JSCExecutorFactory;
+import com.facebook.react.v8executor.V8ExecutorFactory;
 import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
 import com.facebook.react.packagerconnection.RequestHandler;
 import com.facebook.react.uimanager.UIImplementationProvider;
@@ -291,7 +292,8 @@
 
   private JavaScriptExecutorFactory getDefaultJSExecutorFactory(
       String appName, String deviceName, Context applicationContext) {
-    try {
+        return new V8ExecutorFactory(appName, deviceName);
+/*    try {
       // If JSC is included, use it as normal
       initializeSoLoaderIfNecessary(applicationContext);
       SoLoader.loadLibrary("jscexecutor");
@@ -325,6 +327,6 @@
         hermesE.printStackTrace();
         throw jscE;
       }
-    }
+    } */
   }
 }
