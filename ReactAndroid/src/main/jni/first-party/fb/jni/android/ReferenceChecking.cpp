/*
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
