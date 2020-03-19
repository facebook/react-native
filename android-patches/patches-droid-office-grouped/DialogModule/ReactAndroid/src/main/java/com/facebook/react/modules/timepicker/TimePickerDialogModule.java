--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\timepicker\\TimePickerDialogModule.java"	2020-01-30 13:55:48.345614000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\timepicker\\TimePickerDialogModule.java"	2020-01-29 14:10:09.432887900 -0800
@@ -7,6 +7,7 @@
 
 package com.facebook.react.modules.timepicker;
 
+import android.app.Activity;
 import android.app.TimePickerDialog.OnTimeSetListener;
 import android.content.DialogInterface;
 import android.content.DialogInterface.OnDismissListener;
@@ -92,13 +93,16 @@
   @ReactMethod
   public void open(@Nullable final ReadableMap options, Promise promise) {
 
-    FragmentActivity activity = (FragmentActivity) getCurrentActivity();
-    if (activity == null) {
+    Activity raw_activity = getCurrentActivity();
+    if (raw_activity == null || !(raw_activity instanceof FragmentActivity)) {
       promise.reject(
-          ERROR_NO_ACTIVITY,
-          "Tried to open a TimePicker dialog while not attached to an Activity");
+        ERROR_NO_ACTIVITY,
+        "Tried to open a DatePicker dialog while not attached to a FragmentActivity");
       return;
     }
+
+    FragmentActivity activity = (FragmentActivity) raw_activity;
+
     // We want to support both android.app.Activity and the pre-Honeycomb FragmentActivity
     // (for apps that use it for legacy reasons). This unfortunately leads to some code duplication.
     FragmentManager fragmentManager = activity.getSupportFragmentManager();
