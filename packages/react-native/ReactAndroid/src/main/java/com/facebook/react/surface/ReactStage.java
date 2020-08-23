/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.surface;

import static java.lang.annotation.RetentionPolicy.SOURCE;

import androidx.annotation.IntDef;
import java.lang.annotation.Retention;

/** The stage of the Surface */
@Retention(SOURCE)
@IntDef({
  ReactStage.SURFACE_DID_INITIALIZE,
  ReactStage.BRIDGE_DID_LOAD,
  ReactStage.MODULE_DID_LOAD,
  ReactStage.SURFACE_DID_RUN,
  ReactStage.SURFACE_DID_INITIAL_RENDERING,
  ReactStage.SURFACE_DID_INITIAL_LAYOUT,
  ReactStage.SURFACE_DID_INITIAL_MOUNTING,
  ReactStage.SURFACE_DID_STOP
})
public @interface ReactStage {
  int SURFACE_DID_INITIALIZE = 0;
  int BRIDGE_DID_LOAD = 1;
  int MODULE_DID_LOAD = 2;
  int SURFACE_DID_RUN = 3;
  int SURFACE_DID_INITIAL_RENDERING = 4;
  int SURFACE_DID_INITIAL_LAYOUT = 5;
  int SURFACE_DID_INITIAL_MOUNTING = 6;
  int SURFACE_DID_STOP = 7;

  int ON_ATTACH_TO_INSTANCE = 101;
}
