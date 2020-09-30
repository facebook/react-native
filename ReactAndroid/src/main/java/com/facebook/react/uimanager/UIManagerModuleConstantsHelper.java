/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

import androidx.annotation.Nullable;
import com.facebook.react.common.MapBuilder;
import com.facebook.systrace.SystraceMessage;
import java.util.List;
import java.util.Map;

/**
 * Helps generate constants map for {@link UIManagerModule} by collecting and merging constants from
 * registered view managers.
 */
/* package */ class UIManagerModuleConstantsHelper {

  private static final String BUBBLING_EVENTS_KEY = "bubblingEventTypes";
  private static final String DIRECT_EVENTS_KEY = "directEventTypes";

  /**
   * Generates a lazy discovery enabled version of {@link UIManagerModule} constants. It only
   * contains a list of view manager names, so that JS side is aware of the managers there are.
   * Actual ViewManager instantiation happens when {@code
   * UIManager.getViewManagerConfig('SpecificViewManager')} call happens. The View Manager is then
   * registered on the JS side with the help of {@code UIManagerModule.getConstantsForViewManager}.
   */
  /* package */ static Map<String, Object> createConstants(
      UIManagerModule.ViewManagerResolver resolver) {
    Map<String, Object> constants = UIManagerModuleConstants.getConstants();
    constants.put("ViewManagerNames", resolver.getViewManagerNames());
    constants.put("LazyViewManagersEnabled", true);
    return constants;
  }

  /* package */ static Map<String, Object> getDefaultExportableEventTypes() {
    return MapBuilder.<String, Object>of(
        BUBBLING_EVENTS_KEY, UIManagerModuleConstants.getBubblingEventTypeConstants(),
        DIRECT_EVENTS_KEY, UIManagerModuleConstants.getDirectEventTypeConstants());
  }

  /**
   * Generates map of constants that is then exposed by {@link UIManagerModule}. Provided list of
   * {@param viewManagers} is then used to populate content of those predefined fields using {@link
   * ViewManager#getExportedCustomBubblingEventTypeConstants} and {@link
   * ViewManager#getExportedCustomDirectEventTypeConstants} respectively. Each view manager is in
   * addition allowed to expose viewmanager-specific constants that are placed under the key that
   * corresponds to the view manager's name (see {@link ViewManager#getName}). Constants are merged
   * into the map of {@link UIManagerModule} base constants that is stored in {@link
   * UIManagerModuleConstants}. TODO(6845124): Create a test for this
   */
  /* package */ static Map<String, Object> createConstants(
      List<ViewManager> viewManagers,
      @Nullable Map<String, Object> allBubblingEventTypes,
      @Nullable Map<String, Object> allDirectEventTypes) {
    Map<String, Object> constants = UIManagerModuleConstants.getConstants();

    // Generic/default event types:
    // All view managers are capable of dispatching these events.
    // They will be automatically registered with React Fiber.
    Map genericBubblingEventTypes = UIManagerModuleConstants.getBubblingEventTypeConstants();
    Map genericDirectEventTypes = UIManagerModuleConstants.getDirectEventTypeConstants();

    // Cumulative event types:
    // View manager specific event types are collected as views are loaded.
    // This information is used later when events are dispatched.
    if (allBubblingEventTypes != null) {
      allBubblingEventTypes.putAll(genericBubblingEventTypes);
    }
    if (allDirectEventTypes != null) {
      allDirectEventTypes.putAll(genericDirectEventTypes);
    }

    for (ViewManager viewManager : viewManagers) {
      final String viewManagerName = viewManager.getName();

      SystraceMessage.beginSection(
              TRACE_TAG_REACT_JAVA_BRIDGE, "UIManagerModuleConstantsHelper.createConstants")
          .arg("ViewManager", viewManagerName)
          .arg("Lazy", false)
          .flush();

      try {
        Map viewManagerConstants =
            createConstantsForViewManager(
                viewManager, null, null, allBubblingEventTypes, allDirectEventTypes);
        if (!viewManagerConstants.isEmpty()) {
          constants.put(viewManagerName, viewManagerConstants);
        }
      } finally {
        SystraceMessage.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      }
    }

    constants.put("genericBubblingEventTypes", genericBubblingEventTypes);
    constants.put("genericDirectEventTypes", genericDirectEventTypes);
    return constants;
  }

  /* package */ static Map<String, Object> createConstantsForViewManager(
      ViewManager viewManager,
      @Nullable Map defaultBubblingEvents,
      @Nullable Map defaultDirectEvents,
      @Nullable Map cumulativeBubblingEventTypes,
      @Nullable Map cumulativeDirectEventTypes) {
    Map<String, Object> viewManagerConstants = MapBuilder.newHashMap();

    Map viewManagerBubblingEvents = viewManager.getExportedCustomBubblingEventTypeConstants();
    if (viewManagerBubblingEvents != null) {
      recursiveMerge(cumulativeBubblingEventTypes, viewManagerBubblingEvents);
      recursiveMerge(viewManagerBubblingEvents, defaultBubblingEvents);
      viewManagerConstants.put(BUBBLING_EVENTS_KEY, viewManagerBubblingEvents);
    } else if (defaultBubblingEvents != null) {
      viewManagerConstants.put(BUBBLING_EVENTS_KEY, defaultBubblingEvents);
    }

    Map viewManagerDirectEvents = viewManager.getExportedCustomDirectEventTypeConstants();
    if (viewManagerDirectEvents != null) {
      recursiveMerge(cumulativeDirectEventTypes, viewManagerDirectEvents);
      recursiveMerge(viewManagerDirectEvents, defaultDirectEvents);
      viewManagerConstants.put(DIRECT_EVENTS_KEY, viewManagerDirectEvents);
    } else if (defaultDirectEvents != null) {
      viewManagerConstants.put(DIRECT_EVENTS_KEY, defaultDirectEvents);
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

    return viewManagerConstants;
  }

  /** Merges {@param source} map into {@param dest} map recursively */
  private static void recursiveMerge(@Nullable Map dest, @Nullable Map source) {
    if (dest == null || source == null || source.isEmpty()) {
      return;
    }

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
