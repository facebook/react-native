--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\jni\\third-party\\double-conversion\\Android.mk"	2020-01-29 14:11:26.493527900 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\jni\\third-party\\double-conversion\\Android.mk"	2020-02-19 13:19:36.173821500 -0800
@@ -16,7 +16,7 @@
 
 LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)
 
-CXX11_FLAGS := -Wno-unused-variable -Wno-unused-local-typedefs
+CXX11_FLAGS := -Wno-unused-variable -Wno-unused-local-typedefs -Wno-unneeded-internal-declaration
 LOCAL_CFLAGS += $(CXX11_FLAGS)
 
 include $(BUILD_STATIC_LIBRARY)
