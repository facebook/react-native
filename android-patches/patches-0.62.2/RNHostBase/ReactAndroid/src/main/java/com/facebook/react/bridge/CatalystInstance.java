--- "D:\\code\\work\\rn-62-db\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\CatalystInstance.java"	2020-04-30 21:53:45.721316700 -0700
+++ "D:\\code\\work\\rn-62-d\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\bridge\\CatalystInstance.java"	2020-04-30 22:53:26.318938900 -0700
@@ -125,4 +125,10 @@
    * hasNativeModule, and getNativeModules can also return TurboModules.
    */
   void setTurboModuleManager(JSIModule getter);
+
+  long getPointerOfInstancePointer();
+
+  public interface CatalystInstanceEventListener {
+    void onModuleRegistryCreated(CatalystInstance catalystInstance);
+  }
 }
