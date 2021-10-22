--- "E:\\gh\\react-native-macos2\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\debug\\DevSettingsModule.java"	2021-08-31 19:52:47.502468000 -0700
+++ "E:\\gh\\react-native-macos\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\debug\\DevSettingsModule.java"	2021-10-20 19:29:11.611192200 -0700
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
