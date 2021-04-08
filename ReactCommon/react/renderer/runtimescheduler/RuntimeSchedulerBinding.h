/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

namespace facebook::react {

/*
 * Exposes RuntimeScheduler to JavaScript realm.
 */
class RuntimeSchedulerBinding : public jsi::HostObject {
 public:
  /*
   * Installs RuntimeSchedulerBinding into JavaScript runtime if needed.
   * Creates and sets `RuntimeSchedulerBinding` into the global namespace.
   * In case if the global namespace already has a `RuntimeSchedulerBinding`
   * installed, returns that. Thread synchronization must be enforced
   * externally.
   */
  static std::shared_ptr<RuntimeSchedulerBinding> createAndInstallIfNeeded(
      jsi::Runtime &runtime);

  /*
   * `jsi::HostObject` specific overloads.
   */
  jsi::Value get(jsi::Runtime &runtime, jsi::PropNameID const &name) override;
};

} // namespace facebook::react
