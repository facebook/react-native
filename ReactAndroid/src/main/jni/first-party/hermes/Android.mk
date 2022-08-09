# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH:= $(call my-dir)
include $(CLEAR_VARS)
LOCAL_MODULE:= hermes
LOCAL_SRC_FILES := jni/$(TARGET_ARCH_ABI)/libhermes.so
include $(PREBUILT_SHARED_LIBRARY)
