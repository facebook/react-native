// Copyright 2004-present Facebook. All Rights Reserved.

#include "Platform.h"

namespace facebook {
namespace react {

namespace ReactMarker {
LogMarker logMarker;
};

namespace MessageQueues {
GetCurrentMessageQueueThread getCurrentMessageQueueThread;
};

namespace WebWorkerUtil {
WebWorkerQueueFactory createWebWorkerThread;
LoadScriptFromAssets loadScriptFromAssets;
LoadScriptFromNetworkSync loadScriptFromNetworkSync;
};

namespace PerfLogging {
InstallNativeHooks installNativeHooks;
};

namespace JSLogging {
JSCNativeHook nativeHook = nullptr;
};

} }
