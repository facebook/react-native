# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)
<<<<<<< HEAD

include $(CLEAR_VARS)
REACT_NATIVE := $(LOCAL_PATH)/../../..
=======
REACT_NATIVE := $(LOCAL_PATH)/../../..

include $(REACT_NATIVE)/ReactCommon/common.mk
include $(CLEAR_VARS)
>>>>>>> fb/0.62-stable

LOCAL_MODULE := hermes-inspector

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp $(LOCAL_PATH)/detail/*.cpp $(LOCAL_PATH)/chrome/*.cpp)

LOCAL_C_ROOT := $(LOCAL_PATH)/../..

<<<<<<< HEAD
LOCAL_CFLAGS := -DHERMES_ENABLE_DEBUGGER=1
LOCAL_C_INCLUDES := $(LOCAL_C_ROOT) $(REACT_NATIVE)/ReactCommon/jsi $(REACT_NATIVE)/node_modules/hermes-engine/android/include $(REACT_NATIVE)/../hermes-engine/android/include $(REACT_NATIVE)/../node_modules/hermes-engine/include
=======
LOCAL_CFLAGS := -DHERMES_ENABLE_DEBUGGER=1 -DHERMES_INSPECTOR_FOLLY_KLUDGE=1
LOCAL_C_INCLUDES := $(LOCAL_C_ROOT) $(REACT_NATIVE)/ReactCommon/jsi $(call find-node-module,$(LOCAL_PATH),hermes-engine)/android/include
>>>>>>> fb/0.62-stable
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_C_ROOT)

LOCAL_CPP_FEATURES := exceptions

LOCAL_STATIC_LIBRARIES := libjsi
<<<<<<< HEAD
LOCAL_SHARED_LIBRARIES := jsinspector libfb libfolly_futures libfolly_json libhermes
=======
LOCAL_SHARED_LIBRARIES := jsinspector libfb libfbjni libfolly_futures libfolly_json libhermes
>>>>>>> fb/0.62-stable

include $(BUILD_SHARED_LIBRARY)
