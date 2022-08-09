--- /dev/code/rnm-66-fresh/ReactAndroid/src/main/java/com/facebook/react/ReactRootView.java	2022-02-13 19:54:48.563686391 -0800
+++ /dev/code/react-native-macos/ReactAndroid/src/main/java/com/facebook/react/ReactRootView.java	2022-02-13 22:34:45.828345952 -0800
@@ -441,16 +441,12 @@
       mInitialUITemplate = initialUITemplate;
 
       mReactInstanceManager.createReactContextInBackground();
-      // if in this experiment, we initialize the root earlier in startReactApplication
-      // instead of waiting for the initial measure
-      if (ReactFeatureFlags.enableEagerRootViewAttachment) {
-        if (!mWasMeasured) {
-          // Ideally, those values will be used by default, but we only update them here to scope
-          // this change to `enableEagerRootViewAttachment` experiment.
-          setSurfaceConstraintsToScreenSize();
-        }
-        attachToReactInstanceManager();
-      }
+      if (!mWasMeasured) {
+        // Ideally, those values will be used by default, but we only update them here to scope
+        // this change to `enableEagerRootViewAttachment` experiment.
+        setSurfaceConstraintsToScreenSize();
+      }
+      attachToReactInstanceManager();
     } finally {
       Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
     }
