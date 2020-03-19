--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\UIViewOperationQueue.java"	2020-01-30 13:55:48.376580200 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\uimanager\\UIViewOperationQueue.java"	2020-01-29 14:10:09.456887400 -0800
@@ -546,6 +546,36 @@
     }
   }
 
+  private final class PerformAccessibilityAction extends ViewOperation {
+
+    private final int mAction;
+
+    private PerformAccessibilityAction(int tag, int action) {
+      super(tag);
+      mAction = action;
+    }
+
+    @Override
+    public void execute() {
+      mNativeViewHierarchyManager.performAccessibilityAction(mTag, mAction);
+    }
+  }
+ 
+   private final class AnnounceForAccessibility extends ViewOperation {
+
+    private final String mAnnouncement;
+
+    private AnnounceForAccessibility(int tag, String announcement) {
+      super(tag);
+      mAnnouncement = announcement;
+    }
+
+    @Override
+    public void execute() {
+      mNativeViewHierarchyManager.announceForAccessibility(mTag, mAnnouncement);
+    }
+  }
+
   private final NativeViewHierarchyManager mNativeViewHierarchyManager;
   private final Object mDispatchRunnablesLock = new Object();
   private final Object mNonBatchedOperationsLock = new Object();
@@ -774,6 +804,14 @@
     mOperations.add(new SendAccessibilityEvent(tag, eventType));
   }
 
+  public void enqueuePerformAccessibilityAction(int tag, int action) {
+    mOperations.add(new PerformAccessibilityAction(tag, action));
+  }
+
+  public void enqueueAnnounceForAccessibility(int tag, String announcement) {
+    mOperations.add(new AnnounceForAccessibility(tag, announcement));
+  }
+
   public void enqueueLayoutUpdateFinished(ReactShadowNode node, UIImplementation.LayoutUpdateListener listener) {
     mOperations.add(new LayoutUpdateFinishedOperation(node, listener));
   }
