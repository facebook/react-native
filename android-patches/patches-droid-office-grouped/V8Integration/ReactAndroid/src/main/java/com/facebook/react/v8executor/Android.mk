--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\Android.mk"	1969-12-31 16:00:00.000000000 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\v8executor\\Android.mk"	2020-01-29 14:10:09.468888200 -0800
@@ -0,0 +1,21 @@
+# Copyright (c) Facebook, Inc. and its affiliates.
+#
+# This source code is licensed under the MIT license found in the
+# LICENSE file in the root directory of this source tree.
+
+LOCAL_PATH := $(call my-dir)
+
+include $(CLEAR_VARS)
+
+LOCAL_MODULE := v8executor
+
+LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
+
+LOCAL_C_INCLUDES := $(LOCAL_PATH) $(THIRD_PARTY_NDK_SRC_DIR)/..
+
+LOCAL_CFLAGS += -fvisibility=hidden -fexceptions -frtti
+
+LOCAL_STATIC_LIBRARIES := libjsi libjsireact v8runtime
+LOCAL_SHARED_LIBRARIES := libfolly_json libfb libreactnativejni
+
+include $(BUILD_SHARED_LIBRARY)
