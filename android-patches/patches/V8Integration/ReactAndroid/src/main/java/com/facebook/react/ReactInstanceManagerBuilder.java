--- "D:\\code\\work\\rn-62-db\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\ReactInstanceManagerBuilder.java"	2020-04-30 15:18:41.711691800 -0700
+++ "D:\\code\\work\\rn-62-d\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\ReactInstanceManagerBuilder.java"	2020-04-30 15:32:28.930329800 -0700
@@ -27,6 +27,7 @@
 import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
 import com.facebook.react.devsupport.interfaces.DevSupportManager;
 import com.facebook.react.jscexecutor.JSCExecutorFactory;
+import com.facebook.react.v8executor.V8ExecutorFactory;
 import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
 import com.facebook.react.packagerconnection.RequestHandler;
 import com.facebook.react.uimanager.UIImplementationProvider;
@@ -291,6 +292,8 @@
   }
 
   private JavaScriptExecutorFactory getDefaultJSExecutorFactory(String appName, String deviceName, Context applicationContext) {
+    return new V8ExecutorFactory(appName, deviceName);
+    /*
     try {
       // If JSC is included, use it as normal
       initializeSoLoaderIfNecessary(applicationContext);
@@ -325,6 +328,6 @@
         hermesE.printStackTrace();
         throw jscE;
       }
-    }
+    }*/
   }
 }
