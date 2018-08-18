// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager;

import java.util.HashMap;
import java.util.Map;

import android.view.View;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;

public class ViewManagerPropertyUpdater {
  public interface Settable {
     void getProperties(Map<String, String> props);
  }

  public interface ViewManagerSetter<T extends ViewManager, V extends View> extends Settable {
    void setProperty(T manager, V view, String name, ReactStylesDiffMap props);
  }

  public interface ShadowNodeSetter<T extends ReactShadowNode> extends Settable {
    void setProperty(T node, String name, ReactStylesDiffMap props);
  }

  private static final String TAG = "ViewManagerPropertyUpdater";

  private static final Map<Class<?>, ViewManagerSetter<?, ?>> VIEW_MANAGER_SETTER_MAP =
      new HashMap<>();
  private static final Map<Class<?>, ShadowNodeSetter<?>> SHADOW_NODE_SETTER_MAP = new HashMap<>();

  public static void clear() {
    ViewManagersPropertyCache.clear();
    VIEW_MANAGER_SETTER_MAP.clear();
    SHADOW_NODE_SETTER_MAP.clear();
  }

  public static <T extends ViewManager, V extends View> void updateProps(
      T manager,
      V v,
      ReactStylesDiffMap props) {
    ViewManagerSetter<T, V> setter = findManagerSetter(manager.getClass());
    ReadableMap propMap = props.mBackingMap;
    ReadableMapKeySetIterator iterator = propMap.keySetIterator();
    while (iterator.hasNextKey()) {
      String key = iterator.nextKey();
      setter.setProperty(manager, v, key, props);
    }
  }

  public static <T extends ReactShadowNode> void updateProps(T node, ReactStylesDiffMap props) {
    ShadowNodeSetter<T> setter = findNodeSetter(node.getClass());
    ReadableMap propMap = props.mBackingMap;
    ReadableMapKeySetIterator iterator = propMap.keySetIterator();
    while (iterator.hasNextKey()) {
      String key = iterator.nextKey();
      setter.setProperty(node, key, props);
    }
  }

  public static Map<String, String> getNativeProps(
      Class<? extends ViewManager> viewManagerTopClass,
      Class<? extends ReactShadowNode> shadowNodeTopClass) {
    Map<String, String> props = new HashMap<>();
    findManagerSetter(viewManagerTopClass).getProperties(props);
    findNodeSetter(shadowNodeTopClass).getProperties(props);
    return props;
  }

  private static <T extends ViewManager, V extends View> ViewManagerSetter<T, V> findManagerSetter(
      Class<? extends ViewManager> managerClass) {
    @SuppressWarnings("unchecked")
    ViewManagerSetter<T, V> setter =
        (ViewManagerSetter<T, V>) VIEW_MANAGER_SETTER_MAP.get(managerClass);
    if (setter == null) {
      setter = findGeneratedSetter(managerClass);
      if (setter == null) {
        setter = new FallbackViewManagerSetter<>(managerClass);
      }
      VIEW_MANAGER_SETTER_MAP.put(managerClass, setter);
    }

    return setter;
  }

  private static <T extends ReactShadowNode> ShadowNodeSetter<T> findNodeSetter(
      Class<? extends ReactShadowNode> nodeClass) {
    @SuppressWarnings("unchecked")
    ShadowNodeSetter<T> setter = (ShadowNodeSetter<T>) SHADOW_NODE_SETTER_MAP.get(nodeClass);
    if (setter == null) {
      setter = findGeneratedSetter(nodeClass);
      if (setter == null) {
        setter = new FallbackShadowNodeSetter<>(nodeClass);
      }
      SHADOW_NODE_SETTER_MAP.put(nodeClass, setter);
    }

    return setter;
  }

  private static <T> T findGeneratedSetter(Class<?> cls) {
    String clsName = cls.getName();
    try {
      Class<?> setterClass = Class.forName(clsName + "$$PropsSetter");
      //noinspection unchecked
      return (T) setterClass.newInstance();
    } catch (ClassNotFoundException e) {
      FLog.w(TAG, "Could not find generated setter for " + cls);
      return null;
    } catch (InstantiationException | IllegalAccessException e) {
      throw new RuntimeException("Unable to instantiate methods getter for " + clsName, e);
    }
  }

  private static class FallbackViewManagerSetter<T extends ViewManager, V extends View>
      implements ViewManagerSetter<T, V> {
    private final Map<String, ViewManagersPropertyCache.PropSetter> mPropSetters;

    private FallbackViewManagerSetter(Class<? extends ViewManager> viewManagerClass) {
      mPropSetters =
          ViewManagersPropertyCache.getNativePropSettersForViewManagerClass(viewManagerClass);
    }

    @Override
    public void setProperty(T manager, V v, String name, ReactStylesDiffMap props) {
      ViewManagersPropertyCache.PropSetter setter = mPropSetters.get(name);
      if (setter != null) {
        setter.updateViewProp(manager, v, props);
      }
    }

    @Override
    public void getProperties(Map<String, String> props) {
      for (ViewManagersPropertyCache.PropSetter setter : mPropSetters.values()) {
        props.put(setter.getPropName(), setter.getPropType());
      }
    }
  }

  private static class FallbackShadowNodeSetter<T extends ReactShadowNode>
      implements ShadowNodeSetter<T> {
    private final Map<String, ViewManagersPropertyCache.PropSetter> mPropSetters;

    private FallbackShadowNodeSetter(Class<? extends ReactShadowNode> shadowNodeClass) {
      mPropSetters =
          ViewManagersPropertyCache.getNativePropSettersForShadowNodeClass(shadowNodeClass);
    }

    @Override
    public void setProperty(ReactShadowNode node, String name, ReactStylesDiffMap props) {
      ViewManagersPropertyCache.PropSetter setter = mPropSetters.get(name);
      if (setter != null) {
        setter.updateShadowNodeProp(node, props);
      }
    }

    @Override
    public void getProperties(Map<String, String> props) {
      for (ViewManagersPropertyCache.PropSetter setter : mPropSetters.values()) {
        props.put(setter.getPropName(), setter.getPropType());
      }
    }
  }
}
