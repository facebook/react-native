/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import java.util.List;
import java.util.Map;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;

import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

/**
 * Helps generate constants map for {@link UIManagerModule} by collecting and merging constants from
 * registered view managers.
 */
/* package */ class UIManagerModuleConstantsHelper {

  private static final String CUSTOM_BUBBLING_EVENT_TYPES_KEY = "customBubblingEventTypes";
  private static final String CUSTOM_DIRECT_EVENT_TYPES_KEY = "customDirectEventTypes";

  /**
   * Generates map of constants that is then exposed by {@link UIManagerModule}.
   * Provided list of {@param viewManagers} is then used to populate content of
   * those predefined fields using
   * {@link ViewManager#getExportedCustomBubblingEventTypeConstants} and
   * {@link ViewManager#getExportedCustomDirectEventTypeConstants} respectively. Each view manager
   * is in addition allowed to expose viewmanager-specific constants that are placed under the key
   * that corresponds to the view manager's name (see {@link ViewManager#getName}). Constants are
   * merged into the map of {@link UIManagerModule} base constants that is stored in
   * {@link UIManagerModuleConstants}.
   * TODO(6845124): Create a test for this
   */
  /* package */ static Map<String, Object> createConstants(
    List<ViewManager> viewManagers,
    boolean lazyViewManagersEnabled) {
    Map<String, Object> constants = UIManagerModuleConstants.getConstants();

    // Generic/default event types:
    // All view managers are capable of dispatching these events.
    // They will be automatically registered for each view type.
    Map genericBubblingEventTypes = UIManagerModuleConstants.getBubblingEventTypeConstants();
    Map genericDirectEventTypes = UIManagerModuleConstants.getDirectEventTypeConstants();

    // Cumulative event types:
    // View manager specific event types are collected as views are loaded.
    // This information is used later when events are dispatched.
    Map allBubblingEventTypes = MapBuilder.newHashMap();
    allBubblingEventTypes.putAll(genericBubblingEventTypes);
    Map allDirectEventTypes = MapBuilder.newHashMap();
    allDirectEventTypes.putAll(genericDirectEventTypes);

    for (ViewManager viewManager : viewManagers) {
      SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "constants for ViewManager")
        .arg("ViewManager", viewManager.getName())
        .flush();
      try {
        Map viewManagerConstants = MapBuilder.newHashMap();
        Map viewManagerBubblingEvents = viewManager.getExportedCustomBubblingEventTypeConstants();
        if (viewManagerBubblingEvents != null) {
          recursiveMerge(allBubblingEventTypes, viewManagerBubblingEvents);
          recursiveMerge(viewManagerBubblingEvents, genericBubblingEventTypes);
          viewManagerConstants.put("bubblingEventTypes", viewManagerBubblingEvents);
        } else {
          viewManagerConstants.put("bubblingEventTypes", genericBubblingEventTypes);
        }
        Map viewManagerDirectEvents = viewManager.getExportedCustomDirectEventTypeConstants();
        if (viewManagerDirectEvents != null) {
          recursiveMerge(allDirectEventTypes, viewManagerDirectEvents);
          recursiveMerge(viewManagerDirectEvents, genericDirectEventTypes);
          viewManagerConstants.put("directEventTypes", viewManagerDirectEvents);
        } else {
          viewManagerConstants.put("directEventTypes", genericDirectEventTypes);
        }
        Map customViewConstants = viewManager.getExportedViewConstants();
        if (customViewConstants != null) {
          viewManagerConstants.put("Constants", customViewConstants);
        }
        Map viewManagerCommands = viewManager.getCommandsMap();
        if (viewManagerCommands != null) {
          viewManagerConstants.put("Commands", viewManagerCommands);
        }
        Map<String, String> viewManagerNativeProps = viewManager.getNativeProps();
        if (!viewManagerNativeProps.isEmpty()) {
          viewManagerConstants.put("NativeProps", viewManagerNativeProps);
        }
        if (!viewManagerConstants.isEmpty()) {
          constants.put(viewManager.getName(), viewManagerConstants);
        }
      } finally {
        Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      }
    }

    // Used by https://fburl.com/6nskr82o
    constants.put(CUSTOM_BUBBLING_EVENT_TYPES_KEY, allBubblingEventTypes);
    constants.put(CUSTOM_DIRECT_EVENT_TYPES_KEY, allDirectEventTypes);
    constants.put("AndroidLazyViewManagersEnabled", lazyViewManagersEnabled);

    return constants;
  }

  /**
   * Merges {@param source} map into {@param dest} map recursively
   */
  private static void recursiveMerge(Map dest, Map source) {
    for (Object key : source.keySet()) {
      Object sourceValue = source.get(key);
      Object destValue = dest.get(key);
      if (destValue != null && (sourceValue instanceof Map) && (destValue instanceof Map)) {
        recursiveMerge((Map) destValue, (Map) sourceValue);
      } else {
        dest.put(key, sourceValue);
      }
    }
  }
}
