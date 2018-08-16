// Copyright (c) 2018-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include "JSCHelpers.h"

namespace facebook {
namespace react {
__attribute__((visibility("default"))) JSValueRef getRandomValues(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception);
}
}
