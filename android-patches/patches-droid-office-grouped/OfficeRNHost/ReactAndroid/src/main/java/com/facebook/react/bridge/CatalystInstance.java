--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\CatalystInstance.java"	2020-01-30 13:55:48.253579200 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\CatalystInstance.java"	2020-01-29 14:10:09.349886800 -0800
@@ -105,9 +105,18 @@
 
   void addJSIModules(List<JSIModuleSpec> jsiModules);
 
-  /**
+   /**
    * Returns a hybrid object that contains a pointer to JSCallInvoker.
    * Required for TurboModuleManager initialization.
    */
   JSCallInvokerHolder getJSCallInvokerHolder();
+
+  /**
+   * Get the C pointer (as a long) of the underneath Instance.
+   */
+  long getPointerOfInstancePointer();
+
+  public interface CatalystInstanceEventListener {
+    void onModuleRegistryCreated(CatalystInstance catalystInstance);
+  }
 }
