/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.art;

import android.graphics.Canvas;
import android.graphics.Paint;

/**
 * Shadow node for virtual ARTGroup view
 */
public class ARTGroupShadowNode extends ARTVirtualNode {

  @Override
  public boolean isVirtual() {
    return true;
  }

  public void draw(Canvas canvas, Paint paint, float opacity) {
    opacity *= mOpacity;
    if (opacity > MIN_OPACITY_FOR_DRAW) {
      saveAndSetupCanvas(canvas);
      // TODO(6352006): apply clipping (iOS doesn't do it yet, it seems to cause issues)
      for (int i = 0; i < getChildCount(); i++) {
        ARTVirtualNode child = (ARTVirtualNode) getChildAt(i);
        child.draw(canvas, paint, opacity);
        child.markUpdateSeen();
      }
    }
  }
}
