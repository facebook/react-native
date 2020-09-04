--- "d:\\code\\work\\rn-62-db\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\dialog\\DialogModule.java"	2020-05-02 18:36:31.775614200 -0700
+++ "D:\\code\\work\\rn-62-d\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\dialog\\DialogModule.java"	2020-05-02 19:27:35.938391300 -0700
@@ -15,7 +15,6 @@
 import androidx.annotation.NonNull;
 import androidx.annotation.Nullable;
 import androidx.fragment.app.FragmentActivity;
-import androidx.fragment.app.FragmentManager;
 import com.facebook.common.logging.FLog;
 import com.facebook.react.bridge.Callback;
 import com.facebook.react.bridge.LifecycleEventListener;
@@ -68,12 +67,23 @@
   }
 
   private class FragmentManagerHelper {
-    private final @NonNull FragmentManager mFragmentManager;
+    private final @NonNull androidx.fragment.app.FragmentManager mFragmentManager;
+    private final @Nullable android.app.FragmentManager mPlatformFragmentManager;
 
     private @Nullable Object mFragmentToShow;
 
-    public FragmentManagerHelper(@NonNull FragmentManager fragmentManager) {
+    private boolean isUsingPlatformFragmentManager() {
+      return mPlatformFragmentManager != null;
+    }
+
+    public FragmentManagerHelper(android.app.FragmentManager platformFragmentManager) {
+      mFragmentManager = null;
+      mPlatformFragmentManager = platformFragmentManager;
+    }
+    
+    public FragmentManagerHelper(@NonNull androidx.fragment.app.FragmentManager fragmentManager) {
       mFragmentManager = fragmentManager;
+      mPlatformFragmentManager = null;
     }
 
     public void showPendingAlert() {
@@ -84,7 +94,12 @@
       }
 
       dismissExisting();
-      ((AlertFragment) mFragmentToShow).show(mFragmentManager, FRAGMENT_TAG);
+      if(isUsingPlatformFragmentManager()) {
+        ((PlatformAlertFragment) mFragmentToShow).show(mPlatformFragmentManager, FRAGMENT_TAG);
+      } else {
+        ((AlertFragment) mFragmentToShow).show(mFragmentManager, FRAGMENT_TAG);
+      }
+        
       mFragmentToShow = null;
     }
 
@@ -92,10 +107,20 @@
       if (!mIsInForeground) {
         return;
       }
-      AlertFragment oldFragment = (AlertFragment) mFragmentManager.findFragmentByTag(FRAGMENT_TAG);
-      if (oldFragment != null && oldFragment.isResumed()) {
-        oldFragment.dismiss();
-      }
+      
+      if(isUsingPlatformFragmentManager()) {
+        PlatformAlertFragment oldFragment =
+          (PlatformAlertFragment) mPlatformFragmentManager.findFragmentByTag(FRAGMENT_TAG);
+        if (oldFragment != null && oldFragment.isResumed()) {
+          oldFragment.dismiss();
+        }
+        } else {
+          AlertFragment oldFragment =
+            (AlertFragment) mFragmentManager.findFragmentByTag(FRAGMENT_TAG);
+          if (oldFragment != null && oldFragment.isResumed()) {
+            oldFragment.dismiss();
+        }
+      }  
     }
 
     public void showNewAlert(Bundle arguments, Callback actionCallback) {
@@ -106,15 +131,27 @@
       AlertFragmentListener actionListener =
           actionCallback != null ? new AlertFragmentListener(actionCallback) : null;
 
-      AlertFragment alertFragment = new AlertFragment(actionListener, arguments);
-      if (mIsInForeground && !mFragmentManager.isStateSaved()) {
-        if (arguments.containsKey(KEY_CANCELABLE)) {
-          alertFragment.setCancelable(arguments.getBoolean(KEY_CANCELABLE));
+      if(isUsingPlatformFragmentManager()) {
+        PlatformAlertFragment platformAlertFragment = new PlatformAlertFragment(actionListener, arguments);
+        if (mIsInForeground) { // isStateSaved not available in sdk v25 and lower
+          if (arguments.containsKey(KEY_CANCELABLE)) {
+            platformAlertFragment.setCancelable(arguments.getBoolean(KEY_CANCELABLE));
+          }
+          platformAlertFragment.show(mPlatformFragmentManager, FRAGMENT_TAG);
+        } else {
+          mFragmentToShow = platformAlertFragment;
         }
-        alertFragment.show(mFragmentManager, FRAGMENT_TAG);
-      } else {
-        mFragmentToShow = alertFragment;
-      }
+      }  else {
+        AlertFragment alertFragment = new AlertFragment(actionListener, arguments);
+        if (mIsInForeground && !mFragmentManager.isStateSaved()) {
+          if (arguments.containsKey(KEY_CANCELABLE)) {
+            alertFragment.setCancelable(arguments.getBoolean(KEY_CANCELABLE));
+          }
+          alertFragment.show(mFragmentManager, FRAGMENT_TAG);
+        } else {
+          mFragmentToShow = alertFragment;
+        }
+      }           
     }
   }
 
@@ -234,9 +271,16 @@
    */
   private @Nullable FragmentManagerHelper getFragmentManagerHelper() {
     Activity activity = getCurrentActivity();
-    if (activity == null || !(activity instanceof FragmentActivity)) {
+    if (activity == null) {
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
