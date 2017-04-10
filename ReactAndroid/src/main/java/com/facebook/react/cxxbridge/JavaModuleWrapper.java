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

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Map;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ExecutorToken;
import com.facebook.react.bridge.JSInstance;
import com.facebook.react.bridge.NativeArray;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableNativeArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;

import static com.facebook.react.bridge.ReactMarkerConstants.CONVERT_CONSTANTS_END;
import static com.facebook.react.bridge.ReactMarkerConstants.CONVERT_CONSTANTS_START;
import static com.facebook.react.bridge.ReactMarkerConstants.GET_CONSTANTS_END;
import static com.facebook.react.bridge.ReactMarkerConstants.GET_CONSTANTS_START;
import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

/**
 * This is part of the glue which wraps a java BaseJavaModule in a C++
 * NativeModule.  This could all be in C++, but it's android-specific
 * initialization code, and writing it this way is easier to read and means
 * fewer JNI calls.
 */

@DoNotStrip
public class JavaModuleWrapper {
  @DoNotStrip
  public class MethodDescriptor {
    @DoNotStrip
    Method method;
    @DoNotStrip
    String signature;
    @DoNotStrip
    String name;
    @DoNotStrip
    String type;
  }

  private final JSInstance mJSInstance;
  private final ModuleHolder mModuleHolder;
  private final Class<? extends NativeModule> mModuleClass;
  private final ArrayList<NativeModule.NativeMethod> mMethods;
  private final ArrayList<MethodDescriptor> mDescs;

  public JavaModuleWrapper(JSInstance jsInstance, Class<? extends NativeModule> moduleClass, ModuleHolder moduleHolder) {
    mJSInstance = jsInstance;
    mModuleHolder = moduleHolder;
    mModuleClass = moduleClass;
    mMethods = new ArrayList<>();
    mDescs = new ArrayList();
  }

  @DoNotStrip
  public BaseJavaModule getModule() {
    return (BaseJavaModule) mModuleHolder.getModule();
  }

  @DoNotStrip
  public String getName() {
    return mModuleHolder.getName();
  }

  @DoNotStrip
  private void findMethods() {
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "findMethods");
    Set<String> methodNames = new HashSet<>();

    Method[] targetMethods = mModuleClass.getDeclaredMethods();
    for (Method targetMethod : targetMethods) {
      ReactMethod annotation = targetMethod.getAnnotation(ReactMethod.class);
      if (annotation != null) {
        String methodName = targetMethod.getName();
        if (methodNames.contains(methodName)) {
          // We do not support method overloading since js sees a function as an object regardless
          // of number of params.
          throw new IllegalArgumentException(
            "Java Module " + getName() + " method name already registered: " + methodName);
        }
        MethodDescriptor md = new MethodDescriptor();
        JavaMethodWrapper method = new JavaMethodWrapper(this, targetMethod, annotation.isBlockingSynchronousMethod());
        md.name = methodName;
        md.type = method.getType();
        if (md.type == BaseJavaModule.METHOD_TYPE_SYNC) {
          md.signature = method.getSignature();
          md.method = targetMethod;
        }
        mMethods.add(method);
        mDescs.add(md);
      }
    }
    Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  @DoNotStrip
  public List<MethodDescriptor> getMethodDescriptors() {
    if (mDescs.isEmpty()) {
      findMethods();
    }
    return mDescs;
  }

  // TODO mhorowitz: make this return NativeMap, which requires moving
  // NativeMap out of OnLoad.
  @DoNotStrip
  public @Nullable NativeArray getConstants() {
    if (!mModuleHolder.getHasConstants()) {
      return null;
    }
    BaseJavaModule baseJavaModule = getModule();
    ReactMarker.logMarker(GET_CONSTANTS_START, getName());
    SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "Map constants")
      .arg("moduleName", getName())
      .flush();
    Map<String, Object> map = baseJavaModule.getConstants();
    Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);

    SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "WritableNativeMap constants")
      .arg("moduleName", getName())
      .flush();
    ReactMarker.logMarker(CONVERT_CONSTANTS_START, getName());
    WritableNativeMap writableNativeMap;
    try {
      writableNativeMap = Arguments.makeNativeMap(map);
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
    WritableNativeArray array = new WritableNativeArray();
    array.pushMap(writableNativeMap);
    ReactMarker.logMarker(CONVERT_CONSTANTS_END);
    ReactMarker.logMarker(GET_CONSTANTS_END);
    return array;
  }

  @DoNotStrip
  public boolean supportsWebWorkers() {
    return mModuleHolder.getSupportsWebWorkers();
  }

  @DoNotStrip
  public void invoke(ExecutorToken token, int methodId, ReadableNativeArray parameters) {
    if (mMethods == null || methodId >= mMethods.size()) {
      return;
    }

    mMethods.get(methodId).invoke(mJSInstance, token, parameters);
  }
}
