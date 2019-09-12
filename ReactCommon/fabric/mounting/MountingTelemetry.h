/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <limits>

namespace facebook {
namespace react {

/*
 * Represent arbitrary telemetry data that can be associated with the
 * particular revision of `ShadowTree`.
 */
class MountingTelemetry final {
 public:
  /*
   * Signaling
   */
  void willDiff();
  void didDiff();
  void willCommit();
  void didCommit();
  void willLayout();
  void didLayout();

  /*
   * Reading
   */
  int64_t getDiffStartTime() const;
  int64_t getDiffEndTime() const;
  int64_t getLayoutStartTime() const;
  int64_t getLayoutEndTime() const;
  int64_t getCommitStartTime() const;
  int64_t getCommitEndTime() const;
  int64_t getCommitNumber() const;

 private:
  constexpr static int64_t kUndefinedTime = std::numeric_limits<int64_t>::max();

  int64_t diffStartTime_{kUndefinedTime};
  int64_t diffEndTime_{kUndefinedTime};
  int64_t commitNumber_{0};
  int64_t commitStartTime_{kUndefinedTime};
  int64_t commitEndTime_{kUndefinedTime};
  int64_t layoutStartTime_{kUndefinedTime};
  int64_t layoutEndTime_{kUndefinedTime};
};

} // namespace react
} // namespace facebook
