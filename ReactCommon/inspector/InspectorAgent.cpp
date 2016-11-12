// Copyright 2004-present Facebook. All Rights Reserved.

#include "InspectorAgent.h"

namespace facebook {
namespace react {

InspectorAgent::InspectorAgent() {
  auto emptyMethod = [](folly::dynamic) -> folly::dynamic {
    return nullptr;
  };

  registerMethod("enable", emptyMethod);
  registerMethod("disable", emptyMethod);
}

void InspectorAgent::detach() {
  sendEvent("detached", folly::dynamic::object("reason", "target_closed"));
}

}
}
