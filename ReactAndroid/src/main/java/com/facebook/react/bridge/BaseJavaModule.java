/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import com.fasterxml.jackson.core.JsonGenerator;

import com.facebook.systrace.Systrace;

import javax.annotation.Nullable;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

/**
 * Base class for Catalyst native modules whose implementations are written in Java. Default
 * implementations for {@link #initialize} and {@link #onCatalystInstanceDestroy} are provided for
 * convenience.  Subclasses which override these don't need to call {@code super} in case of
 * overriding those methods as implementation of those methods is empty.
 *
 * BaseJavaModules can be linked to Fragments' lifecycle events, {@link CatalystInstance} creation
 * and destruction, by being called on the appropriate method when a life cycle event occurs.
 *
 * Native methods can be exposed to JS with {@link ReactMethod} annotation. Those methods may
 * only use limited number of types for their arguments:
 * 1/ primitives (boolean, int, float, double
 * 2/ {@link String} mapped from JS string
 * 3/ {@link ReadableArray} mapped from JS Array
 * 4/ {@link ReadableMap} mapped from JS Object
 * 5/ {@link Callback} mapped from js function and can be used only as a last parameter or in the
 * case when it express success & error callback pair as two last arguments respecively.
 *
 * All methods exposed as native to JS with {@link ReactMethod} annotation must return
 * {@code void}.
 *
 * Please note that it is not allowed to have multiple methods annotated with {@link ReactMethod}
 * with the same name.
 */
public abstract class BaseJavaModule implements NativeModule {
  private class JavaMethod implements NativeMethod {
    private Method method;

    public JavaMethod(Method method) {
      this.method = method;
    }

    @Override
    public void invoke(CatalystInstance catalystInstance, ReadableNativeArray parameters) {
      Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "callJavaModuleMethod");
      try {
        Class[] types = method.getParameterTypes();
        if (types.length != parameters.size()) {
          throw new NativeArgumentsParseException(
              BaseJavaModule.this.getName() + "." + method.getName() + " got " + parameters.size() +
              " arguments, expected " + types.length);
        }
        Object[] arguments = new Object[types.length];

        int i = 0;
        try {
          for (; i < types.length; i++) {
            Class argumentClass = types[i];
            if (argumentClass == Boolean.class || argumentClass == boolean.class) {
              arguments[i] = Boolean.valueOf(parameters.getBoolean(i));
            } else if (argumentClass == Integer.class || argumentClass == int.class) {
              arguments[i] = Integer.valueOf((int) parameters.getDouble(i));
            } else if (argumentClass == Double.class || argumentClass == double.class) {
              arguments[i] = Double.valueOf(parameters.getDouble(i));
            } else if (argumentClass == Float.class || argumentClass == float.class) {
              arguments[i] = Float.valueOf((float) parameters.getDouble(i));
            } else if (argumentClass == String.class) {
              arguments[i] = parameters.getString(i);
            } else if (argumentClass == Callback.class) {
              if (parameters.isNull(i)) {
                arguments[i] = null;
              } else {
                int id = (int) parameters.getDouble(i);
                arguments[i] = new CallbackImpl(catalystInstance, id);
              }
            } else if (argumentClass == ReadableMap.class) {
              arguments[i] = parameters.getMap(i);
            } else if (argumentClass == ReadableArray.class) {
              arguments[i] = parameters.getArray(i);
            } else {
              throw new RuntimeException(
                  "Got unknown argument class: " + argumentClass.getSimpleName());
            }
          }
        } catch (UnexpectedNativeTypeException e) {
          throw new NativeArgumentsParseException(
              e.getMessage() + " (constructing arguments for " + BaseJavaModule.this.getName() +
              "." + method.getName() + " at argument index " + i + ")",
              e);
        }

        try {
          method.invoke(BaseJavaModule.this, arguments);
        } catch (IllegalArgumentException ie) {
          throw new RuntimeException(
              "Could not invoke " + BaseJavaModule.this.getName() + "." + method.getName(), ie);
        } catch (IllegalAccessException iae) {
          throw new RuntimeException(
              "Could not invoke " + BaseJavaModule.this.getName() + "." + method.getName(), iae);
        } catch (InvocationTargetException ite) {
          // Exceptions thrown from native module calls end up wrapped in InvocationTargetException
          // which just make traces harder to read and bump out useful information
          if (ite.getCause() instanceof RuntimeException) {
            throw (RuntimeException) ite.getCause();
          }
          throw new RuntimeException(
              "Could not invoke " + BaseJavaModule.this.getName() + "." + method.getName(), ite);
        }
      } finally {
        Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      }
    }
  }

  @Override
  public final Map<String, NativeMethod> getMethods() {
    Map<String, NativeMethod> methods = new HashMap<String, NativeMethod>();
    Method[] targetMethods = getClass().getDeclaredMethods();
    for (int i = 0; i < targetMethods.length; i++) {
      Method targetMethod = targetMethods[i];
      if (targetMethod.getAnnotation(ReactMethod.class) != null) {
        String methodName = targetMethod.getName();
        if (methods.containsKey(methodName)) {
          // We do not support method overloading since js sees a function as an object regardless
          // of number of params.
          throw new IllegalArgumentException(
              "Java Module " + getName() + " method name already registered: " + methodName);
          }
        methods.put(methodName, new JavaMethod(targetMethod));
      }
    }
    return methods;
  }

  /**
   * @return a map of constants this module exports to JS. Supports JSON types.
   */
  public @Nullable Map<String, Object> getConstants() {
    return null;
  }

  @Override
  public final void writeConstantsField(JsonGenerator jg, String fieldName) throws IOException {
    Map<String, Object> constants = getConstants();
    if (constants == null || constants.isEmpty()) {
      return;
    }

    jg.writeObjectFieldStart(fieldName);
    for (Map.Entry<String, Object> constant : constants.entrySet()) {
      JsonGeneratorHelper.writeObjectField(
        jg,
        constant.getKey(),
        constant.getValue());
    }
    jg.writeEndObject();
  }

  @Override
  public void initialize() {
    // do nothing
  }

  @Override
  public void onCatalystInstanceDestroy() {
    // do nothing
  }
}
