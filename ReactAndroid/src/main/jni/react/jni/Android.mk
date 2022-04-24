# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


##########################
### React Native Utils ###
##########################

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

# Include . in the header search path for all source files in this module.
LOCAL_C_INCLUDES := $(LOCAL_PATH)

# Include ./../../ in the header search path for modules that depend on
# reactnativejni. This will allow external modules to require this module's
# headers using #include <react/jni/<header>.h>, assuming:
#   .     == jni
#   ./../ == react
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/../..

LOCAL_CFLAGS += -fexceptions -frtti -Wno-unused-lambda-capture

LOCAL_LDLIBS += -landroid

# The dynamic libraries (.so files) that this module depends on.
LOCAL_SHARED_LIBRARIES := \
  libfb \
  libfbjni \
  libfolly_json \
  libglog_init \
  libreact_render_runtimescheduler \
  libruntimeexecutor \
  libyoga

# The static libraries (.a files) that this module depends on.
LOCAL_STATIC_LIBRARIES := libreactnative libcallinvokerholder

# Name of this module.
#
# Other modules can depend on this one by adding libreactnativejni to their
# LOCAL_SHARED_LIBRARIES variable.
LOCAL_MODULE := reactnativeutilsjni

# Compile all local c++ files.
LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
LOCAL_SRC_FILES := $(subst $(LOCAL_PATH)/,,$(LOCAL_SRC_FILES))

ifeq ($(APP_OPTIM),debug)
  # Keep symbols by overriding the strip command invoked by ndk-build.
  # Note that this will apply to all shared libraries,
  # i.e. shared libraries will NOT be stripped
  # even though we override it in this Android.mk
  cmd-strip :=
endif

# Build the files in this directory as a shared library
include $(BUILD_SHARED_LIBRARY)





######################
### reactnativejni ###
######################

include $(CLEAR_VARS)

# Include . in the header search path for all source files in this module.
LOCAL_C_INCLUDES := $(LOCAL_PATH)

# Include ./../../ in the header search path for modules that depend on
# reactnativejni. This will allow external modules to require this module's
# headers using #include <react/jni/<header>.h>, assuming:
#   .     == jni
#   ./../ == react
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/../..

LOCAL_CFLAGS += -fexceptions -frtti -Wno-unused-lambda-capture

LOCAL_LDLIBS += -landroid

# The dynamic libraries (.so files) that this module depends on.
LOCAL_SHARED_LIBRARIES := \
  libfb \
  libfbjni \
  libfolly_json \
  libglog_init \
  libreact_render_runtimescheduler \
  libreactnativeutilsjni \
  libruntimeexecutor \
  libyoga \
  logger

# The static libraries (.a files) that this module depends on.
LOCAL_STATIC_LIBRARIES := libreactnative libcallinvokerholder

# Name of this module.
#
# Other modules can depend on this one by adding libreactnativejni to their
# LOCAL_SHARED_LIBRARIES variable.
LOCAL_MODULE := reactnativejni

# Compile all local c++ files.
LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
LOCAL_SRC_FILES := $(subst $(LOCAL_PATH)/,,$(LOCAL_SRC_FILES))

ifeq ($(APP_OPTIM),debug)
  # Keep symbols by overriding the strip command invoked by ndk-build.
  # Note that this will apply to all shared libraries,
  # i.e. shared libraries will NOT be stripped
  # even though we override it in this Android.mk
  cmd-strip :=
endif

# Build the files in this directory as a shared library
include $(BUILD_SHARED_LIBRARY)

# Compile the c++ dependencies required for ReactAndroid
#
# How does the import-module function work?
#   For each $(call import-module,<module-dir>), you search the directories in
#   NDK_MODULE_PATH. (This variable is defined in Application.mk). If you find a
#   <module-dir>/Android.mk you in a directory <dir>, you run:
#   include <dir>/<module-dir>/Android.mk
#
# What does it mean to include an Android.mk file?
#   Whenever you encounter an include <dir>/<module-dir>/Android.mk, you
#   tell andorid-ndk to compile the module in <dir>/<module-dir> according
#   to the specification inside <dir>/<module-dir>/Android.mk.
$(call import-module,butter)
$(call import-module,folly)
$(call import-module,fb)
$(call import-module,fbjni)
$(call import-module,jsc)
$(call import-module,fbgloginit)
$(call import-module,yogajni)
$(call import-module,cxxreact)
$(call import-module,jsi)
$(call import-module,jsiexecutor)
$(call import-module,logger)
$(call import-module,callinvoker)
$(call import-module,reactperflogger)
$(call import-module,hermes)
$(call import-module,runtimeexecutor)
$(call import-module,react/renderer/runtimescheduler)
$(call import-module,react/nativemodule/core)

include $(REACT_SRC_DIR)/reactperflogger/jni/Android.mk
# TODO (T48588859): Restructure this target to align with dir structure: "react/nativemodule/..."
# Note: Update this only when ready to minimize breaking changes.
include $(REACT_SRC_DIR)/turbomodule/core/jni/Android.mk
include $(REACT_SRC_DIR)/fabric/jni/Android.mk
include $(REACT_SRC_DIR)/common/mapbuffer/jni/Android.mk

# TODO(ramanpreet):
#   Why doesn't this import-module call generate a jscexecutor.so file?
# $(call import-module,jscexecutor)

include $(REACT_SRC_DIR)/jscexecutor/Android.mk
include $(REACT_SRC_DIR)/../hermes/reactexecutor/Android.mk
include $(REACT_SRC_DIR)/../hermes/instrumentation/Android.mk
include $(REACT_SRC_DIR)/modules/blob/jni/Android.mk

include $(REACT_GENERATED_SRC_DIR)/codegen/jni/Android.mk
