/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.content.Context
import com.facebook.react.common.annotations.DeprecatedInNewArchitecture

/**
 * This is the bridge-specific concrete subclass of ReactContext. ReactContext has many methods that
 * delegate to the react instance. This subclass will implement those methods, by delegating to the
 * CatalystInstance. If you need to create a ReactContext within an "bridge context", please create
 * BridgeReactContext.
 */
@DeprecatedInNewArchitecture
public class BridgeReactContext(base: Context) : ReactApplicationContext(base) {}
