/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

//
// Enable REACT_NATIVE_DEBUG if NDEBUG is not defined.
// Due to BUCK defaults in open-source, NDEBUG is always defined for all android
// builds (if you build without BUCK, this isn't an issue). Thus we introduce
// REACT_NATIVE_DEBUG that we use internally instead of NDEBUG that we can
// control and use as a more reliable xplat flag. For any build that doesn't
// have NDEBUG defined, we enable REACT_NATIVE_DEBUG for convenience.
#ifndef NDEBUG
#define REACT_NATIVE_DEBUG 1
#endif
