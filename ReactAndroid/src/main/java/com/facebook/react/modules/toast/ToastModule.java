/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.toast;

import android.view.Gravity;
import android.widget.Toast;
import com.facebook.fbreact.specs.NativeToastAndroidSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import java.util.Map;

/** {@link NativeModule} that allows JS to show an Android Toast. */
@ReactModule(name = NativeToastAndroidSpec.NAME)
public class ToastModule extends NativeToastAndroidSpec {

  private static final String DURATION_SHORT_KEY = "SHORT";
  private static final String DURATION_LONG_KEY = "LONG";

  private static final String GRAVITY_TOP_KEY = "TOP";
  private static final String GRAVITY_BOTTOM_KEY = "BOTTOM";
  private static final String GRAVITY_CENTER = "CENTER";

  public ToastModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public Map<String, Object> getTypedExportedConstants() {
    final Map<String, Object> constants = MapBuilder.newHashMap();
    constants.put(DURATION_SHORT_KEY, Toast.LENGTH_SHORT);
    constants.put(DURATION_LONG_KEY, Toast.LENGTH_LONG);
    constants.put(GRAVITY_TOP_KEY, Gravity.TOP | Gravity.CENTER_HORIZONTAL);
    constants.put(GRAVITY_BOTTOM_KEY, Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL);
    constants.put(GRAVITY_CENTER, Gravity.CENTER_HORIZONTAL | Gravity.CENTER_VERTICAL);
    return constants;
  }

  @Override
  public void show(final String message, final double durationDouble) {
    final int duration = (int) durationDouble;

    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            Toast.makeText(getReactApplicationContext(), message, duration).show();
          }
        });
  }

  @Override
  public void showWithGravity(
      final String message, final double durationDouble, final double gravityDouble) {
    final int duration = (int) durationDouble;
    final int gravity = (int) gravityDouble;

    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            Toast toast = Toast.makeText(getReactApplicationContext(), message, duration);
            toast.setGravity(gravity, 0, 0);
            toast.show();
          }
        });
  }

  @Override
  public void showWithGravityAndOffset(
      final String message,
      final double durationDouble,
      final double gravityDouble,
      final double xOffsetDouble,
      final double yOffsetDouble) {
    final int duration = (int) durationDouble;
    final int gravity = (int) gravityDouble;
    final int xOffset = (int) xOffsetDouble;
    final int yOffset = (int) yOffsetDouble;

    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            Toast toast = Toast.makeText(getReactApplicationContext(), message, duration);
            toast.setGravity(gravity, xOffset, yOffset);
            toast.show();
          }
        });
  }
}
