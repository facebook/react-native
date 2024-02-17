/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

namespace facebook::react::jsinspector_modern {

/**
 * A container for all inspector related feature flags (Meyers singleton
 * pattern). Enforces that flag values are static for the lifetime of the app.
 */
class InspectorFlags {
 public:
  static InspectorFlags& getInstance();

  /**
   * Flag determining if the modern CDP backend should be enabled.
   */
  bool getEnableModernCDPRegistry() const;

  /**
   * Flag determining if the C++ implementation of InspectorPackagerConnection
   * should be used instead of the per-platform one.
   */
  bool getEnableCxxInspectorPackagerConnection() const;

 private:
  InspectorFlags();
  InspectorFlags(const InspectorFlags&) = delete;
  InspectorFlags& operator=(const InspectorFlags&) = delete;
  ~InspectorFlags() = default;

  const bool enableModernCDPRegistry_;
  const bool enableCxxInspectorPackagerConnection_;

  mutable bool inconsistentFlagsStateLogged_;
  void assertFlagsMatchUpstream() const;
};

} // namespace facebook::react::jsinspector_modern
