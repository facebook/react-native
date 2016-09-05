/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.csslayout;

public class CSSCachedMeasurement {
  public float availableWidth;
  public float availableHeight;
  public CSSMeasureMode widthMeasureMode = null;
  public CSSMeasureMode heightMeasureMode = null;

  public float computedWidth;
  public float computedHeight;
}
