// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "JSCUtils.h"

#include "RAMBundleRegistry.h"

#include <folly/Conv.h>

namespace facebook {
namespace react {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr) {
  if (bigstr.isAscii()) {
    return String::createExpectingAscii(ctx, bigstr.c_str(), bigstr.size());
  } else {
    return String(ctx, bigstr.c_str());
  }
}

}
}
