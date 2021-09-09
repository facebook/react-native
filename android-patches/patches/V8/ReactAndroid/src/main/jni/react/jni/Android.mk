diff --git a/ReactAndroid/src/main/jni/react/jni/Android.mk b/ReactAndroid/src/main/jni/react/jni/Android.mk
index 38a51019e..7425e65a5 100644
--- a/ReactAndroid/src/main/jni/react/jni/Android.mk
+++ b/ReactAndroid/src/main/jni/react/jni/Android.mk
@@ -131,6 +131,7 @@ $(call import-module,callinvoker)
 $(call import-module,reactperflogger)
 $(call import-module,hermes)
 $(call import-module,runtimeexecutor)
+$(call import-module,v8jsi)
 
 include $(REACT_SRC_DIR)/reactperflogger/jni/Android.mk
 include $(REACT_SRC_DIR)/turbomodule/core/jni/Android.mk
@@ -147,3 +148,4 @@ include $(REACT_SRC_DIR)/jscexecutor/Android.mk
 include $(REACT_SRC_DIR)/../hermes/reactexecutor/Android.mk
 include $(REACT_SRC_DIR)/../hermes/instrumentation/Android.mk
 include $(REACT_SRC_DIR)/modules/blob/jni/Android.mk
+include $(REACT_SRC_DIR)/v8executor/Android.mk
