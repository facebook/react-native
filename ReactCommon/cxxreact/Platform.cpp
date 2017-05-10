// Copyright 2004-present Facebook. All Rights Reserved.

#include "Platform.h"

namespace facebook {
namespace react {

namespace ReactMarker {
LogTaggedMarker logTaggedMarker;

void logMarker(const ReactMarkerId markerId) {
  logTaggedMarker(markerId, nullptr);
}

};

namespace PerfLogging {
InstallNativeHooks installNativeHooks;
};

namespace JSNativeHooks {
Hook loggingHook = nullptr;
Hook nowHook = nullptr;
}

} }
