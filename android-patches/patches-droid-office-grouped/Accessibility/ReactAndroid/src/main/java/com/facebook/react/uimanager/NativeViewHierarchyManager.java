--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\NativeViewHierarchyManager.java"	2020-01-30 13:55:48.364581100 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\NativeViewHierarchyManager.java"	2020-01-29 14:10:09.447888300 -0800
@@ -860,4 +860,34 @@
     }
     view.sendAccessibilityEvent(eventType);
   }
+
+  public void performAccessibilityAction(int tag, final int action) {
+    View view = mTagsToViews.get(tag);
+    if (view == null) {
+      throw new JSApplicationIllegalArgumentException("Could not find view with tag " + tag);
+    }
+    view.post(
+      new Runnable() {
+        @Override
+        public void run() {
+          view.performAccessibilityAction(action, null);
+        }
+      }
+    );
+  }
+
+  public void announceForAccessibility(int tag, final String announcement) {
+    View view = mTagsToViews.get(tag);
+    if (view == null) {
+      throw new JSApplicationIllegalArgumentException("Could not find view with tag " + tag);
+    }
+    view.post(
+      new Runnable() {
+        @Override
+        public void run() {
+          view.announceForAccessibility(announcement);
+        }
+      }
+    );
+  }
 }
