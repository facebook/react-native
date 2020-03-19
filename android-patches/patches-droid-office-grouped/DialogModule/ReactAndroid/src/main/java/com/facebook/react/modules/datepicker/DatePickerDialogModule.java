--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\datepicker\\DatePickerDialogModule.java"	2020-01-30 13:55:48.325611500 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\datepicker\\DatePickerDialogModule.java"	2020-01-29 14:10:09.409919400 -0800
@@ -7,7 +7,7 @@
 
 package com.facebook.react.modules.datepicker;
 
-
+import android.app.Activity;
 import android.app.DatePickerDialog.OnDateSetListener;
 import android.content.DialogInterface;
 import android.content.DialogInterface.OnDismissListener;
@@ -112,14 +112,16 @@
    */
   @ReactMethod
   public void open(@Nullable final ReadableMap options, Promise promise) {
-    FragmentActivity activity = (FragmentActivity) getCurrentActivity();
-    if (activity == null) {
+    Activity raw_activity = getCurrentActivity();
+    if (raw_activity == null || !(raw_activity instanceof FragmentActivity)) {
       promise.reject(
           ERROR_NO_ACTIVITY,
-          "Tried to open a DatePicker dialog while not attached to an Activity");
+          "Tried to open a DatePicker dialog while not attached to a FragmentActivity");
       return;
     }
 
+    FragmentActivity activity = (FragmentActivity) raw_activity;
+
     FragmentManager fragmentManager = activity.getSupportFragmentManager();
     DialogFragment oldFragment = (DialogFragment) fragmentManager.findFragmentByTag(FRAGMENT_TAG);
     if (oldFragment != null) {
