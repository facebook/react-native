/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/mounting/MountingTransaction.h>

#pragma once

namespace facebook::react {

class MountingCoordinator;

/**
 * Generic interface for anything that needs to override specific
 * MountingCoordinator methods. This is for platform-specific escape hatches
 * like animations.
 */
class MountingOverrideDelegate {
 public:
  virtual bool shouldOverridePullTransaction() const = 0;
  virtual ~MountingOverrideDelegate() = default;

  /**
   * Delegates that override this method are responsible for:
   *
   * - Returning a MountingTransaction with mutations
   * - Calling
   * - Telemetry, if appropriate
   *
   * @param surfaceId
   * @param number
   * @param mountingCoordinator
   * @return
   */
  virtual std::optional<MountingTransaction> pullTransaction(
      SurfaceId surfaceId,
      MountingTransaction::Number number,
      const TransactionTelemetry& telemetry,
      ShadowViewMutationList mutations) const = 0;
};

} // namespace facebook::react
