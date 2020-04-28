--- "D:\\code\\work\\react-native-fb61merge-dirty-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\ReactInstanceManagerBuilder.java"	2020-04-27 19:38:01.880037800 -0700
+++ "D:\\code\\work\\react-native-fb61merge-dirty\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\ReactInstanceManagerBuilder.java"	2020-04-27 23:07:38.795343700 -0700
@@ -22,6 +22,7 @@
 import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
 import com.facebook.react.devsupport.interfaces.DevSupportManager;
 import com.facebook.react.jscexecutor.JSCExecutorFactory;
+import com.facebook.react.v8executor.V8ExecutorFactory;
 import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
 import com.facebook.react.packagerconnection.RequestHandler;
 import com.facebook.react.uimanager.UIImplementationProvider;
@@ -285,6 +286,9 @@
   }
 
   private JavaScriptExecutorFactory getDefaultJSExecutorFactory(String appName, String deviceName) {
+    return new V8ExecutorFactory(appName, deviceName);
+
+    /*
     try {
       // If JSC is included, use it as normal
       SoLoader.loadLibrary("jscexecutor");
@@ -292,6 +296,6 @@
     } catch (UnsatisfiedLinkError jscE) {
       // Otherwise use Hermes
       return new HermesExecutorFactory();
-    }
+    }*/
   }
 }
