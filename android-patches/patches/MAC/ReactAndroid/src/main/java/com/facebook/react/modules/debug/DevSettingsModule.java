--- ./ReactAndroid/src/main/java/com/facebook/react/modules/debug/DevSettingsModule.java	2021-01-28 10:24:44.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/MAC/ReactAndroid/src/main/java/com/facebook/react/modules/debug/DevSettingsModule.java	2022-01-12 15:04:31.000000000 -0800
@@ -118,4 +118,9 @@
   public void removeListeners(double count) {
     // iOS only
   }
+
+  @Override
+  public void setIsSecondaryClickToShowDevMenuEnabled(boolean enabled) {
+    // macOS only.
+  }
 }
