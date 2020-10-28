--- "E:\\github\\rnm-63-fresh\\ReactAndroid\\src\\main\\jni\\react\\jni\\Android.mk"	2020-10-27 20:26:17.023172300 -0700
+++ "E:\\github\\rnm-63\\ReactAndroid\\src\\main\\jni\\react\\jni\\Android.mk"	2020-10-13 21:47:10.404176500 -0700
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
