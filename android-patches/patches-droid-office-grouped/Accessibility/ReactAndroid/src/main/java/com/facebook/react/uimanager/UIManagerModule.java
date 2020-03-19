--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\UIManagerModule.java"	2020-01-30 13:55:48.375580100 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\UIManagerModule.java"	2020-01-29 14:10:09.455919200 -0800
@@ -767,6 +767,16 @@
     mUIImplementation.sendAccessibilityEvent(tag, eventType);
   }
 
+  @ReactMethod
+  public void performAccessibilityAction(int tag, int action) {
+    mUIImplementation.performAccessibilityAction(tag, action);
+  }
+
+  @ReactMethod
+  public void announceForAccessibility(int tag, String announcement) {
+    mUIImplementation.announceForAccessibility(tag, announcement);
+  }
+
   /**
    * Schedule a block to be executed on the UI thread. Useful if you need to execute view logic
    * after all currently queued view updates have completed.
