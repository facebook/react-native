--- /home/mganandraj/code/react-native-0.62.2/ReactAndroid/src/main/jni/react/jni/Android.mk	2020-06-15 22:46:29.917863761 -0700
+++ /home/mganandraj/code/react-native-macos/ReactAndroid/src/main/jni/react/jni/Android.mk	2020-06-15 23:14:47.937510703 -0700
@@ -70,6 +70,7 @@
 $(call import-module,jsiexecutor)
 $(call import-module,callinvoker)
 $(call import-module,hermes)
+$(call import-module,v8jsi)
 
 include $(REACT_SRC_DIR)/turbomodule/core/jni/Android.mk
 
@@ -81,3 +82,4 @@
 include $(REACT_SRC_DIR)/../hermes/reactexecutor/Android.mk
 include $(REACT_SRC_DIR)/../hermes/instrumentation/Android.mk
 include $(REACT_SRC_DIR)/modules/blob/jni/Android.mk
+include $(REACT_SRC_DIR)/v8executor/Android.mk
\ No newline at end of file
