--- "E:\\github\\rnm-63-fresh\\Libraries\\Components\\View\\ReactNativeViewViewConfigAndroid.js"	2020-10-27 20:26:16.000189500 -0700
+++ "E:\\github\\rnm-63\\Libraries\\Components\\View\\ReactNativeViewViewConfigAndroid.js"	2020-10-13 21:21:38.700969000 -0700
@@ -19,6 +19,12 @@
         captured: 'onSelectCapture',
       },
     },
+    topOnFocusChange: {
+      phasedRegistrationNames: {
+        bubbled: 'onFocusChange',
+        captured: 'onFocusChangeCapture',
+      },
+    },
   },
   directEventTypes: {
     topClick: {
