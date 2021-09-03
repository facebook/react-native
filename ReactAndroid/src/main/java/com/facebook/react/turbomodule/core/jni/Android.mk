# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

#########################
### callinvokerholder ###
#########################

include $(CLEAR_VARS)

# Header search path for all source files in this module.
LOCAL_C_INCLUDES := $(LOCAL_PATH)/ReactCommon

# Header search path for modules that depend on this module
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall

LOCAL_SHARED_LIBRARIES = libfb libfbjni libreactnativeutilsjni

LOCAL_STATIC_LIBRARIES = libcallinvoker libreactperfloggerjni libruntimeexecutor

# Name of this module.
LOCAL_MODULE := callinvokerholder

# Compile all local c++ files
LOCAL_SRC_FILES := $(LOCAL_PATH)/ReactCommon/CallInvokerHolder.cpp

# Build the files in this directory as a shared library
include $(BUILD_STATIC_LIBRARY)

##################################
### react_nativemodule_manager ###
##################################

include $(CLEAR_VARS)

# Name of this module.
# TODO: rename to react_nativemodule_manager
LOCAL_MODULE := turbomodulejsijni

# Header search path for all source files in this module.
LOCAL_C_INCLUDES := $(LOCAL_PATH)/ReactCommon

# Header search path for modules that depend on this module
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)

LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall

LOCAL_SHARED_LIBRARIES = libfb libfbjni libreact_nativemodule_core

LOCAL_STATIC_LIBRARIES = libcallinvokerholder libreactperfloggerjni

# Compile all local c++ files
LOCAL_SRC_FILES := $(LOCAL_PATH)/ReactCommon/TurboModuleManager.cpp $(LOCAL_PATH)/ReactCommon/OnLoad.cpp

# Build the files in this directory as a shared library
include $(BUILD_SHARED_LIBRARY)
