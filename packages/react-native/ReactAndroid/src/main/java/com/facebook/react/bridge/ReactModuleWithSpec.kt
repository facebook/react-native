/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel

@Deprecated("Use [TurboModule] to identify generated specs")
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
public interface ReactModuleWithSpec
