/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/renderer/runtimescheduler` module.
//
// POC (public C++ API surface reduction): this is the single, blessed public
// entry point for the runtimescheduler module. Consumers should include only
// this header:
//
//   #include <react/renderer/runtimescheduler/RuntimeScheduler.umbrella.h>
//
// and depend only on the public Buck target:
//
//   //xplat/js/react-native-github/packages/react-native/ReactCommon/\
//     react/renderer/runtimescheduler:runtimescheduler
//
// The individual headers below are re-exported here. The fork implementations
// `RuntimeScheduler_Modern` and `RuntimeScheduler_Legacy` are deliberately NOT
// part of this umbrella: they live in private Buck targets and are not part of
// the public API surface.
// =============================================================================

// Mark that subsequent module headers are being pulled in through the umbrella.
// This satisfies the per-header umbrella guard (see RuntimeSchedulerUmbrellaGuard.h).
#define REACT_RUNTIMESCHEDULER_UMBRELLA_INCLUDE

#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerEventTimingDelegate.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerIntersectionObserverDelegate.h>
#include <react/renderer/runtimescheduler/SchedulerPriorityUtils.h>
#include <react/renderer/runtimescheduler/Task.h>
#include <react/renderer/runtimescheduler/primitives.h>
