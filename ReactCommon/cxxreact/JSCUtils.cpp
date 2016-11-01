// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCUtils.h"

namespace facebook {
namespace react {

String jsStringFromBigString(const JSBigString& bigstr) {
  if (bigstr.isAscii()) {
    return String::createExpectingAscii(bigstr.c_str(), bigstr.size());
  } else {
    return String(bigstr.c_str());
  }
}

}
}
