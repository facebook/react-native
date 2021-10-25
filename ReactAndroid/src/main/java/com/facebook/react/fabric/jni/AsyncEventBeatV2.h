/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/EventBeat.h>

#include "EventBeatManager.h"

namespace facebook::react {

class AsyncEventBeatV2 final : public EventBeat,
                               public EventBeatManagerObserver {
 public:
  AsyncEventBeatV2(
      EventBeat::SharedOwnerBox const &ownerBox,
      EventBeatManager *eventBeatManager,
      RuntimeExecutor runtimeExecutor,
      jni::global_ref<jobject> javaUIManager);

  ~AsyncEventBeatV2() override;

  void tick() const override;

  void induce() const override;

  void request() const override;

 private:
  EventBeatManager *eventBeatManager_;
  RuntimeExecutor runtimeExecutor_;
  jni::global_ref<jobject> javaUIManager_;
  mutable std::atomic<bool> isBeatCallbackScheduled_{false};
};

} // namespace facebook::react
