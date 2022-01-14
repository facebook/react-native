--- ./ReactAndroid/src/main/java/com/facebook/react/bridge/CatalystInstance.java	2021-11-08 14:22:26.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/OfficeRNHost/ReactAndroid/src/main/java/com/facebook/react/bridge/CatalystInstance.java	2022-01-12 15:04:31.000000000 -0800
@@ -131,4 +131,11 @@
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
