--- "E:\\github\\ms-react-native-forpatch\\Libraries\\Components\\TextInput\\TextInput.js"	2020-03-01 18:40:54.730428400 -0800
+++ "E:\\github\\ms-react-native-minus\\Libraries\\Components\\TextInput\\TextInput.js"	2020-03-01 18:45:49.735945800 -0800
@@ -1267,6 +1267,15 @@
   },
 
   _onFocus: function(event: FocusEvent) {
+    // [TODO(android ISS)
+    // Set the focused TextInput field info in TextInputState.
+    // Delaying this to onFocus native event ensures that -
+    // 1. The state is updated only after the native code completes setting focus on the view
+    // 2. In case the focus is moving from one TextInput(A) to another TextInput(B), the state of
+    //    A needs to be updated (blurred) before info about B is updated in TestInputState.
+    TextInputState.setFocusedTextInput(
+      ReactNative.findNodeHandle(this._inputRef),
+    ); // ]TODO(android ISS)
     if (this.props.onFocus) {
       this.props.onFocus(event);
     }
@@ -1362,7 +1371,17 @@
   _onBlur: function(event: BlurEvent) {
     // This is a hack to fix https://fburl.com/toehyir8
     // @todo(rsnara) Figure out why this is necessary.
-    this.blur();
+    // this.blur();
+    // [TODO(android ISS) removed: this.blur();
+    // Set the focused TextInput field info in TextInputState.
+    // Delaying this to onBlur native event ensures that -
+    // 1. The state is updated only after the native code completes clearing focus on the view
+    // 2. In case the focus is moving from one TextInput(A) to another TextInput(B), the state of
+    //    A needs to be updated (blurred) before info about B is updated in TestInputState.
+    TextInputState.clearFocusedTextInput(
+      ReactNative.findNodeHandle(this._inputRef),
+    ); // ]TODO(android ISS)
+
     if (this.props.onBlur) {
       this.props.onBlur(event);
     }
