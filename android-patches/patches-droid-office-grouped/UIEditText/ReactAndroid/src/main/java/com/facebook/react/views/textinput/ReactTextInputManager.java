--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\textinput\\ReactTextInputManager.java"	2020-01-30 13:55:48.435625800 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\textinput\\ReactTextInputManager.java"	2020-01-29 14:10:09.637920700 -0800
@@ -71,6 +71,9 @@
       Spacing.ALL, Spacing.LEFT, Spacing.RIGHT, Spacing.TOP, Spacing.BOTTOM,
   };
 
+  // Focus or blur call on native components (through NativeMethodsMixin) redirects to TextInputState.js
+  // which dispatches focusTextInput or blurTextInput commands. These commands are mapped to FOCUS_TEXT_INPUT=1
+  // and BLUR_TEXT_INPUT=2 in ReactTextInputManager, hence these constants value should be in sync with other ViewManagers.
   private static final int FOCUS_TEXT_INPUT = 1;
   private static final int BLUR_TEXT_INPUT = 2;
 
@@ -715,6 +718,11 @@
     view.setBorderStyle(borderStyle);
   }
 
+  @ReactProp(name = "showSoftInputOnFocus", defaultBoolean = true)
+  public void showKeyboardOnFocus(ReactEditText view, boolean showKeyboardOnFocus) {
+    view.setShowSoftInputOnFocus(showKeyboardOnFocus);
+  }
+
   @ReactPropGroup(names = {
       ViewProps.BORDER_WIDTH,
       ViewProps.BORDER_LEFT_WIDTH,
