/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.cxxbridge;

import javax.annotation.Nullable;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import com.facebook.react.bridge.*;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.cxxbridge.JavaModuleWrapper;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;

import static com.facebook.infer.annotation.Assertions.assertNotNull;
import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

public class JavaMethodWrapper implements NativeModule.NativeMethod {

  private static abstract class ArgumentExtractor<T> {
    public int getJSArgumentsNeeded() {
      return 1;
    }

    public abstract @Nullable T extractArgument(
      JSInstance jsInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex);
  }

  static final private ArgumentExtractor<Boolean> ARGUMENT_EXTRACTOR_BOOLEAN =
    new ArgumentExtractor<Boolean>() {
      @Override
      public Boolean extractArgument(
        JSInstance jsInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
        return jsArguments.getBoolean(atIndex);
      }
    };

  static final private ArgumentExtractor<Double> ARGUMENT_EXTRACTOR_DOUBLE =
    new ArgumentExtractor<Double>() {
      @Override
      public Double extractArgument(
        JSInstance jsInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
        return jsArguments.getDouble(atIndex);
      }
    };

  static final private ArgumentExtractor<Float> ARGUMENT_EXTRACTOR_FLOAT =
    new ArgumentExtractor<Float>() {
      @Override
      public Float extractArgument(
        JSInstance jsInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
        return (float) jsArguments.getDouble(atIndex);
      }
    };

  static final private ArgumentExtractor<Integer> ARGUMENT_EXTRACTOR_INTEGER =
    new ArgumentExtractor<Integer>() {
      @Override
      public Integer extractArgument(
        JSInstance jsInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
        return (int) jsArguments.getDouble(atIndex);
      }
    };

  static final private ArgumentExtractor<String> ARGUMENT_EXTRACTOR_STRING =
    new ArgumentExtractor<String>() {
      @Override
      public String extractArgument(
        JSInstance jsInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
        return jsArguments.getString(atIndex);
      }
    };

  static final private ArgumentExtractor<ReadableNativeArray> ARGUMENT_EXTRACTOR_ARRAY =
    new ArgumentExtractor<ReadableNativeArray>() {
      @Override
      public ReadableNativeArray extractArgument(
        JSInstance jsInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
        return jsArguments.getArray(atIndex);
      }
    };

  static final private ArgumentExtractor<Dynamic> ARGUMENT_EXTRACTOR_DYNAMIC =
    new ArgumentExtractor<Dynamic>() {
      @Override
      public Dynamic extractArgument(
        JSInstance jsInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
        return DynamicFromArray.create(jsArguments, atIndex);
      }
    };

  static final private ArgumentExtractor<ReadableMap> ARGUMENT_EXTRACTOR_MAP =
    new ArgumentExtractor<ReadableMap>() {
      @Override
      public ReadableMap extractArgument(
        JSInstance jsInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
        return jsArguments.getMap(atIndex);
      }
    };

