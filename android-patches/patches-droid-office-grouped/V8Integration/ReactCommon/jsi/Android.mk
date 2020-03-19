--- "e:\\github\\fb-react-native-forpatch-base\\ReactCommon\\jsi\\Android.mk"	2020-01-29 14:11:26.693530200 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactCommon\\jsi\\Android.mk"	2020-01-29 14:10:09.823890600 -0800
@@ -10,7 +10,6 @@
 LOCAL_MODULE := jsi
 
 LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/jsi/*.cpp)
-
 LOCAL_C_INCLUDES := $(LOCAL_PATH)
 LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)
 
@@ -19,17 +18,24 @@
 
 include $(BUILD_STATIC_LIBRARY)
 
-
 include $(CLEAR_VARS)
 
-LOCAL_MODULE := jscruntime
+LOCAL_SRC_FILES := \
+    FileUtils.cpp \
+    V8Runtime_shared.cpp \
+    V8Runtime_basic.cpp \
+    V8Runtime_droid.cpp \
+    V8Platform.cpp \
 
-LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
+LOCAL_MODULE := v8runtime
+LOCAL_SHARED_LIBRARIES := libfolly_json glog libv8 libv8platform libv8base
 
-LOCAL_C_INCLUDES := $(LOCAL_PATH)
+LOCAL_C_INCLUDES := $(LOCAL_PATH) $(LOCAL_PATH)/..
 LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)
 
 LOCAL_CFLAGS := -fexceptions -frtti -O3
-LOCAL_SHARED_LIBRARIES := libfolly_json libjsc glog
-
 include $(BUILD_STATIC_LIBRARY)
+
+$(call import-module,v8base)
+$(call import-module,v8)
+$(call import-module,v8platform)
