// Copyright 2004-present Facebook. All Rights Reserved.

#include "Platform.h"

namespace facebook {
namespace react {

#if __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wglobal-constructors"
#endif

namespace ReactMarker {
LogTaggedMarker logTaggedMarker = nullptr;

void logMarker(const ReactMarkerId markerId) {
  logTaggedMarker(markerId, nullptr);
}
};

namespace PerfLogging {
InstallNativeHooks installNativeHooks = nullptr;
};

namespace JSNativeHooks {
Hook loggingHook = nullptr;
Hook nowHook = nullptr;
}

#if __clang__
#pragma clang diagnostic pop
#endif

} }
