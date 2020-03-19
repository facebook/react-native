--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\dialog\\PlatformAlertFragment.java"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\modules\\dialog\\PlatformAlertFragment.java"	2020-01-29 14:10:09.414918100 -0800
@@ -0,0 +1,93 @@
+/**
+ * Copyright (c) Facebook, Inc. and its affiliates.
+ *
+ * This source code is licensed under the MIT license found in the
+ * LICENSE file in the root directory of this source tree.
+ */
+
+package com.facebook.react.modules.dialog;
+
+import javax.annotation.Nullable;
+
+import android.annotation.SuppressLint;
+import android.app.AlertDialog;
+import android.app.Dialog;
+import android.app.DialogFragment;
+import android.content.DialogInterface;
+import android.content.Context;
+import android.os.Bundle;
+
+/**
+ * A fragment used to display the dialog based on the platform DialogFragment control. Please note that the usage of this control is deprecated in API v28 in favor of the newer Jetpack/Support controls.
+ */
+public class PlatformAlertFragment extends DialogFragment implements DialogInterface.OnClickListener {
+  /* package */ static final String ARG_TITLE = "title";
+  /* package */ static final String ARG_MESSAGE = "message";
+  /* package */ static final String ARG_BUTTON_POSITIVE = "button_positive";
+  /* package */ static final String ARG_BUTTON_NEGATIVE = "button_negative";
+  /* package */ static final String ARG_BUTTON_NEUTRAL = "button_neutral";
+  /* package */ static final String ARG_ITEMS = "items";
+
+  private final @Nullable DialogModule.AlertFragmentListener mListener;
+
+  public PlatformAlertFragment() {
+    mListener = null;
+  }
+
+  @SuppressLint("ValidFragment")
+  public PlatformAlertFragment(@Nullable DialogModule.AlertFragmentListener listener, Bundle arguments) {
+    mListener = listener;
+    setArguments(arguments);
+  }
+
+
+  public static Dialog createDialog(
+    Context activityContext, Bundle arguments, DialogInterface.OnClickListener fragment) {
+    AlertDialog.Builder builder = new AlertDialog.Builder(activityContext)
+      .setTitle(arguments.getString(ARG_TITLE));
+
+    if (arguments.containsKey(ARG_BUTTON_POSITIVE)) {
+      builder.setPositiveButton(arguments.getString(ARG_BUTTON_POSITIVE), fragment);
+    }
+
+    if (arguments.containsKey(ARG_BUTTON_NEGATIVE)) {
+      builder.setNegativeButton(arguments.getString(ARG_BUTTON_NEGATIVE), fragment);
+    }
+
+    if (arguments.containsKey(ARG_BUTTON_NEUTRAL)) {
+      builder.setNeutralButton(arguments.getString(ARG_BUTTON_NEUTRAL), fragment);
+    }
+
+    // if both message and items are set, Android will only show the message
+    // and ignore the items argument entirely
+    if (arguments.containsKey(ARG_MESSAGE)) {
+      builder.setMessage(arguments.getString(ARG_MESSAGE));
+    }
+
+    if (arguments.containsKey(ARG_ITEMS)) {
+      builder.setItems(arguments.getCharSequenceArray(ARG_ITEMS), fragment);
+    }
+
+    return builder.create();
+  }
+
+  @Override
+  public Dialog onCreateDialog(Bundle savedInstanceState) {
+    return createDialog(getActivity(), getArguments(), this);
+  }
+
+  @Override
+  public void onClick(DialogInterface dialog, int which) {
+    if (mListener != null) {
+      mListener.onClick(dialog, which);
+    }
+  }
+
+  @Override
+  public void onDismiss(DialogInterface dialog) {
+    super.onDismiss(dialog);
+    if (mListener != null) {
+      mListener.onDismiss(dialog);
+    }
+  }
+}
