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
  bool getFuseboxEnabled() const;

  /**
   * Reset flags to their upstream values. The caller must ensure any resources
   * that have read previous flag values have been cleaned up.
   */
  void dangerouslyResetFlags();

 private:
  struct Values {
    bool fuseboxEnabled;
    bool operator==(const Values&) const = default;
  };

  InspectorFlags() = default;
  InspectorFlags(const InspectorFlags&) = delete;
  InspectorFlags& operator=(const InspectorFlags&) = default;
  ~InspectorFlags() = default;

  mutable std::optional<Values> cachedValues_;
  mutable bool inconsistentFlagsStateLogged_{false};

  const Values& loadFlagsAndAssertUnchanged() const;
};

} // namespace facebook::react::jsinspector_modern
