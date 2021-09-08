/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/small_vector.h>
#include <vector>

#include <react/renderer/mounting/MountingTelemetry.h>
#include <react/utils/Telemetry.h>

namespace facebook {
namespace react {

/*
 * Represents telemetry data associated with a particular running Surface.
 * Contains information aggregated from multiple completed transaction.
 */
class SurfaceTelemetry final {
 public:
  constexpr static size_t kMaxNumberOfRecordedCommitTelemetries = 16;

  /*
   * Metrics
   */
  TelemetryDuration getLayoutTime() const;
  TelemetryDuration getCommitTime() const;
  TelemetryDuration getDiffTime() const;
  TelemetryDuration getMountTime() const;

  int getNumberOfTransactions() const;
  int getNumberOfMutations() const;

  std::vector<MountingTelemetry> getRecentCommitTelemetries() const;

  /*
   * Incorporate data from given transaction telemetry into aggregated data
   * for the Surface.
   */
  void incorporate(MountingTelemetry const &telemetry, int numberOfMutations);

 private:
  TelemetryDuration layoutTime_{};
  TelemetryDuration commitTime_{};
  TelemetryDuration diffTime_{};
  TelemetryDuration mountTime_{};

  int numberOfTransactions_{};
  int numberOfMutations_{};

  better::small_vector<MountingTelemetry, kMaxNumberOfRecordedCommitTelemetries>
      recentCommitTelemetries_{};
};

} // namespace react
} // namespace facebook
