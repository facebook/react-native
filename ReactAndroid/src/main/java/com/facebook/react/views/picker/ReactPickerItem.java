package com.facebook.react.views.picker;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import java.util.ArrayList;
import java.util.List;

/* package */
class ReactPickerItem {
  public final String label;
  @Nullable public final Integer color;

  public ReactPickerItem(final ReadableMap jsMapData) {
    label = jsMapData.getString("label");

    if (jsMapData.hasKey("color") && !jsMapData.isNull("color")) {
      color = jsMapData.getInt("color");
    } else {
      color = null;
    }
  }

  @Nullable
  public static List<ReactPickerItem> createFromJsArrayMap(final ReadableArray jsArrayMap) {
    if (jsArrayMap == null) {
      return null;
    }

    final List<ReactPickerItem> items = new ArrayList<>(jsArrayMap.size());
    for (int i = 0; i < jsArrayMap.size(); ++i) {
      items.add(new ReactPickerItem(jsArrayMap.getMap(i)));
    }
    return items;
  }
}
