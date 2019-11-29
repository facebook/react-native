/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.yoga.YogaNode;

/** Base class for {@link YogaNode}s that represent inline images. */
public abstract class ReactTextInlineImageShadowNode extends LayoutShadowNode {

  /**
   * Build a {@link TextInlineImageSpan} from this node. This will be added to the TextView in place
   * of this node.
   */
  public abstract TextInlineImageSpan buildInlineImageSpan();

  public ReactTextInlineImageShadowNode() {}
}
