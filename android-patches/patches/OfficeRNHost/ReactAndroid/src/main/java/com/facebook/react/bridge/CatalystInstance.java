--- "E:\\github\\rnm-63-fresh\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\CatalystInstance.java"	2020-10-27 20:26:16.742190400 -0700
+++ "E:\\github\\rnm-63\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\CatalystInstance.java"	2020-10-13 21:28:17.283848100 -0700
@@ -125,4 +125,11 @@
    * hasNativeModule, and getNativeModules can also return TurboModules.
    */
   void setTurboModuleManager(JSIModule getter);
+
+  long getPointerOfInstancePointer();
+
+  public interface CatalystInstanceEventListener {
+    void onModuleRegistryCreated(CatalystInstance catalystInstance);
+  }
+
 }
