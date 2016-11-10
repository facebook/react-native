// Copyright 2004-present Facebook. All Rights Reserved.

#include "PageAgent.h"

namespace facebook {
namespace react {

PageAgent::PageAgent() {
  auto emptyMethod = [](folly::dynamic args) -> folly::dynamic {
    return nullptr;
  };

  registerMethod("enable", emptyMethod);
  registerMethod("disable", emptyMethod);
  registerMethod("getResourceTree", [](folly::dynamic args) -> folly::dynamic {
    return folly::dynamic::object
      ("frameTree", folly::dynamic::object
        ("childFrames", folly::dynamic::array)
        ("resources", folly::dynamic::array)
        ("frame", folly::dynamic::object
          ("id", "1")
          ("loaderId", "1")
          ("name", "main")
          ("url", "")
          ("securityOrigin", "")
          ("mimeType", "application/octet-stream")));
  });
}

}
}
