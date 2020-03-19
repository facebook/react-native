--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\scroll\\ReactScrollViewManager.java"	2020-01-30 13:55:48.412612200 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\scroll\\ReactScrollViewManager.java"	2020-01-29 14:10:09.560919500 -0800
@@ -70,6 +70,10 @@
   @ReactProp(name = "scrollEnabled", defaultBoolean = true)
   public void setScrollEnabled(ReactScrollView view, boolean value) {
     view.setScrollEnabled(value);
+
+    // Set focusable to match whether scroll is enabled. This improves keyboarding
+    // experience by not making scrollview a tab stop when you cannot interact with it.
+    view.setFocusable(value);
   }
 
   @ReactProp(name = "showsVerticalScrollIndicator")
