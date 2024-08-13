/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>

namespace facebook::react {

class NativeDebuggerSessionObserver
    : public NativeDebuggerSessionObserverCxxSpec<
          NativeDebuggerSessionObserver> {
 public:
  NativeDebuggerSessionObserver(std::shared_ptr<CallInvoker> jsInvoker);

  bool hasActiveSession(jsi::Runtime& runtime);
  std::function<void()> subscribe(
      jsi::Runtime& runtime,
      AsyncCallback<bool> callback);
};

} // namespace facebook::react
