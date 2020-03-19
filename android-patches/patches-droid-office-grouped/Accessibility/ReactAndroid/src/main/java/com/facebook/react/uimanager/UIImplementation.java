--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\UIImplementation.java"	2020-01-30 13:55:48.374606900 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\UIImplementation.java"	2020-01-29 14:10:09.454918800 -0800
@@ -771,6 +771,14 @@
     mOperationsQueue.enqueueSendAccessibilityEvent(tag, eventType);
   }
 
+   public void performAccessibilityAction(int tag, int action) {
+    mOperationsQueue.enqueuePerformAccessibilityAction(tag, action);
+  }
+
+  public void announceForAccessibility(int tag, String announcement) {
+    mOperationsQueue.enqueueAnnounceForAccessibility(tag, announcement);
+  }
+
   public void onHostResume() {
     mOperationsQueue.resumeFrameCallback();
   }
