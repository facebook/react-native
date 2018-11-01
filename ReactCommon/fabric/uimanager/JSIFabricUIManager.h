// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <fabric/uimanager/FabricUIManager.h>
#include <folly/dynamic.h>
#include <jsi/jsi.h>

namespace facebook {
namespace react {

void JSIDispatchFabricEventToEmptyTarget(
  jsi::Runtime &runtime,
  const EventHandler &eventHandler,
  const std::string &type,
  const folly::dynamic &payload
);

void JSIDispatchFabricEventToTarget(
  jsi::Runtime &runtime,
  const EventHandler &eventHandler,
  const EventTarget &eventTarget,
  const std::string &type,
  const folly::dynamic &payload
);

void JSIInstallFabricUIManager(
  jsi::Runtime &runtime,
  UIManager &uiManager
);

void JSIUninstallFabricUIManager(
  jsi::Runtime &runtime
);

void JSIStartSurface(
  jsi::Runtime &runtime,
  SurfaceId surfaceId,
  const std::string &moduleName,
  const folly::dynamic &initalProps
);

void JSIStopSurface(
  jsi::Runtime &runtime,
  SurfaceId surfaceId
);

}
}
