--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\dialog\\DialogModule.java"	2020-01-30 13:55:48.329611400 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\dialog\\DialogModule.java"	2020-01-29 14:10:09.414918100 -0800
@@ -13,7 +13,6 @@
 import android.content.DialogInterface.OnDismissListener;
 import android.os.Bundle;
 import androidx.fragment.app.FragmentActivity;
-import androidx.fragment.app.FragmentManager;
 
 import com.facebook.common.logging.FLog;
 import com.facebook.react.bridge.Callback;
@@ -68,13 +67,31 @@
     return NAME;
   }
 
+  /**
+   * Helper to allow this module to work with both the standard FragmentManager
+   * and the Support/AndroidX FragmentManager (for apps that need to use the former for legacy reasons).
+   * Since the two APIs don't share a common interface there's unfortunately some
+   * code duplication.
+   * Please not that the direct usage of standard FragmentManager is deprecated in API v28
+   */
   private class FragmentManagerHelper {
-    private final @Nonnull FragmentManager mFragmentManager;
+    private final @Nonnull androidx.fragment.app.FragmentManager mFragmentManager;
+    private final @Nullable android.app.FragmentManager mPlatformFragmentManager;
 
     private @Nullable Object mFragmentToShow;
 
-    public FragmentManagerHelper(@Nonnull FragmentManager fragmentManager) {
+    private boolean isUsingPlatformFragmentManager() {
+      return mPlatformFragmentManager != null;
+    }
+
+    public FragmentManagerHelper(android.app.FragmentManager platformFragmentManager) {
+      mFragmentManager = null;
+      mPlatformFragmentManager = platformFragmentManager;
+    }
+
+    public FragmentManagerHelper(@Nonnull androidx.fragment.app.FragmentManager fragmentManager) {
       mFragmentManager = fragmentManager;
+      mPlatformFragmentManager = null;
     }
 
     public void showPendingAlert() {
@@ -85,7 +102,11 @@
       }
 
       dismissExisting();
-      ((AlertFragment) mFragmentToShow).show(mFragmentManager, FRAGMENT_TAG);
+      if(isUsingPlatformFragmentManager()) {
+        ((PlatformAlertFragment) mFragmentToShow).show(mPlatformFragmentManager, FRAGMENT_TAG);
+      } else {
+        ((AlertFragment) mFragmentToShow).show(mFragmentManager, FRAGMENT_TAG);
+      }
       mFragmentToShow = null;
     }
 
@@ -93,10 +114,19 @@
       if (!mIsInForeground) {
         return;
       }
-      AlertFragment oldFragment =
-        (AlertFragment) mFragmentManager.findFragmentByTag(FRAGMENT_TAG);
-      if (oldFragment != null && oldFragment.isResumed()) {
-        oldFragment.dismiss();
+
+      if(isUsingPlatformFragmentManager()) {
+        PlatformAlertFragment oldFragment =
+          (PlatformAlertFragment) mPlatformFragmentManager.findFragmentByTag(FRAGMENT_TAG);
+        if (oldFragment != null && oldFragment.isResumed()) {
+          oldFragment.dismiss();
+        }
+      } else {
+        AlertFragment oldFragment =
+          (AlertFragment) mFragmentManager.findFragmentByTag(FRAGMENT_TAG);
+        if (oldFragment != null && oldFragment.isResumed()) {
+          oldFragment.dismiss();
+        }
       }
     }
 
@@ -108,14 +138,26 @@
       AlertFragmentListener actionListener =
           actionCallback != null ? new AlertFragmentListener(actionCallback) : null;
 
-      AlertFragment alertFragment = new AlertFragment(actionListener, arguments);
-      if (mIsInForeground && !mFragmentManager.isStateSaved()) {
-        if (arguments.containsKey(KEY_CANCELABLE)) {
-          alertFragment.setCancelable(arguments.getBoolean(KEY_CANCELABLE));
+      if(isUsingPlatformFragmentManager()) {
+        PlatformAlertFragment PlatformAlertFragment = new PlatformAlertFragment(actionListener, arguments);
+        if (mIsInForeground && !mPlatformFragmentManager.isStateSaved()) {
+          if (arguments.containsKey(KEY_CANCELABLE)) {
+            PlatformAlertFragment.setCancelable(arguments.getBoolean(KEY_CANCELABLE));
+          }
+          PlatformAlertFragment.show(mPlatformFragmentManager, FRAGMENT_TAG);
+        } else {
+          mFragmentToShow = PlatformAlertFragment;
         }
-        alertFragment.show(mFragmentManager, FRAGMENT_TAG);
       } else {
-        mFragmentToShow = alertFragment;
+        AlertFragment alertFragment = new AlertFragment(actionListener, arguments);
+        if (mIsInForeground && !mFragmentManager.isStateSaved()) {
+          if (arguments.containsKey(KEY_CANCELABLE)) {
+            alertFragment.setCancelable(arguments.getBoolean(KEY_CANCELABLE));
+          }
+          alertFragment.show(mFragmentManager, FRAGMENT_TAG);
+        } else {
+          mFragmentToShow = alertFragment;
+        }
       }
     }
   }
@@ -242,6 +284,13 @@
     if (activity == null) {
       return null;
     }
-    return new FragmentManagerHelper(((FragmentActivity) activity).getSupportFragmentManager());
+
+    if(activity instanceof FragmentActivity) {
+      return new FragmentManagerHelper(((FragmentActivity) activity).getSupportFragmentManager());
+    } else if(activity.getFragmentManager() != null){
+      return new FragmentManagerHelper(activity.getFragmentManager());
+    } else {
+      return null;
+    }
   }
 }
