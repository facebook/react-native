--- ./Libraries/Components/View/ReactNativeViewViewConfigAndroid.js	2021-11-08 14:22:26.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/Focus/Libraries/Components/View/ReactNativeViewViewConfigAndroid.js	2022-01-12 15:04:31.000000000 -0800
@@ -19,6 +19,12 @@
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
