--- "E:\\github\\react-native-v62.2\\ReactAndroid\\src\\main\\jni\\third-party\\double-conversion\\Android.mk"	2020-05-20 22:59:33.022816200 -0700
+++ "E:\\github\\msrn-62\\ReactAndroid\\src\\main\\jni\\third-party\\double-conversion\\Android.mk"	2020-05-20 22:07:00.020951300 -0700
@@ -16,7 +16,7 @@
 
 LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)
 
-CXX11_FLAGS := -Wno-unused-variable -Wno-unused-local-typedefs
+CXX11_FLAGS := -Wno-unused-variable -Wno-unused-local-typedefs -Wno-unneeded-internal-declaration
 LOCAL_CFLAGS += $(CXX11_FLAGS)
 
 include $(BUILD_STATIC_LIBRARY)
