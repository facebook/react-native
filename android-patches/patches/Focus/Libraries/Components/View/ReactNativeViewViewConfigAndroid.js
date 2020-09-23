--- /home/hermes/code/react-native-macos-fresh/Libraries/Components/View/ReactNativeViewViewConfigAndroid.js	2020-09-21 21:41:24.322788533 -0700
+++ /home/hermes/code/react-native-macos/Libraries/Components/View/ReactNativeViewViewConfigAndroid.js	2020-09-23 12:20:05.571823280 -0700
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
