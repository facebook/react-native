/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.i18nmanager;

import android.content.Context;
import android.os.Build;
import com.facebook.fbreact.specs.NativeI18nManagerSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import java.util.Locale;
import java.util.Map;

/** {@link NativeModule} that allows JS to set allowRTL and get isRTL status. */
@ReactModule(name = NativeI18nManagerSpec.NAME)
public class I18nManagerModule extends NativeI18nManagerSpec {
  private final I18nUtil sharedI18nUtilInstance = I18nUtil.getInstance();

  public I18nManagerModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public Map<String, Object> getTypedExportedConstants() {
    final Context context = getReactApplicationContext();
    final Locale locale;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      locale = context.getResources().getConfiguration().getLocales().get(0);
    } else {
      locale = context.getResources().getConfiguration().locale;
    }

    final Map<String, Object> constants = MapBuilder.newHashMap();
    constants.put("isRTL", sharedI18nUtilInstance.isRTL(context));
    constants.put(
        "doLeftAndRightSwapInRTL", sharedI18nUtilInstance.doLeftAndRightSwapInRTL(context));
    constants.put("localeIdentifier", locale.toString());
    return constants;
  }

  @Override
  public void allowRTL(boolean value) {
    sharedI18nUtilInstance.allowRTL(getReactApplicationContext(), value);
  }

  @Override
  public void forceRTL(boolean value) {
    sharedI18nUtilInstance.forceRTL(getReactApplicationContext(), value);
  }

  @Override
  public void swapLeftAndRightInRTL(boolean value) {
    sharedI18nUtilInstance.swapLeftAndRightInRTL(getReactApplicationContext(), value);
  }
}
