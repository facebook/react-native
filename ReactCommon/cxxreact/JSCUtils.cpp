// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCUtils.h"

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

std::pair<uint32_t, uint32_t> parseNativeRequireParameters(
    const JSGlobalContextRef& context,
    const JSValueRef arguments[],
    size_t argumentCount) {
  uint32_t moduleId = 0, bundleId = 0;

  // use "getNumber" & "folly::to" to throw explicitely in case of an overflow
  // error during conversion
  if (argumentCount == 1) {
    moduleId = folly::to<uint32_t>(Value(context, arguments[0]).getNumberOrThrow());
  } else if (argumentCount == 2) {
    moduleId = folly::to<uint32_t>(Value(context, arguments[0]).getNumberOrThrow());
    bundleId = folly::to<uint32_t>(Value(context, arguments[1]).getNumberOrThrow());
  } else {
    throw std::invalid_argument("Got wrong number of args");
  }

  return std::make_pair(bundleId, moduleId);
}

}
}
