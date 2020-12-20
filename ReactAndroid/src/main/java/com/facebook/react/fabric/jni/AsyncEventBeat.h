/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <react/renderer/core/EventBeat.h>
#include <react/renderer/uimanager/primitives.h>

#include "EventBeatManager.h"

namespace facebook {
namespace react {

class AsyncEventBeat final : public EventBeat, public EventBeatManagerObserver {
 public:
  AsyncEventBeat(
      EventBeat::SharedOwnerBox const &ownerBox,
      EventBeatManager *eventBeatManager,
      RuntimeExecutor runtimeExecutor,
      jni::global_ref<jobject> javaUIManager)
      : EventBeat(ownerBox),
        eventBeatManager_(eventBeatManager),
        runtimeExecutor_(runtimeExecutor),
        javaUIManager_(javaUIManager) {
    eventBeatManager->addObserver(*this);
  }

  ~AsyncEventBeat() {
    eventBeatManager_->removeObserver(*this);
  }

  void tick() const override {
    runtimeExecutor_([this, ownerBox = ownerBox_](jsi::Runtime &runtime) {
      auto owner = ownerBox->owner.lock();
      if (!owner) {
        return;
      }

      this->beat(runtime);
    });
  }

  void induce() const override {
    tick();
  }

  void request() const override {
    bool alreadyRequested = isRequested_;
    EventBeat::request();
    if (!alreadyRequested) {
      // Notifies java side that an event will be dispatched (e.g. LayoutEvent)
      static auto onRequestEventBeat =
          jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
              ->getMethod<void()>("onRequestEventBeat");
      onRequestEventBeat(javaUIManager_);
    }
  }

 private:
  EventBeatManager *eventBeatManager_;
  RuntimeExecutor runtimeExecutor_;
  jni::global_ref<jobject> javaUIManager_;
};

} // namespace react
} // namespace facebook
