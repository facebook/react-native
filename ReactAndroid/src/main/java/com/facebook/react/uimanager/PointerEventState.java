/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

public class PointerEventState {

  public PointerEventState() {}

  public int primaryPointerId;
  public int buttons;
  public int button;
  public float[] offsetCoords;
  public int surfaceId;
}
