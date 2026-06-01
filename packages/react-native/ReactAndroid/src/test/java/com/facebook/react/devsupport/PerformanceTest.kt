/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

/**
 * JUnit category marker for performance / memory tests that are too expensive to run on every
 * change. Excluded from the default `testDebugUnitTest` task; opt-in via
 * `-PrunPerfTests=true`.
 */
interface PerformanceTest
