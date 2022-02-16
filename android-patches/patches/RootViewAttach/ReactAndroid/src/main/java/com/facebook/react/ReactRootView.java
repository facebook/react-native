--- /dev/code/rnm-66-fresh/ReactAndroid/src/main/java/com/facebook/react/ReactRootView.java	2022-02-13 19:54:48.563686391 -0800
+++ /dev/code/react-native-macos/ReactAndroid/src/main/java/com/facebook/react/ReactRootView.java	2022-02-13 22:34:45.828345952 -0800
@@ -410,6 +410,7 @@
       mInitialUITemplate = initialUITemplate;
 
       mReactInstanceManager.createReactContextInBackground();
+      attachToReactInstanceManager();
 
     } finally {
       Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
