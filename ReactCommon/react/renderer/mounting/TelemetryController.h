/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <mutex>

#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/MountingTransactionMetadata.h>
#include <react/renderer/telemetry/TransactionTelemetry.h>

namespace facebook {
namespace react {

class MountingCoordinator;

/*
 * Provides convenient tools for aggregating and accessing telemetry data
 * associated with running Surface.
 */
class TelemetryController final {
  friend class MountingCoordinator;

  /*
   * To be used by `MountingCoordinator`.
   */
  TelemetryController(MountingCoordinator const &mountingCoordinator) noexcept;

  /*
   * Not copyable.
   */
  TelemetryController(TelemetryController const &other) noexcept = delete;
  TelemetryController &operator=(TelemetryController const &other) noexcept =
      delete;

 public:
  /*
   * Calls `MountingCoordinator::pullTransaction()` and aggregates telemetry.
   */
  bool pullTransaction(
      std::function<void(MountingTransactionMetadata metadata)> const
          &willMount,
      std::function<void(ShadowViewMutationList const &mutations)> const
          &doMount,
      std::function<void(MountingTransactionMetadata metadata)> const &didMount)
      const;

 private:
  MountingCoordinator const &mountingCoordinator_;
  mutable SurfaceTelemetry compoundTelemetry_{};
  mutable std::mutex mutex_;
};

} // namespace react
} // namespace facebook
