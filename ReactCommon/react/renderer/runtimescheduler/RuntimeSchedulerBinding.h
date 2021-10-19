/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>

namespace facebook {
namespace react {

/*
 * Exposes RuntimeScheduler to JavaScript realm.
 */
class RuntimeSchedulerBinding : public jsi::HostObject {
 public:
  RuntimeSchedulerBinding(
      std::shared_ptr<RuntimeScheduler> const &runtimeScheduler);

  /*
   * Installs RuntimeSchedulerBinding into JavaScript runtime if needed.
   * Creates and sets `RuntimeSchedulerBinding` into the global namespace.
   * In case if the global namespace already has a `RuntimeSchedulerBinding`
   * installed, returns that.
   */
  static std::shared_ptr<RuntimeSchedulerBinding> createAndInstallIfNeeded(
      jsi::Runtime &runtime,
      std::shared_ptr<RuntimeScheduler> const &runtimeScheduler);

  /*
   * `jsi::HostObject` specific overloads.
   */
  jsi::Value get(jsi::Runtime &runtime, jsi::PropNameID const &name) override;

 private:
  std::shared_ptr<RuntimeScheduler> runtimeScheduler_;
};

} // namespace react
} // namespace facebook
