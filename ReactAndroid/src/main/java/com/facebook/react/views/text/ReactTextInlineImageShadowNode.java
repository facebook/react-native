/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;

import com.facebook.csslayout.CSSNodeDEPRECATED;
import com.facebook.react.uimanager.LayoutShadowNode;

/**
 * Base class for {@link CSSNodeDEPRECATED}s that represent inline images.
 */
public abstract class ReactTextInlineImageShadowNode extends LayoutShadowNode {

  /**
   * Build a {@link TextInlineImageSpan} from this node. This will be added to the TextView in
   * place of this node.
   */
  public abstract TextInlineImageSpan buildInlineImageSpan();

}
