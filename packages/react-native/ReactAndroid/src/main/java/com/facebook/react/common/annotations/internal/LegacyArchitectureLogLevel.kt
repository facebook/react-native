/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.annotations.internal

/**
 * Enum class representing the log levels for classes annotated with @LegacyArcture annoation.
 *
 * It provides two levels of logging:
 * - WARNING: Indicates a warning signal will be logged if the underlying class is used when the new
 *   architecture is enabled.
 * - ERROR: : Indicates an error signal will be logged if the underlying class is used when the new
 *   architecture is enabled.
 */
public enum class LegacyArchitectureLogLevel {
  WARNING,
  ERROR
}
