/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef __ANDROID__
#error "This file should only be compiled for Android."
#endif

#include <fb/fbjni/References.h>
#include <fb/fbjni/CoreClasses.h>

namespace facebook {
namespace jni {
namespace internal {

static int32_t getApiLevel() {
  auto cls = findClassLocal("android/os/Build$VERSION");
  auto fld = cls->getStaticField<int32_t>("SDK_INT");
  if (fld) {
    return cls->getStaticFieldValue(fld);
  }
  return 0;
}

bool doesGetObjectRefTypeWork() {
  static auto level = getApiLevel();
  return level >= 14;
}

}
}
}
