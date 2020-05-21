--- "E:\\github\\react-native-v62.2\\ReactAndroid\\src\\main\\jni\\third-party\\glog\\Android.mk"	2020-05-20 22:59:33.023816100 -0700
+++ "E:\\github\\msrn-62\\ReactAndroid\\src\\main\\jni\\third-party\\glog\\Android.mk"	2020-05-20 22:07:34.857339100 -0700
@@ -16,6 +16,8 @@
 LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/exported
 
 LOCAL_CFLAGS += \
+  -Wno-unused-variable \
+  -Wno-unused-function \
   -Wwrite-strings \
   -Woverloaded-virtual \
   -Wno-sign-compare \
