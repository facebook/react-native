/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import com.facebook.react.common.annotations.DeprecatedInNewArchitecture;

/** This will eventually replace {@link LazyReactPackage} when TurboModules are finally done. */
@DeprecatedInNewArchitecture(message = "Use BaseReactPackage instead")
public abstract class TurboReactPackage extends BaseReactPackage {}
