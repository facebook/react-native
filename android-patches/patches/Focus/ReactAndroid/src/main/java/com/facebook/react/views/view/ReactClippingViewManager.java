--- ./ReactAndroid/src/main/java/com/facebook/react/views/view/ReactClippingViewManager.java	2021-10-25 12:38:05.000000000 -0700
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/Focus/ReactAndroid/src/main/java/com/facebook/react/views/view/ReactClippingViewManager.java	2022-01-12 15:04:31.000000000 -0800
@@ -7,7 +7,10 @@
 
 package com.facebook.react.views.view;
 
+import android.view.FocusFinder;
 import android.view.View;
+import android.view.ViewGroup;
+import androidx.annotation.NonNull;
 import com.facebook.react.bridge.UiThreadUtil;
 import com.facebook.react.uimanager.ViewGroupManager;
 import com.facebook.react.uimanager.annotations.ReactProp;
@@ -71,10 +74,44 @@
       }
       parent.removeViewWithSubviewClippingEnabled(child);
     } else {
+      // Prevent focus leaks due to removal of a focused View
+      if (parent.getChildAt(index).hasFocus()) {
+        giveFocusToAppropriateView(parent, parent.getChildAt(index));
+      }
       parent.removeViewAt(index);
     }
   }
 
+  private void giveFocusToAppropriateView(@NonNull ViewGroup parent, @NonNull View focusedView) {
+    // Search for appropriate sibling
+    View viewToTakeFocus = null;
+    while (parent != null) {
+      // Search DOWN
+      viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_DOWN);
+      if (viewToTakeFocus == null) {
+        // Search RIGHT
+        viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_RIGHT);
+        if (viewToTakeFocus == null) {
+          // Search UP
+          viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_UP);
+          if (viewToTakeFocus == null) {
+            // Search LEFT
+            viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_LEFT);
+          }
+        }
+      }
+      if (viewToTakeFocus != null || !(parent.getParent() instanceof ViewGroup)) {
+        break;
+      }
+      parent = (ViewGroup) parent.getParent();
+    }
+
+    // Give focus to View
+    if (viewToTakeFocus != null) {
+      viewToTakeFocus.requestFocus();
+    }
+  }
+
   @Override
   public void removeAllViews(T parent) {
     UiThreadUtil.assertOnUiThread();
