/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.image;

import com.facebook.drawee.drawable.ScalingUtils;

import org.junit.Rule;
import org.junit.runner.RunWith;
import org.junit.Test;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

import static org.fest.assertions.api.Assertions.assertThat;

@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class ImageResizeModeTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  @Test
  public void testImageResizeMode() {
    assertThat(ImageResizeMode.toScaleType(null))
        .isEqualTo(ScalingUtils.ScaleType.CENTER_CROP);

    assertThat(ImageResizeMode.toScaleType("contain"))
        .isEqualTo(ScalingUtils.ScaleType.CENTER_INSIDE);

    assertThat(ImageResizeMode.toScaleType("cover"))
        .isEqualTo(ScalingUtils.ScaleType.CENTER_CROP);

    assertThat(ImageResizeMode.toScaleType("stretch"))
        .isEqualTo(ScalingUtils.ScaleType.FIT_XY);

    // No resizeMode set
    assertThat(ImageResizeMode.defaultValue())
        .isEqualTo(ScalingUtils.ScaleType.CENTER_CROP);
  }
}
