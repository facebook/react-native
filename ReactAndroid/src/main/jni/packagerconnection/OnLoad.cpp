// Copyright 2004-present Facebook. All Rights Reserved.

#include <fb/fbjni.h>
#include <jni.h>

#include "SamplingProfilerJniMethod.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

extern "C" JNIEXPORT jint JNI_OnLoad(JavaVM *vm, void *reserved) {
  return initialize(vm, [] { SamplingProfilerJniMethod::registerNatives(); });
}
}
}
