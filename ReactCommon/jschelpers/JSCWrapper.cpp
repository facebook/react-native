/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSCWrapper.h"

#if defined(__APPLE__)

// TODO: use glog in OSS too
#if __has_include(<glog/logging.h>)
#define USE_GLOG 1
#include <glog/logging.h>
#else
#define USE_GLOG 0
#endif

namespace facebook {
namespace react {

static const JSCWrapper* s_customWrapper = nullptr;

bool isCustomJSCWrapperSet() {
  return s_customWrapper != nullptr;
}

const JSCWrapper* customJSCWrapper() {
  #if USE_GLOG
  CHECK(s_customWrapper != nullptr) << "Accessing custom JSC wrapper before it's set";
  #endif
  return s_customWrapper;
}

void setCustomJSCWrapper(const JSCWrapper* wrapper) {
  #if USE_GLOG
  CHECK(s_customWrapper == nullptr) << "Can't set custom JSC wrapper multiple times";
  #endif
  s_customWrapper = wrapper;
}

} }

#endif
