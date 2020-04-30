--- "D:\\code\\work\\rn-62-db\\ReactCommon\\jsi\\Android.mk"	2020-04-27 19:36:21.995306800 -0700
+++ "D:\\code\\work\\rn-62-d\\ReactCommon\\jsi\\Android.mk"	2020-04-30 15:40:41.727235300 -0700
@@ -24,7 +24,7 @@
 
 LOCAL_MODULE := jscruntime
 
-LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
+LOCAL_SRC_FILES := JSCRuntime.cpp
 
 LOCAL_C_INCLUDES := $(LOCAL_PATH)
 LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)
@@ -33,3 +33,26 @@
 LOCAL_SHARED_LIBRARIES := libfolly_json libjsc glog
 
 include $(BUILD_STATIC_LIBRARY)
+
+include $(CLEAR_VARS)
+
+LOCAL_MODULE := v8runtime
+
+LOCAL_SRC_FILES := \
+    FileUtils.cpp \
+    V8Runtime_shared.cpp \
+    V8Runtime_basic.cpp \
+    V8Runtime_droid.cpp \
+    V8Platform.cpp \
+
+LOCAL_C_INCLUDES := $(LOCAL_PATH) $(LOCAL_PATH)/..
+LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)
+
+LOCAL_CFLAGS := -fexceptions -frtti -O3
+LOCAL_SHARED_LIBRARIES := libfolly_json glog libv8 libv8platform libv8base
+
+include $(BUILD_STATIC_LIBRARY)
+
+$(call import-module,v8base)
+$(call import-module,v8)
+$(call import-module,v8platform)
\ No newline at end of file
