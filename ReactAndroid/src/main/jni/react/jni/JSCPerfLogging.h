// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <JavaScriptCore/JSContextRef.h>

namespace facebook {
namespace react {

void addNativePerfLoggingHooks(JSGlobalContextRef ctx);

} }
