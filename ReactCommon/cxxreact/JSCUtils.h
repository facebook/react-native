// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <cxxreact/JSBigString.h>
#include <jschelpers/JavaScriptCore.h>
#include <jschelpers/Value.h>

namespace facebook {
namespace react {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
