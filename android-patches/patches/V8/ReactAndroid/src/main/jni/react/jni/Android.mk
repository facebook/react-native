--- ./ReactAndroid/src/main/jni/react/jni/Android.mk	2022-01-11 17:41:29.000000000 -0800
+++ /var/folders/vs/8_b205053dddbcv7btj0w0v80000gn/T/update-1h8V3n/merge/V8/ReactAndroid/src/main/jni/react/jni/Android.mk	2022-01-12 15:04:31.000000000 -0800
@@ -129,6 +129,7 @@
 $(call import-module,reactperflogger)
 $(call import-module,hermes)
 $(call import-module,runtimeexecutor)
+$(call import-module,v8jsi)
 $(call import-module,react/renderer/runtimescheduler)
 $(call import-module,react/nativemodule/core)
 
@@ -147,5 +148,6 @@
 include $(REACT_SRC_DIR)/../hermes/reactexecutor/Android.mk
 include $(REACT_SRC_DIR)/../hermes/instrumentation/Android.mk
 include $(REACT_SRC_DIR)/modules/blob/jni/Android.mk
+include $(REACT_SRC_DIR)/v8executor/Android.mk
 
 include $(REACT_GENERATED_SRC_DIR)/codegen/jni/Android.mk
