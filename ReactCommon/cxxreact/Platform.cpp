// Copyright 2004-present Facebook. All Rights Reserved.

#include "Platform.h"

namespace facebook {
namespace react {

namespace ReactMarker {
LogMarker logMarker;
};

namespace PerfLogging {
InstallNativeHooks installNativeHooks;
};

namespace JSNativeHooks {
Hook loggingHook = nullptr;
Hook nowHook = nullptr;
}

} }
