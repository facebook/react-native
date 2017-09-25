// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCUtils.h"

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
  double moduleId = 0, bundleId = 0;

  if (argumentCount == 1) {
    moduleId = Value(context, arguments[0]).asNumber();
  } else if (argumentCount == 2) {
    moduleId = Value(context, arguments[0]).asNumber();
    bundleId = Value(context, arguments[1]).asNumber();
  } else {
    throw std::invalid_argument("Got wrong number of args");
  }

  if (moduleId < 0) {
    throw std::invalid_argument(folly::to<std::string>("Received invalid module ID: ",
                                                       Value(context, arguments[0]).toString().str()));
  }

  if (bundleId < 0) {
    throw std::invalid_argument(folly::to<std::string>("Received invalid bundle ID: ",
                                                       Value(context, arguments[1]).toString().str()));
  }

  return std::make_pair(static_cast<uint32_t>(bundleId), static_cast<uint32_t>(moduleId));
}

}
}
