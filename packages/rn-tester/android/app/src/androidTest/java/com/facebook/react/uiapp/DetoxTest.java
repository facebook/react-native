/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This uses instructions from
// https://github.com/wix/Detox/blob/master/docs/Introduction.Android.md#4-create-android-test-class

package com.facebook.react.uiapp;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;
import com.wix.detox.Detox;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {

  @Rule
  public ActivityTestRule<RNTesterActivity> mActivityRule =
      new ActivityTestRule<>(RNTesterActivity.class, false, false);

  @Test
  public void runDetoxTests() {
    Detox.runTests(mActivityRule);
  }
}
