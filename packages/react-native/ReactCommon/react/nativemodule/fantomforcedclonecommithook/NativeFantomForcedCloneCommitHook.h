/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <react/renderer/uimanager/UIManager.h>

namespace facebook::react {

struct FantomForcedCloneCommitHook;

class NativeFantomForcedCloneCommitHook
    : public NativeFantomForcedCloneCommitHookCxxSpec<
          NativeFantomForcedCloneCommitHook> {
 public:
  explicit NativeFantomForcedCloneCommitHook(
      std::shared_ptr<CallInvoker> jsInvoker);

  void setup(jsi::Runtime& runtime);

 private:
  std::shared_ptr<FantomForcedCloneCommitHook> fantomForcedCloneCommitHook_{};
};

} // namespace facebook::react
