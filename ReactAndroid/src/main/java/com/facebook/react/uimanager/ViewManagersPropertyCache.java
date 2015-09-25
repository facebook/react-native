// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

import android.view.View;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

/**
 * This class is responsible for holding view manager property setters and is used in a process of
 * updating views with the new properties set in JS.
 */
/*package*/ class ViewManagersPropertyCache {

  private static final Map<Class, Map<String, PropSetter>> CLASS_PROPS_CACHE = new HashMap<>();
  private static final Map<String, PropSetter> EMPTY_PROPS_MAP = new HashMap<>();

  /*package*/ static abstract class PropSetter {

    protected final String mPropName;
    protected final String mPropType;
    protected final Method mSetter;

    // The following two constructors make it easy to reuse code responsible for setting property
    // type. It's probably not a best design but this API is not exposed and since we can't use
    // inheritance for annotation classes it's the easiest way to avoid creating an extra base class
    // just to support group and non-group setters.
    private PropSetter(ReactProp prop, String defaultType, Method setter) {
      mPropName = prop.name();
      mPropType = ReactProp.USE_DEFAULT_TYPE.equals(prop.customType()) ?
          defaultType : prop.customType();
      mSetter = setter;
    }

    private PropSetter(ReactPropGroup prop, String defaultType, Method setter, int index) {
      mPropName = prop.names()[index];
      mPropType = ReactPropGroup.USE_DEFAULT_TYPE.equals(prop.customType()) ?
          defaultType : prop.customType();
      mSetter = setter;
    }

    public String getPropName() {
      return mPropName;
    }

    public String getPropType() {
      return mPropType;
    }

    public void updateProp(
        ViewManager viewManager,
        View viewToUpdate,
        CatalystStylesDiffMap props) {
      try {
        updateProperty(viewManager, viewToUpdate, props);
      } catch (Throwable t) {
        FLog.e(ViewManager.class, "Error while updating prop " + mPropName, t);
        throw new JSApplicationIllegalArgumentException("Error while updating property '" +
            mPropName + "' of a view managed by: " + viewManager.getName(), t);
      }
    }

    protected abstract void updateProperty(
        ViewManager viewManager,
        View viewToUpdate,
        CatalystStylesDiffMap props) throws InvocationTargetException, IllegalAccessException;
  }

  private static class IntPropSetter extends PropSetter {

    private final int mDefaultValue;

    public IntPropSetter(ReactProp prop, Method setter, int defaultValue) {
      super(prop, "number", setter);
      mDefaultValue = defaultValue;
    }

    @Override
    protected void updateProperty(
        ViewManager viewManager,
        View viewToUpdate,
        CatalystStylesDiffMap props) throws InvocationTargetException, IllegalAccessException {
      mSetter.invoke(viewManager, viewToUpdate, props.getInt(mPropName, mDefaultValue));
    }
  }

  private static class DoublePropSetter extends PropSetter {

    private final double mDefaultValue;

    public DoublePropSetter(ReactProp prop, Method setter, double defaultValue) {
      super(prop, "number", setter);
      mDefaultValue = defaultValue;
    }

    @Override
    protected void updateProperty(
        ViewManager viewManager,
        View viewToUpdate,
        CatalystStylesDiffMap props) throws InvocationTargetException, IllegalAccessException {
      mSetter.invoke(viewManager, viewToUpdate, props.getDouble(mPropName, mDefaultValue));
    }
  }

  private static class BooleanPropSetter extends PropSetter {

    private final boolean mDefaultValue;

    public BooleanPropSetter(ReactProp prop, Method setter, boolean defaultValue) {
      super(prop, "boolean", setter);
      mDefaultValue = defaultValue;
    }

    @Override
    protected void updateProperty(
        ViewManager viewManager,
        View viewToUpdate,
        CatalystStylesDiffMap props) throws InvocationTargetException, IllegalAccessException {
      mSetter.invoke(viewManager, viewToUpdate, props.getBoolean(mPropName, mDefaultValue));
    }
  }

  private static class FloatPropSetter extends PropSetter {

    private final float mDefaultValue;

    public FloatPropSetter(ReactProp prop, Method setter, float defaultValue) {
      super(prop, "number", setter);
      mDefaultValue = defaultValue;
    }

    @Override
    protected void updateProperty(
        ViewManager viewManager,
        View viewToUpdate,
        CatalystStylesDiffMap props) throws InvocationTargetException, IllegalAccessException {
      mSetter.invoke(viewManager, viewToUpdate, props.getFloat(mPropName, mDefaultValue));
    }
  }

  private static class ArrayPropSetter extends PropSetter {

    public ArrayPropSetter(ReactProp prop, Method setter) {
      super(prop, "Array", setter);
    }

    @Override
    protected void updateProperty(
        ViewManager viewManager,
        View viewToUpdate,
        CatalystStylesDiffMap props) throws InvocationTargetException, IllegalAccessException {
      mSetter.invoke(viewManager, viewToUpdate, props.getArray(mPropName));
    }
  }

  private static class MapPropSetter extends PropSetter {

    public MapPropSetter(ReactProp prop, Method setter) {
      super(prop, "Map", setter);
    }

    @Override
    protected void updateProperty(
        ViewManager viewManager,
        View viewToUpdate,
        CatalystStylesDiffMap props) throws InvocationTargetException, IllegalAccessException {
      mSetter.invoke(viewManager, viewToUpdate, props.getMap(mPropName));
    }
  }

  private static class StringPropSetter extends PropSetter {

    public StringPropSetter(ReactProp prop, Method setter) {
      super(prop, "String", setter);
    }

    @Override
    protected void updateProperty(
        ViewManager viewManager,
        View viewToUpdate,
        CatalystStylesDiffMap props) throws InvocationTargetException, IllegalAccessException {
      mSetter.invoke(viewManager, viewToUpdate, props.getString(mPropName));
    }
  }

  private static class BoxedBooleanPropSetter extends PropSetter {

    public BoxedBooleanPropSetter(ReactProp prop, Method setter) {
      super(prop, "boolean", setter);
    }

    @Override
    protected void updateProperty(
        ViewManager viewManager,
        View viewToUpdate,
        CatalystStylesDiffMap props) throws InvocationTargetException, IllegalAccessException {
      Boolean value = null;
      if (!props.isNull(mPropName)) {
        value = props.getBoolean(mPropName, false) ? Boolean.TRUE : Boolean.FALSE;
      }
      mSetter.invoke(viewManager, viewToUpdate, value);
    }
  }

  private static class BoxedIntPropSetter extends PropSetter {

    public BoxedIntPropSetter(ReactProp prop, Method setter) {
      super(prop, "number", setter);
    }

    @Override
    protected void updateProperty(
        ViewManager viewManager,
        View viewToUpdate,
        CatalystStylesDiffMap props) throws InvocationTargetException, IllegalAccessException {
      Integer value = null;
      if (!props.isNull(mPropName)) {
        value = props.getInt(mPropName, /* ignored */ 0);
      }
      mSetter.invoke(viewManager, viewToUpdate, value);
    }
  }

  private static abstract class GroupSetter extends PropSetter {

    protected final int mIndex;

    protected GroupSetter(ReactPropGroup prop, String defaultType, Method setter, int index) {
      super(prop, defaultType, setter, index);
      mIndex = index;
    }
  }

  private static class GroupIntSetter extends GroupSetter {

    private final int mDefaultValue;

    public GroupIntSetter(ReactPropGroup prop, Method setter, int index, int defaultValue) {
      super(prop, "number", setter, index);
      mDefaultValue = defaultValue;
    }

    @Override
    protected void updateProperty(
        ViewManager viewManager,
        View viewToUpdate,
        CatalystStylesDiffMap props) throws InvocationTargetException, IllegalAccessException {
      mSetter.invoke(viewManager, viewToUpdate, mIndex, props.getInt(mPropName, mDefaultValue));
    }
  }

  private static class GroupFloatSetter extends GroupSetter {

    private final float mDefaultValue;

    public GroupFloatSetter(ReactPropGroup prop, Method setter, int index, float defaultValue) {
      super(prop, "number", setter, index);
      mDefaultValue = defaultValue;
    }

    @Override
    protected void updateProperty(
        ViewManager viewManager,
        View viewToUpdate,
        CatalystStylesDiffMap props) throws InvocationTargetException, IllegalAccessException {
      mSetter.invoke(viewManager, viewToUpdate, mIndex, props.getFloat(mPropName, mDefaultValue));
    }
  }

  private static class GroupBoxedIntSetter extends GroupSetter {

    protected GroupBoxedIntSetter(ReactPropGroup prop, Method setter, int index) {
      super(prop, "number", setter, index);
    }

    @Override
    protected void updateProperty(
        ViewManager viewManager,
        View viewToUpdate,
        CatalystStylesDiffMap props) throws InvocationTargetException, IllegalAccessException {
      mSetter.invoke(
          viewManager,
          viewToUpdate,
          mIndex,
          props.isNull(mPropName) ? null : props.getInt(mPropName, /* unused */ 0));
    }
  }

  /*package*/ static Map<String, String> getNativePropsForClass(
      Class<? extends ViewManager> topLevelClass) {
    Map<String, String> nativeProps = new HashMap<>();
    Map<String, PropSetter> props = getNativePropSettersForClass(topLevelClass);
    for (PropSetter setter : props.values()) {
      nativeProps.put(setter.getPropName(), setter.getPropType());
    }
    return nativeProps;
  }

  /*package*/ static Map<String, PropSetter> getNativePropSettersForClass(
      Class<? extends ViewManager> cls) {
    if (cls == ViewManager.class) {
      return EMPTY_PROPS_MAP;
    }
    Map<String, PropSetter> props = CLASS_PROPS_CACHE.get(cls);
    if (props != null) {
      return props;
    }
    props = new HashMap<>(
        getNativePropSettersForClass((Class<? extends ViewManager>) cls.getSuperclass()));
    for (Method method : cls.getDeclaredMethods()) {
      {
        ReactProp annotation = method.getAnnotation(ReactProp.class);
        if (annotation != null) {
          Class<?>[] paramTypes = method.getParameterTypes();
          if (paramTypes.length != 2) {
            throw new RuntimeException("Wrong number of args for prop setter: " +
                cls.getName() + "#" + method.getName());
          }
          if (!View.class.isAssignableFrom(paramTypes[0])) {
            throw new RuntimeException("First param should be a view subclass to be updated: " +
                cls.getName() + "#" + method.getName());
          }
          Class<?> propTypeClass = paramTypes[1];
          PropSetter propSetter;
          if (propTypeClass == boolean.class) {
            propSetter =
                new BooleanPropSetter(annotation, method, annotation.defaultBoolean());
          } else if (propTypeClass == int.class) {
            propSetter = new IntPropSetter(annotation, method, annotation.defaultInt());
          } else if (propTypeClass == float.class) {
            propSetter = new FloatPropSetter(annotation, method, annotation.defaultFloat());
          } else if (propTypeClass == double.class) {
            propSetter =
                new DoublePropSetter(annotation, method, annotation.defaultDouble());
          } else if (propTypeClass == String.class) {
            propSetter = new StringPropSetter(annotation, method);
          } else if (propTypeClass == Boolean.class) {
            propSetter = new BoxedBooleanPropSetter(annotation, method);
          } else if (propTypeClass == Integer.class) {
            propSetter = new BoxedIntPropSetter(annotation, method);
          } else if (propTypeClass == ReadableArray.class) {
            propSetter = new ArrayPropSetter(annotation, method);
          } else if (propTypeClass == ReadableMap.class) {
            propSetter = new MapPropSetter(annotation, method);
          } else {
            throw new RuntimeException("Unrecognized type");
          }
          props.put(annotation.name(), propSetter);
        }
      }
      {
        ReactPropGroup annotation = method.getAnnotation(ReactPropGroup.class);
        if (annotation != null) {
          Class<?> [] paramTypes = method.getParameterTypes();
          if (paramTypes.length != 3) {
            throw new RuntimeException("Wrong number of args for group prop setter: " +
                cls.getName() + "#" + method.getName());
          }
          if (!View.class.isAssignableFrom(paramTypes[0])) {
            throw new RuntimeException("First param should be a view subclass to be updated: " +
                cls.getName() + "#" + method.getName());
          }
          if (paramTypes[1] != int.class) {
            throw new RuntimeException("Second argument should be property index: " +
                cls.getName() + "#" + method.getName());
          }
          Class<?> propTypeClass = paramTypes[2];
          String[] names = annotation.names();
          if (propTypeClass == int.class) {
            for (int i = 0; i < names.length; i++) {
              props.put(
                  names[i],
                  new GroupIntSetter(annotation, method, i, annotation.defaultInt()));
            }
          } else if (propTypeClass == float.class) {
            for (int i = 0; i < names.length; i++) {
              props.put(
                  names[i],
                  new GroupFloatSetter(annotation, method, i, annotation.defaultFloat()));
            }
          } else if (propTypeClass == Integer.class) {
            for (int i = 0; i < names.length; i++) {
              props.put(
                  names[i],
                  new GroupBoxedIntSetter(annotation, method, i));
            }
          } else {
            throw new RuntimeException("Unrecognized type: " + paramTypes[2] + " for method: " +
                cls.getName() + "#" + method.getName());
          }
        }
      }
    }
    CLASS_PROPS_CACHE.put(cls, props);
    return props;
  }
}
