/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/flags.h>

//
// This file contains flags that should __never__ be enabled for
// release-mode/production builds, unless explicitly noted. You can enable some
// of these for debug or local builds to assist in logging / debugging specific
// features.
//

// Enables verbose logging for the LayoutAnimations subsystem.
//#define LAYOUT_ANIMATION_VERBOSE_LOGGING 1

// Logs information before running `assert` in LayoutAnimations. More useful on
// Android vs other platforms.
//#define VERBOSE_LAYOUT_ANIMATION_ASSERTS 1

// Enables some Shadow Tree introspection features (maintains a StubViewTree,
// and logs prev/next tree and mutations if there are any discrepancies). If you
// define this, also define `RN_DEBUG_STRING_CONVERTIBLE`.
#ifdef REACT_NATIVE_DEBUG
#define RN_SHADOW_TREE_INTROSPECTION 1
#endif

// This enables certain object-to-string debug conversions to be compiled.
// Enable if `RN_SHADOW_TREE_INTROSPECTION` is enabled.
#ifdef RN_SHADOW_TREE_INTROSPECTION
#define RN_DEBUG_STRING_CONVERTIBLE 1
#endif

// Enables *very* verbose, noisy logs in the differ. Useful for debugging
// specifically the differ, but not much else.
//#define DEBUG_LOGS_DIFFER

// Uncomment to enable verbose StubViewTree debug logs. This ensures that errors
// are logged to console before the `assert` is fired. More useful on Android vs
// other platforms.
//#define STUB_VIEW_TREE_VERBOSE 1

// Verbose logging for certain Yoga-related things in the RN codebase (not Yoga
// codebase). Useful for debugging layout.
//#define RN_DEBUG_YOGA_LOGGER 1