  static final private ArgumentExtractor<Callback> ARGUMENT_EXTRACTOR_CALLBACK =
    new ArgumentExtractor<Callback>() {
      @Override
      public @Nullable Callback extractArgument(
        JSInstance jsInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
        if (jsArguments.isNull(atIndex)) {
          return null;
        } else {
          int id = (int) jsArguments.getDouble(atIndex);
          return new com.facebook.react.bridge.CallbackImpl(jsInstance, executorToken, id);
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
        JSInstance jsInstance, ExecutorToken executorToken, ReadableNativeArray jsArguments, int atIndex) {
        Callback resolve = ARGUMENT_EXTRACTOR_CALLBACK
          .extractArgument(jsInstance, executorToken, jsArguments, atIndex);
        Callback reject = ARGUMENT_EXTRACTOR_CALLBACK
          .extractArgument(jsInstance, executorToken, jsArguments, atIndex + 1);
        return new PromiseImpl(resolve, reject);
      }
    };

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
    } else if (paramClass == Dynamic.class) {
      return 'Y';
    } else {
      throw new RuntimeException(
        "Got unknown param class: " + paramClass.getSimpleName());
    }
  }

  private static char returnTypeToChar(Class returnClass) {
    // Keep this in sync with MethodInvoker
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

  private final Method mMethod;
  private final Class[] mParameterTypes;
  private final int mParamLength;
  private final JavaModuleWrapper mModuleWrapper;
  private String mType = BaseJavaModule.METHOD_TYPE_ASYNC;
  private boolean mArgumentsProcessed = false;
  private @Nullable ArgumentExtractor[] mArgumentExtractors;
  private @Nullable String mSignature;
  private @Nullable Object[] mArguments;
  private @Nullable int mJSArgumentsNeeded;

  public JavaMethodWrapper(JavaModuleWrapper module, Method method, boolean isSync) {
    mModuleWrapper = module;
    mMethod = method;
    mMethod.setAccessible(true);
    mParameterTypes = mMethod.getParameterTypes();
    mParamLength = mParameterTypes.length;

    if (isSync) {
      mType = BaseJavaModule.METHOD_TYPE_SYNC;
    } else if (mParamLength > 0 && (mParameterTypes[mParamLength - 1] == Promise.class)) {
      mType = BaseJavaModule.METHOD_TYPE_PROMISE;
    }
  }

  private void processArguments() {
    if (mArgumentsProcessed) {
      return;
    }
    SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "processArguments")
      .arg("method", mModuleWrapper.getName() + "." + mMethod.getName())
      .flush();
    mArgumentsProcessed = true;
    mArgumentExtractors = buildArgumentExtractors(mParameterTypes);
    mSignature = buildSignature(mMethod, mParameterTypes, (mType.equals(BaseJavaModule.METHOD_TYPE_SYNC)));
    // Since native methods are invoked from a message queue executed on a single thread, it is
    // safe to allocate only one arguments object per method that can be reused across calls
    mArguments = new Object[mParameterTypes.length];
    mJSArgumentsNeeded = calculateJSArgumentsNeeded();
    com.facebook.systrace.Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  public Method getMethod() {
    return mMethod;
  }

  public String getSignature() {
    if (!mArgumentsProcessed) {
      processArguments();
    }
    return assertNotNull(mSignature);
  }

  private String buildSignature(Method method, Class[] paramTypes, boolean isSync) {
    StringBuilder builder = new StringBuilder(paramTypes.length + 2);

    if (isSync) {
      builder.append(returnTypeToChar(method.getReturnType()));
      builder.append('.');
    } else {
      builder.append("v.");
    }

    for (int i = 0; i < paramTypes.length; i++) {
      Class paramClass = paramTypes[i];
      if (paramClass == ExecutorToken.class) {
        if (!mModuleWrapper.supportsWebWorkers()) {
          throw new RuntimeException(
            "Module " + mModuleWrapper.getName() + " doesn't support web workers, but " +
              mMethod.getName() +
              " takes an ExecutorToken.");
        }
      } else if (paramClass == Promise.class) {
        Assertions.assertCondition(
          i == paramTypes.length - 1, "Promise must be used as last parameter only");
      }
      builder.append(paramTypeToChar(paramClass));
    }

    // Modules that support web workers are expected to take an ExecutorToken as the first
    // parameter to all their @ReactMethod-annotated methods.
    if (mModuleWrapper.supportsWebWorkers()) {
      if (builder.charAt(2) != 'T') {
        throw new RuntimeException(
          "Module " + mModuleWrapper.getName() + " supports web workers, but " + mMethod.getName() +
            "does not take an ExecutorToken as its first parameter.");
      }
    }

    return builder.toString();
  }

  private ArgumentExtractor[] buildArgumentExtractors(Class[] paramTypes) {
    // Modules that support web workers are expected to take an ExecutorToken as the first
    // parameter to all their @ReactMethod-annotated methods. We compensate for that here.
    int executorTokenOffset = 0;
    if (mModuleWrapper.supportsWebWorkers()) {
      if (paramTypes[0] != ExecutorToken.class) {
        throw new RuntimeException(
          "Module " + mModuleWrapper.getName() + " supports web workers, but " + mMethod.getName() +
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
      } else if (argumentClass == ReadableMap.class) {
        argumentExtractors[i] = ARGUMENT_EXTRACTOR_MAP;
      } else if (argumentClass == ReadableArray.class) {
        argumentExtractors[i] = ARGUMENT_EXTRACTOR_ARRAY;
      } else if (argumentClass == Dynamic.class) {
        argumentExtractors[i] = ARGUMENT_EXTRACTOR_DYNAMIC;
      } else {
        throw new RuntimeException(
          "Got unknown argument class: " + argumentClass.getSimpleName());
      }
    }
    return argumentExtractors;
  }

  private int calculateJSArgumentsNeeded() {
    int n = 0;
    for (ArgumentExtractor extractor : assertNotNull(mArgumentExtractors)) {
      n += extractor.getJSArgumentsNeeded();
    }
    return n;
  }

  private String getAffectedRange(int startIndex, int jsArgumentsNeeded) {
    return jsArgumentsNeeded > 1 ?
      "" + startIndex + "-" + (startIndex + jsArgumentsNeeded - 1) : "" + startIndex;
  }

  @Override
  public void invoke(JSInstance jsInstance, ExecutorToken executorToken, ReadableNativeArray parameters) {
    String traceName = mModuleWrapper.getName() + "." + mMethod.getName();
    SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "callJavaModuleMethod")
      .arg("method", traceName)
      .flush();
    try {
      if (!mArgumentsProcessed) {
        processArguments();
      }
      if (mArguments == null || mArgumentExtractors == null) {
        throw new Error("processArguments failed");
      }
      if (mJSArgumentsNeeded != parameters.size()) {
        throw new NativeArgumentsParseException(
          traceName + " got " + parameters.size() + " arguments, expected " + mJSArgumentsNeeded);
      }

      // Modules that support web workers are expected to take an ExecutorToken as the first
      // parameter to all their @ReactMethod-annotated methods. We compensate for that here.
      int i = 0, jsArgumentsConsumed = 0;
      int executorTokenOffset = 0;
      if (mModuleWrapper.supportsWebWorkers()) {
        mArguments[0] = executorToken;
        executorTokenOffset = 1;
      }
      try {
        for (; i < mArgumentExtractors.length; i++) {
          mArguments[i + executorTokenOffset] = mArgumentExtractors[i].extractArgument(
            jsInstance, executorToken, parameters, jsArgumentsConsumed);
          jsArgumentsConsumed += mArgumentExtractors[i].getJSArgumentsNeeded();
        }
      } catch (UnexpectedNativeTypeException e) {
        throw new NativeArgumentsParseException(
          e.getMessage() + " (constructing arguments for " + traceName + " at argument index " +
            getAffectedRange(jsArgumentsConsumed, mArgumentExtractors[i].getJSArgumentsNeeded()) +
            ")",
          e);
      }

      try {
        mMethod.invoke(mModuleWrapper.getModule(), mArguments);
      } catch (IllegalArgumentException ie) {
        throw new RuntimeException("Could not invoke " + traceName, ie);
      } catch (IllegalAccessException iae) {
        throw new RuntimeException("Could not invoke " + traceName, iae);
      } catch (InvocationTargetException ite) {
        // Exceptions thrown from native module calls end up wrapped in InvocationTargetException
        // which just make traces harder to read and bump out useful information
        if (ite.getCause() instanceof RuntimeException) {
          throw (RuntimeException) ite.getCause();
        }
        throw new RuntimeException("Could not invoke " + traceName, ite);
      }
    } finally {
      com.facebook.systrace.Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  /**
   * Determines how the method is exported in JavaScript:
   * METHOD_TYPE_ASYNC for regular methods
   * METHOD_TYPE_PROMISE for methods that return a promise object to the caller.
   * METHOD_TYPE_SYNC for sync methods
   */
  @Override
  public String getType() {
    return mType;
  }
}
