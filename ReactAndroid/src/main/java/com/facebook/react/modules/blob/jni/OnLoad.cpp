// Copyright 2004-present Facebook. All Rights Reserved.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include <fb/fbjni.h>

#include "BlobCollector.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *reserved) {
  return facebook::jni::initialize(
      vm, [] { facebook::react::BlobCollector::registerNatives(); });
}
