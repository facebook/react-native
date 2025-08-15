/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LogBoxModule.h"

#include <glog/logging.h>

namespace facebook::react {

LogBoxModule::LogBoxModule(
    std::shared_ptr<CallInvoker> jsInvoker,
    std::shared_ptr<SurfaceDelegate> surfaceDelegate)
    : NativeLogBoxCxxSpec(jsInvoker),
      surfaceDelegate_(std::move(surfaceDelegate)) {
  LOG(INFO) << "LogBoxModule initialized";
  surfaceDelegate_->createContentView("LogBox");
}

LogBoxModule::~LogBoxModule() {
  surfaceDelegate_->destroyContentView();
}

void LogBoxModule::show(jsi::Runtime& /*rt*/) {
  LOG(INFO) << "LogBoxModule show";
  if (surfaceDelegate_->isContentViewReady() &&
      !surfaceDelegate_->isShowing()) {
    surfaceDelegate_->show();
  }
}

void LogBoxModule::hide(jsi::Runtime& /*rt*/) {
  LOG(INFO) << "LogBoxModule hide";
  if (surfaceDelegate_->isShowing()) {
    surfaceDelegate_->hide();
  }
}

} // namespace facebook::react
