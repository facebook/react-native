/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core.interfaces

import com.facebook.react.common.annotations.DeprecatedInNewArchitecture

/**
 * This interface was introduced for backward compatibility purposes. This interface will be
 * deprecated as part of the deprecation and removal of ReactModuleInfoProvider in the near future.
 *
 * See description of https://github.com/facebook/react-native/pull/41412 for more context.
 */
@DeprecatedInNewArchitecture
interface TurboModule : com.facebook.react.internal.turbomodule.core.interfaces.TurboModule {}
