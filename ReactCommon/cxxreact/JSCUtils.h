// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxreact/JSBigString.h>
#include <jschelpers/JavaScriptCore.h>
#include <jschelpers/Value.h>

namespace facebook {
namespace react {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

/**
 * Parses "nativeRequire" parameters
 * and returns pair of "bundle id" & "module id" values
 */
std::pair<uint32_t, uint32_t> parseNativeRequireParameters(const JSGlobalContextRef& context,
                                                           const JSValueRef arguments[],
                                                           size_t argumentCount);

}
}
