--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\textinput\\ReactEditText.java"	2020-01-30 13:55:48.432612400 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\textinput\\ReactEditText.java"	2020-01-29 14:10:09.612921100 -0800
@@ -8,6 +8,7 @@
 package com.facebook.react.views.textinput;
 
 import android.content.Context;
+import android.content.res.Configuration;
 import android.graphics.Rect;
 import android.graphics.Typeface;
 import android.graphics.drawable.Drawable;
@@ -61,7 +62,6 @@
   private boolean mIsSettingTextFromJS;
   // This component is controlled, so we want it to get focused only when JS ask it to do so.
   // Whenever android requests focus (which it does for random reasons), it will be ignored.
-  private boolean mIsJSSettingFocus;
   private int mDefaultGravityHorizontal;
   private int mDefaultGravityVertical;
   private int mNativeEventCount;
@@ -98,7 +98,6 @@
     mNativeEventCount = 0;
     mMostRecentEventCount = 0;
     mIsSettingTextFromJS = false;
-    mIsJSSettingFocus = false;
     mBlurOnSubmit = null;
     mDisableFullscreen = false;
     mListeners = null;
@@ -195,29 +194,6 @@
   }
 
   @Override
-  public void clearFocus() {
-    setFocusableInTouchMode(false);
-    super.clearFocus();
-    hideSoftKeyboard();
-  }
-
-  @Override
-  public boolean requestFocus(int direction, Rect previouslyFocusedRect) {
-    // Always return true if we are already focused. This is used by android in certain places,
-    // such as text selection.
-    if (isFocused()) {
-      return true;
-    }
-    if (!mIsJSSettingFocus) {
-      return false;
-    }
-    setFocusableInTouchMode(true);
-    boolean focused = super.requestFocus(direction, previouslyFocusedRect);
-    showSoftKeyboard();
-    return focused;
-  }
-
-  @Override
   public void addTextChangedListener(TextWatcher watcher) {
     if (mListeners == null) {
       mListeners = new ArrayList<>();
@@ -272,6 +248,16 @@
   @Override
   protected void onFocusChanged(
       boolean focused, int direction, Rect previouslyFocusedRect) {
+
+    /**
+     * Setting focusableInTouchMode false upon losing focus ensures that 
+     * any sync requestFocus call should not give focus to this control unless 
+     * it is initiated from JS which will set focusableInTouchMode true 
+     * before calling requestFocus.
+     */
+    if (!focused) {
+      setFocusableInTouchMode(false);
+    }
     super.onFocusChanged(focused, direction, previouslyFocusedRect);
     if (focused && mSelectionWatcher != null) {
       mSelectionWatcher.onSelectionChanged(getSelectionStart(), getSelectionEnd());
@@ -291,12 +277,9 @@
   }
 
   public boolean getBlurOnSubmit() {
-    if (mBlurOnSubmit == null) {
-      // Default blurOnSubmit
-      return isMultiline() ? false : true;
-    }
-
-    return mBlurOnSubmit;
+    // Ignore if Hardware Keyboard is attached (to avoid leaks)
+    // Default Value - true for single line and false for multiline
+    return !isHardwareKeyboardAvailable() && (mBlurOnSubmit != null ? mBlurOnSubmit : !isMultiline() /*default value based on multiline*/);
   }
 
   public void setDisableFullscreenUI(boolean disableFullscreenUI) {
@@ -359,9 +342,13 @@
 
   // VisibleForTesting from {@link TextInputEventsTestCase}.
   public void requestFocusFromJS() {
-    mIsJSSettingFocus = true;
+    // Return if the view is already focused.
+    if (isFocused()) {
+      return;
+    }
+    // Ensure that the control can take focus in touch mode.
+    setFocusableInTouchMode(true);
     requestFocus();
-    mIsJSSettingFocus = false;
   }
 
   /* package */ void clearFocusFromJS() {
@@ -460,11 +447,17 @@
     return true;
   }
 
-  private boolean showSoftKeyboard() {
-    return mInputMethodManager.showSoftInput(this, 0);
+  private boolean isHardwareKeyboardAvailable() {
+    return getContext().getResources().getConfiguration().keyboard != Configuration.KEYBOARD_NOKEYS;
+  }
+
+  protected boolean showSoftKeyboard() {
+      return mInputMethodManager.showSoftInput(this, 0);
   }
 
-  private void hideSoftKeyboard() {
+  protected void hideSoftKeyboard() {
+    // We don't expect the soft keyboard to be up if a hardware keyboard is attached.
+    // But to ensure we do hide the keyboard for all cases, we do this unconditionally.
     mInputMethodManager.hideSoftInputFromWindow(getWindowToken(), 0);
   }
 
