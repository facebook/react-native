/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.annotations

/**
 * Annotation class used to mark a class as a [ShadowNode] that implements the
 * [com.facebook.yoga.YogaMeasureFunction] interface but that it also has a C++ Shadow Node
 * implementation.
 *
 * In the NewArchitecture, the `measure()` method offered by the
 * [com.facebook.yoga.YogaMeasureFunction] is never invoked, so we're emitting a warning for legacy
 * arch users that are using such ShadowNodes.
 *
 * However, if a ShadowNode also has a C++ implementation, because the library has been implemented
 * as backward compatible, you can annotate your shadow node with this annotation to suppress the
 * warning for all of your users.
 */
@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.CLASS)
public annotation class LegacyArchitectureShadowNodeWithCxxImpl
