/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

#include <react/config/ReactNativeConfig.h>

namespace facebook::react::jsinspector_modern {

/**
 * A container for all inspector related feature flags (Meyers singleton
 * pattern). Flags must be set before they are accessed and are static for the
 * lifetime of the app.
 */
class InspectorFlags {
 public:
  static InspectorFlags& getInstance();

  /**
   * Initialize flags from a `ReactNativeConfig` instance. Validates that flag
   * values are not changed across multiple calls.
   */
  void initFromConfig(const ReactNativeConfig& reactNativeConfig);

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
  InspectorFlags() = default;
  InspectorFlags(const InspectorFlags&) = delete;
  InspectorFlags& operator=(const InspectorFlags&) = delete;
  ~InspectorFlags() = default;

  std::optional<bool> enableModernCDPRegistry_;
  std::optional<bool> enableCxxInspectorPackagerConnection_;
};

} // namespace facebook::react::jsinspector_modern
