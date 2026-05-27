/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.content.Context

/**
 * A context wrapper that always wraps Android Application [Context] and [CatalystInstance] by
 * extending [ReactContext].
 */
public abstract class ReactApplicationContext(context: Context) :
    // We want to wrap ApplicationContext, since there is no easy way to verify that application
    // context is passed as a param, we use [Context.getApplicationContext] to ensure that
    // the context we're wrapping is in fact an application context.
    ReactContext(context.applicationContext)
