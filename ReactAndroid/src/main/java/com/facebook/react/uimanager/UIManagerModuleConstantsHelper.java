/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

import com.facebook.react.common.MapBuilder;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;
import java.util.List;
import java.util.Map;
import javax.annotation.Nullable;

/**
 * Helps generate constants map for {@link UIManagerModule} by collecting and merging constants from
 * registered view managers.
 */
/* package */ class UIManagerModuleConstantsHelper {

  /* package */ static final String CUSTOM_BUBBLING_EVENTS_KEY = "customBubblingEventTypes";
  /* package */ static final String CUSTOM_DIRECT_EVENTS_KEY = "customDirectEventTypes";

  /**
   * Generates a lazy discovery enabled version of {@link UIManagerModule} constants. It only
   * contains a list of view manager names, so that JS side is aware of the managers there are.
   * Actual ViewManager instantiation happens when {@code UIManager.SpecificViewManager} call happens.
   * The View Manager is then registered on the JS side with the help of
   * {@code UIManagerModule.getConstantsForViewManager}.
   */
  /* package */ static Map<String, Object> createConstants(
      UIManagerModule.ViewManagerResolver resolver) {
    Map<String, Object> constants = UIManagerModuleConstants.getConstants();
    constants.put("ViewManagerNames", resolver.getViewManagerNames());
    return constants;
  }

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
  /* package */ static Map<String, Object> createConstants(List<ViewManager> viewManagers) {
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
      final String viewManagerName = viewManager.getName();

      SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "constants for ViewManager")
          .arg("ViewManager", viewManagerName)
          .arg("Lazy", false)
          .flush();

      try {
        Map viewManagerConstants = createConstantsForViewManager(
            viewManager,
            genericBubblingEventTypes,
            genericDirectEventTypes,
            allBubblingEventTypes,
            allDirectEventTypes);
        if (!viewManagerConstants.isEmpty()) {
          constants.put(viewManagerName, viewManagerConstants);
        }
      } finally {
        Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      }
    }

    // Used by https://fburl.com/6nskr82o
    constants.put(CUSTOM_BUBBLING_EVENTS_KEY, allBubblingEventTypes);
    constants.put(CUSTOM_DIRECT_EVENTS_KEY, allDirectEventTypes);
    return constants;
  }

  /* package */ static Map<String, Object> createConstantsForViewManager(
      ViewManager viewManager,
      Map defaultBubblingEvents,
      Map defaultDirectEvents,
      @Nullable Map cumulativeBubblingEventTypes,
      @Nullable Map cumulativeDirectEventTypes) {
    Map<String, Object> viewManagerConstants = MapBuilder.newHashMap();

    Map viewManagerBubblingEvents = viewManager.getExportedCustomBubblingEventTypeConstants();
    if (viewManagerBubblingEvents != null) {
      if (cumulativeBubblingEventTypes != null) {
        recursiveMerge(cumulativeBubblingEventTypes, viewManagerBubblingEvents);
      }
      recursiveMerge(viewManagerBubblingEvents, defaultBubblingEvents);
    } else {
      viewManagerBubblingEvents = defaultBubblingEvents;
    }
    viewManagerConstants.put("bubblingEventTypes", viewManagerBubblingEvents);

    Map viewManagerDirectEvents = viewManager.getExportedCustomDirectEventTypeConstants();
    if (viewManagerDirectEvents != null) {
      if (cumulativeDirectEventTypes != null) {
        recursiveMerge(cumulativeDirectEventTypes, viewManagerBubblingEvents);
      }
      recursiveMerge(viewManagerDirectEvents, defaultDirectEvents);
    } else {
      viewManagerDirectEvents = defaultDirectEvents;
    }
    viewManagerConstants.put("directEventTypes", viewManagerDirectEvents);

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

    return viewManagerConstants;
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
