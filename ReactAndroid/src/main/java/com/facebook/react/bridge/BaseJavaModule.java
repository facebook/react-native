/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import com.facebook.infer.annotation.Assertions;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;

import javax.annotation.Nullable;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

import static com.facebook.infer.annotation.Assertions.assertNotNull;
import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

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
  // taken from Libraries/Utilities/MessageQueue.js
  static final public String METHOD_TYPE_REMOTE = "remote";
  static final public String METHOD_TYPE_REMOTE_ASYNC = "remoteAsync";
  static final public String METHOD_TYPE_SYNC_HOOK = "syncHook";

  private static abstract class ArgumentExtractor<T> {
    public int getJSArgumentsNeeded() {
      return 1;
    }

    public abstract @Nullable T extractArgument(
        CatalystInstance catalystInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex);
  }

  static final private ArgumentExtractor<Boolean> ARGUMENT_EXTRACTOR_BOOLEAN =
      new ArgumentExtractor<Boolean>() {
        @Override
        public Boolean extractArgument(
            CatalystInstance catalystInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
          return jsArguments.getBoolean(atIndex);
        }
      };

  static final private ArgumentExtractor<Double> ARGUMENT_EXTRACTOR_DOUBLE =
      new ArgumentExtractor<Double>() {
        @Override
        public Double extractArgument(
            CatalystInstance catalystInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
          return jsArguments.getDouble(atIndex);
        }
      };

  static final private ArgumentExtractor<Float> ARGUMENT_EXTRACTOR_FLOAT =
      new ArgumentExtractor<Float>() {
        @Override
        public Float extractArgument(
            CatalystInstance catalystInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
          return (float) jsArguments.getDouble(atIndex);
        }
      };

  static final private ArgumentExtractor<Integer> ARGUMENT_EXTRACTOR_INTEGER =
      new ArgumentExtractor<Integer>() {
        @Override
        public Integer extractArgument(
            CatalystInstance catalystInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
          return (int) jsArguments.getDouble(atIndex);
        }
      };

  static final private ArgumentExtractor<String> ARGUMENT_EXTRACTOR_STRING =
      new ArgumentExtractor<String>() {
        @Override
        public String extractArgument(
            CatalystInstance catalystInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
          return jsArguments.getString(atIndex);
        }
      };

  static final private ArgumentExtractor<ReadableNativeArray> ARGUMENT_EXTRACTOR_ARRAY =
      new ArgumentExtractor<ReadableNativeArray>() {
        @Override
        public ReadableNativeArray extractArgument(
            CatalystInstance catalystInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
          return jsArguments.getArray(atIndex);
        }
      };

  static final private ArgumentExtractor<ReadableMap> ARGUMENT_EXTRACTOR_MAP =
      new ArgumentExtractor<ReadableMap>() {
        @Override
        public ReadableMap extractArgument(
            CatalystInstance catalystInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
          return jsArguments.getMap(atIndex);
        }
      };

  static final private ArgumentExtractor<Callback> ARGUMENT_EXTRACTOR_CALLBACK =
      new ArgumentExtractor<Callback>() {
        @Override
        public @Nullable Callback extractArgument(
            CatalystInstance catalystInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
          if (jsArguments.isNull(atIndex)) {
            return null;
          } else {
            int id = (int) jsArguments.getDouble(atIndex);
            return new CallbackImpl(catalystInstance, executorToken, id);
          }
        }
      };

  static final private ArgumentExtractor<Promise> ARGUMENT_EXTRACTOR_PROMISE =
      new ArgumentExtractor<Promise>() {
        @Override
        public int getJSArgumentsNeeded() {
          return 2;
        }

        @Override
        public Promise extractArgument(
            CatalystInstance catalystInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
          Callback resolve = ARGUMENT_EXTRACTOR_CALLBACK
              .extractArgument(catalystInstance, executorToken, jsArguments, atIndex);
          Callback reject = ARGUMENT_EXTRACTOR_CALLBACK
              .extractArgument(catalystInstance, executorToken, jsArguments, atIndex + 1);
          return new PromiseImpl(resolve, reject);
        }
      };

  public class JavaMethod implements NativeMethod {

    private Method mMethod;
    private final ArgumentExtractor[] mArgumentExtractors;
    private final String mSignature;
    private final Object[] mArguments;
    private String mType = METHOD_TYPE_REMOTE;
    private final int mJSArgumentsNeeded;
    private final String mTraceName;

    public JavaMethod(Method method) {
      mMethod = method;
      Class[] parameterTypes = method.getParameterTypes();
      mArgumentExtractors = buildArgumentExtractors(parameterTypes);
      mSignature = buildSignature(parameterTypes);
      // Since native methods are invoked from a message queue executed on a single thread, it is
      // save to allocate only one arguments object per method that can be reused across calls
      mArguments = new Object[parameterTypes.length];
      mJSArgumentsNeeded = calculateJSArgumentsNeeded();
      mTraceName = BaseJavaModule.this.getName() + "." + mMethod.getName();
    }

    public Method getMethod() {
      return mMethod;
    }

    public String getSignature() {
      return mSignature;
    }

    private String buildSignature(Class[] paramTypes) {
      StringBuilder builder = new StringBuilder(paramTypes.length);
      builder.append("v.");
      for (int i = 0; i < paramTypes.length; i++) {
        Class paramClass = paramTypes[i];
        if (paramClass == ExecutorToken.class) {
          if (!BaseJavaModule.this.supportsWebWorkers()) {
            throw new RuntimeException(
              "Module " + BaseJavaModule.this + " doesn't support web workers, but " +
                mMethod.getName() +
                " takes an ExecutorToken.");
          }
        } else if (paramClass == Promise.class) {
          Assertions.assertCondition(
            i == paramTypes.length - 1, "Promise must be used as last parameter only");
          mType = METHOD_TYPE_REMOTE_ASYNC;
        }
        builder.append(paramTypeToChar(paramClass));
      }

      // Modules that support web workers are expected to take an ExecutorToken as the first
      // parameter to all their @ReactMethod-annotated methods.
      if (BaseJavaModule.this.supportsWebWorkers()) {
        if (builder.charAt(2) != 'T') {
          throw new RuntimeException(
            "Module " + BaseJavaModule.this + " supports web workers, but " + mMethod.getName() +
              "does not take an ExecutorToken as its first parameter.");
        }
      }

      return builder.toString();
    }

    private ArgumentExtractor[] buildArgumentExtractors(Class[] paramTypes) {
      // Modules that support web workers are expected to take an ExecutorToken as the first
      // parameter to all their @ReactMethod-annotated methods. We compensate for that here.
      int executorTokenOffset = 0;
      if (BaseJavaModule.this.supportsWebWorkers()) {
        if (paramTypes[0] != ExecutorToken.class) {
          throw new RuntimeException(
              "Module " + BaseJavaModule.this + " supports web workers, but " + mMethod.getName() +
                  "does not take an ExecutorToken as its first parameter.");
        }
        executorTokenOffset = 1;
      }

      ArgumentExtractor[] argumentExtractors = new ArgumentExtractor[paramTypes.length - executorTokenOffset];
      for (int i = 0; i < paramTypes.length - executorTokenOffset; i += argumentExtractors[i].getJSArgumentsNeeded()) {
        int paramIndex = i + executorTokenOffset;
        Class argumentClass = paramTypes[paramIndex];
        if (argumentClass == Boolean.class || argumentClass == boolean.class) {
          argumentExtractors[i] = ARGUMENT_EXTRACTOR_BOOLEAN;
        } else if (argumentClass == Integer.class || argumentClass == int.class) {
          argumentExtractors[i] = ARGUMENT_EXTRACTOR_INTEGER;
        } else if (argumentClass == Double.class || argumentClass == double.class) {
          argumentExtractors[i] = ARGUMENT_EXTRACTOR_DOUBLE;
        } else if (argumentClass == Float.class || argumentClass == float.class) {
          argumentExtractors[i] = ARGUMENT_EXTRACTOR_FLOAT;
        } else if (argumentClass == String.class) {
          argumentExtractors[i] = ARGUMENT_EXTRACTOR_STRING;
        } else if (argumentClass == Callback.class) {
          argumentExtractors[i] = ARGUMENT_EXTRACTOR_CALLBACK;
        } else if (argumentClass == Promise.class) {
          argumentExtractors[i] = ARGUMENT_EXTRACTOR_PROMISE;
          Assertions.assertCondition(
              paramIndex == paramTypes.length - 1, "Promise must be used as last parameter only");
          mType = METHOD_TYPE_REMOTE_ASYNC;
        } else if (argumentClass == ReadableMap.class) {
          argumentExtractors[i] = ARGUMENT_EXTRACTOR_MAP;
        } else if (argumentClass == ReadableArray.class) {
          argumentExtractors[i] = ARGUMENT_EXTRACTOR_ARRAY;
        } else {
          throw new RuntimeException(
              "Got unknown argument class: " + argumentClass.getSimpleName());
        }
      }
      return argumentExtractors;
    }

    private int calculateJSArgumentsNeeded() {
      int n = 0;
      for (ArgumentExtractor extractor : mArgumentExtractors) {
        n += extractor.getJSArgumentsNeeded();
      }
      return n;
    }

    private String getAffectedRange(int startIndex, int jsArgumentsNeeded) {
      return jsArgumentsNeeded > 1 ?
          "" + startIndex + "-" + (startIndex + jsArgumentsNeeded - 1) : "" + startIndex;
    }

    @Override
    public void invoke(CatalystInstance catalystInstance, ExecutorToken executorToken, ReadableNativeArray parameters) {
      SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "callJavaModuleMethod")
          .arg("method", mTraceName)
          .flush();
      try {
        if (mJSArgumentsNeeded != parameters.size()) {
          throw new NativeArgumentsParseException(
              BaseJavaModule.this.getName() + "." + mMethod.getName() + " got " +
              parameters.size() + " arguments, expected " + mJSArgumentsNeeded);
        }

        // Modules that support web workers are expected to take an ExecutorToken as the first
        // parameter to all their @ReactMethod-annotated methods. We compensate for that here.
        int i = 0, jsArgumentsConsumed = 0;
        int executorTokenOffset = 0;
        if (BaseJavaModule.this.supportsWebWorkers()) {
          mArguments[0] = executorToken;
          executorTokenOffset = 1;
        }
        try {
          for (; i < mArgumentExtractors.length; i++) {
            mArguments[i + executorTokenOffset] = mArgumentExtractors[i].extractArgument(
                catalystInstance, executorToken, parameters, jsArgumentsConsumed);
            jsArgumentsConsumed += mArgumentExtractors[i].getJSArgumentsNeeded();
          }
        } catch (UnexpectedNativeTypeException e) {
          throw new NativeArgumentsParseException(
              e.getMessage() + " (constructing arguments for " + BaseJavaModule.this.getName() +
              "." + mMethod.getName() + " at argument index " +
              getAffectedRange(jsArgumentsConsumed, mArgumentExtractors[i].getJSArgumentsNeeded()) +
              ")",
              e);
        }

        try {
          mMethod.invoke(BaseJavaModule.this, mArguments);
        } catch (IllegalArgumentException ie) {
          throw new RuntimeException(
              "Could not invoke " + BaseJavaModule.this.getName() + "." + mMethod.getName(), ie);
        } catch (IllegalAccessException iae) {
          throw new RuntimeException(
              "Could not invoke " + BaseJavaModule.this.getName() + "." + mMethod.getName(), iae);
        } catch (InvocationTargetException ite) {
          // Exceptions thrown from native module calls end up wrapped in InvocationTargetException
          // which just make traces harder to read and bump out useful information
          if (ite.getCause() instanceof RuntimeException) {
            throw (RuntimeException) ite.getCause();
          }
          throw new RuntimeException(
              "Could not invoke " + BaseJavaModule.this.getName() + "." + mMethod.getName(), ite);
        }
      } finally {
        Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      }
    }

    /**
     * Determines how the method is exported in JavaScript:
     * METHOD_TYPE_REMOTE for regular methods
     * METHOD_TYPE_REMOTE_ASYNC for methods that return a promise object to the caller.
     */
    @Override
    public String getType() {
      return mType;
    }
  }

  public class SyncJavaHook implements SyncNativeHook {

    private Method mMethod;
    private final String mSignature;

    public SyncJavaHook(Method method) {
      mMethod = method;
      mSignature = buildSignature(method);
    }

    public Method getMethod() {
      return mMethod;
    }

    public String getSignature() {
      return mSignature;
    }

    private String buildSignature(Method method) {
      Class[] paramTypes = method.getParameterTypes();
      StringBuilder builder = new StringBuilder(paramTypes.length + 2);

      builder.append(returnTypeToChar(method.getReturnType()));
      builder.append('.');

      for (int i = 0; i < paramTypes.length; i++) {
        Class paramClass = paramTypes[i];
        if (paramClass == ExecutorToken.class) {
          if (!BaseJavaModule.this.supportsWebWorkers()) {
            throw new RuntimeException(
              "Module " + BaseJavaModule.this + " doesn't support web workers, but " +
                mMethod.getName() +
                " takes an ExecutorToken.");
          }
        } else if (paramClass == Promise.class) {
          Assertions.assertCondition(
            i == paramTypes.length - 1, "Promise must be used as last parameter only");
        }
        builder.append(paramTypeToChar(paramClass));
      }

      return builder.toString();
    }
  }

  private @Nullable Map<String, NativeMethod> mMethods;
  private @Nullable Map<String, SyncNativeHook> mHooks;

  private void findMethods() {
    if (mMethods == null) {
      Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "findMethods");
      mMethods = new HashMap<>();
      mHooks = new HashMap<>();

      Method[] targetMethods = getClass().getDeclaredMethods();
      for (Method targetMethod : targetMethods) {
        if (targetMethod.getAnnotation(ReactMethod.class) != null) {
          String methodName = targetMethod.getName();
          if (mHooks.containsKey(methodName) || mMethods.containsKey(methodName)) {
            // We do not support method overloading since js sees a function as an object regardless
            // of number of params.
            throw new IllegalArgumentException(
              "Java Module " + getName() + " sync method name already registered: " + methodName);
          }
          mMethods.put(methodName, new JavaMethod(targetMethod));
        }
        if (targetMethod.getAnnotation(ReactSyncHook.class) != null) {
          String methodName = targetMethod.getName();
          if (mHooks.containsKey(methodName) || mMethods.containsKey(methodName)) {
            // We do not support method overloading since js sees a function as an object regardless
            // of number of params.
            throw new IllegalArgumentException(
              "Java Module " + getName() + " sync method name already registered: " + methodName);
          }
          mHooks.put(methodName, new SyncJavaHook(targetMethod));
        }
      }
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  @Override
  public final Map<String, NativeMethod> getMethods() {
    findMethods();
    return assertNotNull(mMethods);
  }

  /**
   * @return a map of constants this module exports to JS. Supports JSON types.
   */
  public @Nullable Map<String, Object> getConstants() {
    return null;
  }

  public final Map<String, SyncNativeHook> getSyncHooks() {
    findMethods();
    return assertNotNull(mHooks);
  }

  @Override
  public final void writeConstantsField(JsonWriter writer, String fieldName) throws IOException {
    Map<String, Object> constants = getConstants();
    if (constants == null || constants.isEmpty()) {
      return;
    }

    writer.name(fieldName).beginObject();
    for (Map.Entry<String, Object> constant : constants.entrySet()) {
      writer.name(constant.getKey());
      JsonWriterHelper.value(writer, constant.getValue());
    }
    writer.endObject();
  }

  @Override
  public void initialize() {
    // do nothing
  }

  @Override
  public boolean canOverrideExistingModule() {
    return false;
  }

  @Override
  public void onReactBridgeInitialized(ReactBridge bridge) {
    // do nothing
  }

  @Override
  public void onCatalystInstanceDestroy() {
    // do nothing
  }

  @Override
  public boolean supportsWebWorkers() {
    return false;
  }

  private static char paramTypeToChar(Class paramClass) {
    char tryCommon = commonTypeToChar(paramClass);
    if (tryCommon != '\0') {
      return tryCommon;
    }
    if (paramClass == ExecutorToken.class) {
      return 'T';
    } else if (paramClass == Callback.class) {
      return 'X';
    } else if (paramClass == Promise.class) {
      return 'P';
    } else if (paramClass == ReadableMap.class) {
      return 'M';
    } else if (paramClass == ReadableArray.class) {
      return 'A';
    } else {
      throw new RuntimeException(
        "Got unknown param class: " + paramClass.getSimpleName());
    }
  }

  private static char returnTypeToChar(Class returnClass) {
    char tryCommon = commonTypeToChar(returnClass);
    if (tryCommon != '\0') {
      return tryCommon;
    }
    if (returnClass == void.class) {
      return 'v';
    } else if (returnClass == WritableMap.class) {
      return 'M';
    } else if (returnClass == WritableArray.class) {
      return 'A';
    } else {
      throw new RuntimeException(
        "Got unknown return class: " + returnClass.getSimpleName());
    }
  }

  private static char commonTypeToChar(Class typeClass) {
    if (typeClass == boolean.class) {
      return 'z';
    } else if (typeClass == Boolean.class) {
      return 'Z';
    } else if (typeClass == int.class) {
      return 'i';
    } else if (typeClass == Integer.class) {
      return 'I';
    } else if (typeClass == double.class) {
      return 'd';
    } else if (typeClass == Double.class) {
      return 'D';
    } else if (typeClass == float.class) {
      return 'f';
    } else if (typeClass == Float.class) {
      return 'F';
    } else if (typeClass == String.class) {
      return 'S';
    } else {
      return '\0';
    }
  }
}
