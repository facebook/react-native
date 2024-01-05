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
// builds.
// If you build in OSS with CMake, you will have -DNDEBUG set only for release
// builds, therefore REACT_NATIVE_DEBUG will not be set. Here we introduce
// REACT_NATIVE_DEBUG that we use internally instead of NDEBUG that we can
// control and use as a more reliable xplat flag. For any build that doesn't
// have NDEBUG defined, we enable REACT_NATIVE_DEBUG for convenience.
#ifndef NDEBUG
#ifndef COCOAPODS
#define REACT_NATIVE_DEBUG 1
#endif
#endif
