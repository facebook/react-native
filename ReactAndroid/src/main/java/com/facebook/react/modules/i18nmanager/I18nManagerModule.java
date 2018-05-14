/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.i18nmanager;

import android.content.Context;
import com.facebook.react.bridge.ContextBaseJavaModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import java.util.Locale;
import java.util.Map;

/**
 * {@link NativeModule} that allows JS to set allowRTL and get isRTL status.
 */
@ReactModule(name = "I18nManager")
public class I18nManagerModule extends ContextBaseJavaModule {

  private final I18nUtil sharedI18nUtilInstance = I18nUtil.getInstance();

  public I18nManagerModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "I18nManager";
  }

  @Override
  public Map<String, Object> getConstants() {
    final Context context = getContext();
    final Locale locale = context.getResources().getConfiguration().locale;

    final Map<String, Object> constants = MapBuilder.newHashMap();
    constants.put("isRTL", sharedI18nUtilInstance.isRTL(context));
    constants.put(
        "doLeftAndRightSwapInRTL", sharedI18nUtilInstance.doLeftAndRightSwapInRTL(context));
    constants.put("localeIdentifier", locale.toString());
    return constants;
  }

  @ReactMethod
  public void allowRTL(boolean value) {
    sharedI18nUtilInstance.allowRTL(getContext(), value);
  }

  @ReactMethod
  public void forceRTL(boolean value) {
    sharedI18nUtilInstance.forceRTL(getContext(), value);
  }

  @ReactMethod
  public void swapLeftAndRightInRTL(boolean value) {
    sharedI18nUtilInstance.swapLeftAndRightInRTL(getContext(), value);
  }
}
