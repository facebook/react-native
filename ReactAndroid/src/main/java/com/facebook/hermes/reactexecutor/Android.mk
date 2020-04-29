# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)
<<<<<<< HEAD

include $(CLEAR_VARS)
REACT_NATIVE := $(LOCAL_PATH)/../../../../../../../..
=======
REACT_NATIVE := $(LOCAL_PATH)/../../../../../../../..

include $(REACT_NATIVE)/ReactCommon/common.mk
include $(CLEAR_VARS)
>>>>>>> fb/0.62-stable

LOCAL_MODULE := hermes-executor-release

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

<<<<<<< HEAD
LOCAL_C_INCLUDES := $(LOCAL_PATH) $(REACT_NATIVE)/ReactCommon/jsi $(REACT_NATIVE)/node_modules/hermes-engine/android/include $(REACT_NATIVE)/../hermes-engine/android/include $(REACT_NATIVE)/../node_modules/hermes-engine/include
=======
LOCAL_C_INCLUDES := $(LOCAL_PATH) $(REACT_NATIVE)/ReactCommon/jsi $(call find-node-module,$(LOCAL_PATH),hermes-engine)/android/include
>>>>>>> fb/0.62-stable

LOCAL_CPP_FEATURES := exceptions

LOCAL_STATIC_LIBRARIES := libjsireact libjsi
<<<<<<< HEAD
LOCAL_SHARED_LIBRARIES := libfolly_json libfb libreactnativejni libhermes
=======
LOCAL_SHARED_LIBRARIES := libfolly_json libfb libfbjni libreactnativejni libhermes
>>>>>>> fb/0.62-stable

include $(BUILD_SHARED_LIBRARY)


include $(CLEAR_VARS)
<<<<<<< HEAD
REACT_NATIVE := $(LOCAL_PATH)/../../../../../../../..
=======
>>>>>>> fb/0.62-stable

LOCAL_MODULE := hermes-executor-debug
LOCAL_CFLAGS := -DHERMES_ENABLE_DEBUGGER=1

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

<<<<<<< HEAD
LOCAL_C_INCLUDES := $(LOCAL_PATH) $(REACT_NATIVE)/ReactCommon/jsi $(REACT_NATIVE)/node_modules/hermes-engine/android/include $(REACT_NATIVE)/../hermes-engine/android/include $(REACT_NATIVE)/../node_modules/hermes-engine/include
=======
LOCAL_C_INCLUDES := $(LOCAL_PATH) $(REACT_NATIVE)/ReactCommon/jsi $(call find-node-module,$(LOCAL_PATH),hermes-engine)/android/include
>>>>>>> fb/0.62-stable

LOCAL_CPP_FEATURES := exceptions

LOCAL_STATIC_LIBRARIES := libjsireact libjsi libhermes-inspector
<<<<<<< HEAD
LOCAL_SHARED_LIBRARIES := libfolly_json libfb libreactnativejni libhermes
=======
LOCAL_SHARED_LIBRARIES := libfolly_json libfb libfbjni libreactnativejni libhermes
>>>>>>> fb/0.62-stable

include $(BUILD_SHARED_LIBRARY)
