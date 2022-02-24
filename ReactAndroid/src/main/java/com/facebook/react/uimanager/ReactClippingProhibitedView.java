/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

/**
 * Some Views may not function if added directly to a ViewGroup that clips them. For example, TTRC
 * markers may rely on `onDraw` functionality to work properly, and will break if they're clipped
 * out of the View hierarchy for any resaon.
 *
 * <p>This situation can occur more often in Fabric with View Flattening. We may prevent this sort
 * of View Flattening from occurring in the future, but the connection is not entirely certain.
 *
 * <p>This can occur either because ReactViewGroup clips them out, using the ordinarary subview
 * clipping feature. It is also possible if a View is added directly to a ReactRootView below the
 * fold of the screen.
 *
 * <p>Generally the solution is to prevent View flattening in JS by adding `collapsable=false` to a
 * parent component of the clipped view, and/or move the View higher up in the hierarchy so it is
 * always rendered within the first page of the screen.
 */
public interface ReactClippingProhibitedView {}
