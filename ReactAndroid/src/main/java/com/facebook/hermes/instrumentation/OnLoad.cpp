// Copyright 2004-present Facebook. All Rights Reserved.

#include "HermesSamplingProfiler.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* reserved) {
  return facebook::jni::initialize(vm, [] {
    facebook::jsi::jni::HermesSamplingProfiler::registerNatives();
  });
}
