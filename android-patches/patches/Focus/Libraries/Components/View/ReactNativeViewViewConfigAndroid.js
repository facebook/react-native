diff --git a/Libraries/Components/View/ReactNativeViewViewConfigAndroid.js b/Libraries/Components/View/ReactNativeViewViewConfigAndroid.js
index ad2542dfa..b6d868022 100644
--- a/Libraries/Components/View/ReactNativeViewViewConfigAndroid.js
+++ b/Libraries/Components/View/ReactNativeViewViewConfigAndroid.js
@@ -19,6 +19,12 @@ const ReactNativeViewViewConfigAndroid = {
         captured: 'onSelectCapture',
       },
     },
+    topOnFocusChange: {
+      phasedRegistrationNames: {
+      bubbled: 'onFocusChange',
+      captured: 'onFocusChangeCapture',
+      },
+    },
     topAssetDidLoad: {
       phasedRegistrationNames: {
         bubbled: 'onAssetDidLoad',
