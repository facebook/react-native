/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.content.Context;
import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ColorPropConverter;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.DynamicFromObject;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * This class is responsible for holding view manager property setters and is used in a process of
 * updating views with the new properties set in JS.
 */
/*package*/ class ViewManagersPropertyCache {

  private static final Map<Class, Map<String, PropSetter>> CLASS_PROPS_CACHE = new HashMap<>();
  private static final Map<String, PropSetter> EMPTY_PROPS_MAP = new HashMap<>();

  public static void clear() {
    CLASS_PROPS_CACHE.clear();
    EMPTY_PROPS_MAP.clear();
  }

  /*package*/ abstract static class PropSetter {

    protected final String mPropName;
    protected final String mPropType;
    protected final Method mSetter;
    protected final @Nullable Integer mIndex; /* non-null only for group setters */

    // The following Object arrays are used to prevent extra allocations from varargs when we call.
    private static final ThreadLocal<Object[]> VIEW_MGR_ARGS = createThreadLocalArray(2);
    private static final ThreadLocal<Object[]> VIEW_MGR_GROUP_ARGS = createThreadLocalArray(3);
    private static final ThreadLocal<Object[]> SHADOW_ARGS = createThreadLocalArray(1);
    private static final ThreadLocal<Object[]> SHADOW_GROUP_ARGS = createThreadLocalArray(2);

    private PropSetter(ReactProp prop, String defaultType, Method setter) {
      mPropName = prop.name();
      mPropType =
          ReactProp.USE_DEFAULT_TYPE.equals(prop.customType()) ? defaultType : prop.customType();
      mSetter = setter;
      mIndex = null;
    }

    private PropSetter(ReactPropGroup prop, String defaultType, Method setter, int index) {
      mPropName = prop.names()[index];
      mPropType =
          ReactPropGroup.USE_DEFAULT_TYPE.equals(prop.customType())
              ? defaultType
              : prop.customType();
      mSetter = setter;
      mIndex = index;
    }

    public String getPropName() {
      return mPropName;
    }

    public String getPropType() {
      return mPropType;
    }

    public void updateViewProp(ViewManager viewManager, View viewToUpdate, Object value) {
      try {
        Object[] args;
        if (mIndex == null) {
          args = VIEW_MGR_ARGS.get();
          args[0] = viewToUpdate;
          args[1] = getValueOrDefault(value, viewToUpdate.getContext());
        } else {
          args = VIEW_MGR_GROUP_ARGS.get();
          args[0] = viewToUpdate;
          args[1] = mIndex;
          args[2] = getValueOrDefault(value, viewToUpdate.getContext());
        }
        mSetter.invoke(viewManager, args);
        Arrays.fill(args, null);
      } catch (Throwable t) {
        FLog.e(ViewManager.class, "Error while updating prop " + mPropName, t);
        throw new JSApplicationIllegalArgumentException(
            "Error while updating property '"
                + mPropName
                + "' of a view managed by: "
                + viewManager.getName(),
            t);
      }
    }

    public void updateShadowNodeProp(ReactShadowNode nodeToUpdate, Object value) {
      try {
        Object[] args;
        if (mIndex == null) {
          args = SHADOW_ARGS.get();
          args[0] = getValueOrDefault(value, nodeToUpdate.getThemedContext());
        } else {
          args = SHADOW_GROUP_ARGS.get();
          args[0] = mIndex;
          args[1] = getValueOrDefault(value, nodeToUpdate.getThemedContext());
        }
        mSetter.invoke(nodeToUpdate, args);
        Arrays.fill(args, null);
      } catch (Throwable t) {
        FLog.e(ViewManager.class, "Error while updating prop " + mPropName, t);
        throw new JSApplicationIllegalArgumentException(
            "Error while updating property '"
                + mPropName
                + "' in shadow node of type: "
                + nodeToUpdate.getViewClass(),
            t);
      }
    }

    protected abstract @Nullable Object getValueOrDefault(Object value, Context context);
  }

  private static class DynamicPropSetter extends PropSetter {

    public DynamicPropSetter(ReactProp prop, Method setter) {
      super(prop, "mixed", setter);
    }

    public DynamicPropSetter(ReactPropGroup prop, Method setter, int index) {
      super(prop, "mixed", setter, index);
    }

    @Override
    protected Object getValueOrDefault(Object value, Context context) {
      if (value instanceof Dynamic) {
        return value;
      } else {
        return new DynamicFromObject(value);
      }
    }
  }

  private static class IntPropSetter extends PropSetter {

    private final int mDefaultValue;

    public IntPropSetter(ReactProp prop, Method setter, int defaultValue) {
      super(prop, "number", setter);
      mDefaultValue = defaultValue;
    }

    public IntPropSetter(ReactPropGroup prop, Method setter, int index, int defaultValue) {
      super(prop, "number", setter, index);
      mDefaultValue = defaultValue;
    }

    @Override
    protected Object getValueOrDefault(Object value, Context context) {
      // All numbers from JS are Doubles which can't be simply cast to Integer
      return value == null ? mDefaultValue : (Integer) ((Double) value).intValue();
    }
  }

  private static class DoublePropSetter extends PropSetter {

    private final double mDefaultValue;

    public DoublePropSetter(ReactProp prop, Method setter, double defaultValue) {
      super(prop, "number", setter);
      mDefaultValue = defaultValue;
    }

    public DoublePropSetter(ReactPropGroup prop, Method setter, int index, double defaultValue) {
      super(prop, "number", setter, index);
      mDefaultValue = defaultValue;
    }

    @Override
    protected Object getValueOrDefault(Object value, Context context) {
      return value == null ? mDefaultValue : (Double) value;
    }
  }

  private static class ColorPropSetter extends PropSetter {

    private final int mDefaultValue;

    public ColorPropSetter(ReactProp prop, Method setter) {
      this(prop, setter, 0);
    }

    public ColorPropSetter(ReactProp prop, Method setter, int defaultValue) {
      super(prop, "mixed", setter);
      mDefaultValue = defaultValue;
    }

    @Override
    protected Object getValueOrDefault(Object value, Context context) {
      if (value == null) {
        return mDefaultValue;
      }

      return ColorPropConverter.getColor(value, context);
    }
  }

  private static class BooleanPropSetter extends PropSetter {

    private final boolean mDefaultValue;

    public BooleanPropSetter(ReactProp prop, Method setter, boolean defaultValue) {
      super(prop, "boolean", setter);
      mDefaultValue = defaultValue;
    }

    @Override
    protected Object getValueOrDefault(Object value, Context context) {
      boolean val = value == null ? mDefaultValue : (boolean) value;
      return val ? Boolean.TRUE : Boolean.FALSE;
    }
  }

  private static class FloatPropSetter extends PropSetter {

    private final float mDefaultValue;

    public FloatPropSetter(ReactProp prop, Method setter, float defaultValue) {
      super(prop, "number", setter);
      mDefaultValue = defaultValue;
    }

    public FloatPropSetter(ReactPropGroup prop, Method setter, int index, float defaultValue) {
      super(prop, "number", setter, index);
      mDefaultValue = defaultValue;
    }

    @Override
    protected Object getValueOrDefault(Object value, Context context) {
      // All numbers from JS are Doubles which can't be simply cast to Float
      return value == null ? mDefaultValue : (Float) ((Double) value).floatValue();
    }
  }

  private static class ArrayPropSetter extends PropSetter {

    public ArrayPropSetter(ReactProp prop, Method setter) {
      super(prop, "Array", setter);
    }

    @Override
    protected @Nullable Object getValueOrDefault(Object value, Context context) {
      return (ReadableArray) value;
    }
  }

  private static class MapPropSetter extends PropSetter {

    public MapPropSetter(ReactProp prop, Method setter) {
      super(prop, "Map", setter);
    }

    @Override
    protected @Nullable Object getValueOrDefault(Object value, Context context) {
      return (ReadableMap) value;
    }
  }

  private static class StringPropSetter extends PropSetter {

    public StringPropSetter(ReactProp prop, Method setter) {
      super(prop, "String", setter);
    }

    @Override
    protected @Nullable Object getValueOrDefault(Object value, Context context) {
      return (String) value;
    }
  }

  private static class BoxedBooleanPropSetter extends PropSetter {

    public BoxedBooleanPropSetter(ReactProp prop, Method setter) {
      super(prop, "boolean", setter);
    }

    @Override
    protected @Nullable Object getValueOrDefault(Object value, Context context) {
      if (value != null) {
        return (boolean) value ? Boolean.TRUE : Boolean.FALSE;
      }
      return null;
    }
  }

  private static class BoxedIntPropSetter extends PropSetter {

    public BoxedIntPropSetter(ReactProp prop, Method setter) {
      super(prop, "number", setter);
    }

    public BoxedIntPropSetter(ReactPropGroup prop, Method setter, int index) {
      super(prop, "number", setter, index);
    }

    @Override
    protected @Nullable Object getValueOrDefault(Object value, Context context) {
      if (value != null) {
        if (value instanceof Double) {
          return ((Double) value).intValue();
        } else {
          return (Integer) value;
        }
      }
      return null;
    }
  }

  private static class BoxedColorPropSetter extends PropSetter {

    public BoxedColorPropSetter(ReactProp prop, Method setter) {
      super(prop, "mixed", setter);
    }

    @Override
    protected @Nullable Object getValueOrDefault(Object value, Context context) {
      if (value != null) {
        return ColorPropConverter.getColor(value, context);
      }
      return null;
    }
  }

  /*package*/ static Map<String, String> getNativePropsForView(
      Class<? extends ViewManager> viewManagerTopClass,
      Class<? extends ReactShadowNode> shadowNodeTopClass) {
    Map<String, String> nativeProps = new HashMap<>();

    Map<String, PropSetter> viewManagerProps =
        getNativePropSettersForViewManagerClass(viewManagerTopClass);
    for (PropSetter setter : viewManagerProps.values()) {
      nativeProps.put(setter.getPropName(), setter.getPropType());
    }

    Map<String, PropSetter> shadowNodeProps =
        getNativePropSettersForShadowNodeClass(shadowNodeTopClass);
    for (PropSetter setter : shadowNodeProps.values()) {
      nativeProps.put(setter.getPropName(), setter.getPropType());
    }

    return nativeProps;
  }

  /**
   * Returns map from property name to setter instances for all the property setters annotated with
   * {@link ReactProp} in the given {@link ViewManager} class plus all the setter declared by its
   * parent classes.
   */
  /*package*/ static Map<String, PropSetter> getNativePropSettersForViewManagerClass(
      Class<? extends ViewManager> cls) {
    if (cls == ViewManager.class) {
      return EMPTY_PROPS_MAP;
    }
    Map<String, PropSetter> props = CLASS_PROPS_CACHE.get(cls);
    if (props != null) {
      return props;
    }
    // This is to include all the setters from parent classes. Once calculated the result will be
    // stored in CLASS_PROPS_CACHE so that we only scan for @ReactProp annotations once per class.
    props =
        new HashMap<>(
            getNativePropSettersForViewManagerClass(
                (Class<? extends ViewManager>) cls.getSuperclass()));
    extractPropSettersFromViewManagerClassDefinition(cls, props);
    CLASS_PROPS_CACHE.put(cls, props);
    return props;
  }

  /**
   * Returns map from property name to setter instances for all the property setters annotated with
   * {@link ReactProp} (or {@link ReactPropGroup} in the given {@link ReactShadowNode} subclass plus
   * all the setters declared by its parent classes up to {@link ReactShadowNode} which is treated
   * as a base class.
   */
  /*package*/ static Map<String, PropSetter> getNativePropSettersForShadowNodeClass(
      Class<? extends ReactShadowNode> cls) {
    for (Class iface : cls.getInterfaces()) {
      if (iface == ReactShadowNode.class) {
        return EMPTY_PROPS_MAP;
      }
    }
    Map<String, PropSetter> props = CLASS_PROPS_CACHE.get(cls);
    if (props != null) {
      return props;
    }
    // This is to include all the setters from parent classes up to ReactShadowNode class
    props =
        new HashMap<>(
            getNativePropSettersForShadowNodeClass(
                (Class<? extends ReactShadowNode>) cls.getSuperclass()));
    extractPropSettersFromShadowNodeClassDefinition(cls, props);
    CLASS_PROPS_CACHE.put(cls, props);
    return props;
  }

  private static PropSetter createPropSetter(
      ReactProp annotation, Method method, Class<?> propTypeClass) {
    if (propTypeClass == Dynamic.class) {
      return new DynamicPropSetter(annotation, method);
    } else if (propTypeClass == boolean.class) {
      return new BooleanPropSetter(annotation, method, annotation.defaultBoolean());
    } else if (propTypeClass == int.class) {
      if ("Color".equals(annotation.customType())) {
        return new ColorPropSetter(annotation, method, annotation.defaultInt());
      }
      return new IntPropSetter(annotation, method, annotation.defaultInt());
    } else if (propTypeClass == float.class) {
      return new FloatPropSetter(annotation, method, annotation.defaultFloat());
    } else if (propTypeClass == double.class) {
      return new DoublePropSetter(annotation, method, annotation.defaultDouble());
    } else if (propTypeClass == String.class) {
      return new StringPropSetter(annotation, method);
    } else if (propTypeClass == Boolean.class) {
      return new BoxedBooleanPropSetter(annotation, method);
    } else if (propTypeClass == Integer.class) {
      if ("Color".equals(annotation.customType())) {
        return new BoxedColorPropSetter(annotation, method);
      }
      return new BoxedIntPropSetter(annotation, method);
    } else if (propTypeClass == ReadableArray.class) {
      return new ArrayPropSetter(annotation, method);
    } else if (propTypeClass == ReadableMap.class) {
      return new MapPropSetter(annotation, method);
    } else {
      throw new RuntimeException(
          "Unrecognized type: "
              + propTypeClass
              + " for method: "
              + method.getDeclaringClass().getName()
              + "#"
              + method.getName());
    }
  }

  private static void createPropSetters(
      ReactPropGroup annotation,
      Method method,
      Class<?> propTypeClass,
      Map<String, PropSetter> props) {
    String[] names = annotation.names();
    if (propTypeClass == Dynamic.class) {
      for (int i = 0; i < names.length; i++) {
        props.put(names[i], new DynamicPropSetter(annotation, method, i));
      }
    } else if (propTypeClass == int.class) {
      for (int i = 0; i < names.length; i++) {
        props.put(names[i], new IntPropSetter(annotation, method, i, annotation.defaultInt()));
      }
    } else if (propTypeClass == float.class) {
      for (int i = 0; i < names.length; i++) {
        props.put(names[i], new FloatPropSetter(annotation, method, i, annotation.defaultFloat()));
      }
    } else if (propTypeClass == double.class) {
      for (int i = 0; i < names.length; i++) {
        props.put(
            names[i], new DoublePropSetter(annotation, method, i, annotation.defaultDouble()));
      }
    } else if (propTypeClass == Integer.class) {
      for (int i = 0; i < names.length; i++) {
        props.put(names[i], new BoxedIntPropSetter(annotation, method, i));
      }
    } else {
      throw new RuntimeException(
          "Unrecognized type: "
              + propTypeClass
              + " for method: "
              + method.getDeclaringClass().getName()
              + "#"
              + method.getName());
    }
  }

  private static void extractPropSettersFromViewManagerClassDefinition(
      Class<? extends ViewManager> cls, Map<String, PropSetter> props) {
    Method[] declaredMethods = cls.getDeclaredMethods();
    for (int i = 0; i < declaredMethods.length; i++) {
      Method method = declaredMethods[i];
      ReactProp annotation = method.getAnnotation(ReactProp.class);
      if (annotation != null) {
        Class<?>[] paramTypes = method.getParameterTypes();
        if (paramTypes.length != 2) {
          throw new RuntimeException(
              "Wrong number of args for prop setter: " + cls.getName() + "#" + method.getName());
        }
        if (!View.class.isAssignableFrom(paramTypes[0])) {
          throw new RuntimeException(
              "First param should be a view subclass to be updated: "
                  + cls.getName()
                  + "#"
                  + method.getName());
        }
        props.put(annotation.name(), createPropSetter(annotation, method, paramTypes[1]));
      }

      ReactPropGroup groupAnnotation = method.getAnnotation(ReactPropGroup.class);
      if (groupAnnotation != null) {
        Class<?>[] paramTypes = method.getParameterTypes();
        if (paramTypes.length != 3) {
          throw new RuntimeException(
              "Wrong number of args for group prop setter: "
                  + cls.getName()
                  + "#"
                  + method.getName());
        }
        if (!View.class.isAssignableFrom(paramTypes[0])) {
          throw new RuntimeException(
              "First param should be a view subclass to be updated: "
                  + cls.getName()
                  + "#"
                  + method.getName());
        }
        if (paramTypes[1] != int.class) {
          throw new RuntimeException(
              "Second argument should be property index: "
                  + cls.getName()
                  + "#"
                  + method.getName());
        }
        createPropSetters(groupAnnotation, method, paramTypes[2], props);
      }
    }
  }

  private static void extractPropSettersFromShadowNodeClassDefinition(
      Class<? extends ReactShadowNode> cls, Map<String, PropSetter> props) {
    for (Method method : cls.getDeclaredMethods()) {
      ReactProp annotation = method.getAnnotation(ReactProp.class);
      if (annotation != null) {
        Class<?>[] paramTypes = method.getParameterTypes();
        if (paramTypes.length != 1) {
          throw new RuntimeException(
              "Wrong number of args for prop setter: " + cls.getName() + "#" + method.getName());
        }
        props.put(annotation.name(), createPropSetter(annotation, method, paramTypes[0]));
      }

      ReactPropGroup groupAnnotation = method.getAnnotation(ReactPropGroup.class);
      if (groupAnnotation != null) {
        Class<?>[] paramTypes = method.getParameterTypes();
        if (paramTypes.length != 2) {
          throw new RuntimeException(
              "Wrong number of args for group prop setter: "
                  + cls.getName()
                  + "#"
                  + method.getName());
        }
        if (paramTypes[0] != int.class) {
          throw new RuntimeException(
              "Second argument should be property index: "
                  + cls.getName()
                  + "#"
                  + method.getName());
        }
        createPropSetters(groupAnnotation, method, paramTypes[1], props);
      }
    }
  }

  private static ThreadLocal<Object[]> createThreadLocalArray(final int size) {

    if (size <= 0) {
      return null;
    }

    return new ThreadLocal<Object[]>() {
      @Nullable
      @Override
      protected Object[] initialValue() {
        return new Object[size];
      }
    };
  }
}
