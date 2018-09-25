// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory.h>
#include <jsi/jsi.h>

namespace facebook {
namespace jsc {

std::unique_ptr<jsi::Runtime> makeJSCRuntime();

} // namespace jsc
} // namespace facebook
