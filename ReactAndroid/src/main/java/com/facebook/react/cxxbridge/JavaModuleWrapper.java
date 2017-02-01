/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.cxxbridge;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.ExecutorToken;
import com.facebook.react.bridge.NativeArray;
import com.facebook.react.bridge.NativeModuleLogger;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReadableNativeArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;

import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

/**
 * This is part of the glue which wraps a java BaseJavaModule in a C++
 * NativeModule.  This could all be in C++, but it's android-specific
 * initialization code, and writing it this way is easier to read and means
 * fewer JNI calls.
 */

@DoNotStrip
/* package */ class JavaModuleWrapper {
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

  private final CatalystInstance mCatalystInstance;
  private final ModuleHolder mModuleHolder;
  private final ArrayList<NativeModule.NativeMethod> mMethods;

  public JavaModuleWrapper(CatalystInstance catalystinstance, ModuleHolder moduleHolder) {
    mCatalystInstance = catalystinstance;
    mModuleHolder = moduleHolder;
    mMethods = new ArrayList<>();
  }

  @DoNotStrip
  public BaseJavaModule getModule() {
    return (BaseJavaModule) mModuleHolder.getModule();
  }

  @DoNotStrip
  public String getName() {
    return mModuleHolder.getInfo().name();
  }

  @DoNotStrip
  public List<MethodDescriptor> getMethodDescriptors() {
    ArrayList<MethodDescriptor> descs = new ArrayList<>();
    for (Map.Entry<String, NativeModule.NativeMethod> entry :
          getModule().getMethods().entrySet()) {
      MethodDescriptor md = new MethodDescriptor();
      md.name = entry.getKey();
      md.type = entry.getValue().getType();

      BaseJavaModule.JavaMethod method = (BaseJavaModule.JavaMethod) entry.getValue();
      if (md.type == BaseJavaModule.METHOD_TYPE_SYNC) {
        md.signature = method.getSignature();
        md.method = method.getMethod();
      }
      mMethods.add(method);

      descs.add(md);
    }
    return descs;
  }

  // TODO mhorowitz: make this return NativeMap, which requires moving
  // NativeMap out of OnLoad.
  @DoNotStrip
  public NativeArray getConstants() {
    SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "Map constants")
      .arg("moduleName", getName())
      .flush();
    BaseJavaModule baseJavaModule = getModule();
    Map<String, Object> map = baseJavaModule.getConstants();
    Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);

    SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "WritableNativeMap constants")
      .arg("moduleName", getName())
      .flush();
    if (baseJavaModule instanceof NativeModuleLogger) {
      ((NativeModuleLogger) baseJavaModule).startConstantsMapConversion();
    }
    WritableNativeMap writableNativeMap;
    try {
      writableNativeMap = Arguments.makeNativeMap(map);
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
    WritableNativeArray array = new WritableNativeArray();
    array.pushMap(writableNativeMap);
    if (baseJavaModule instanceof NativeModuleLogger) {
      ((NativeModuleLogger) baseJavaModule).endConstantsMapConversion();
    }
    return array;
  }

  @DoNotStrip
  public boolean supportsWebWorkers() {
    return getModule().supportsWebWorkers();
  }

  @DoNotStrip
  public void invoke(ExecutorToken token, int methodId, ReadableNativeArray parameters) {
    if (mMethods == null || methodId >= mMethods.size()) {
      return;
    }

    mMethods.get(methodId).invoke(mCatalystInstance, token, parameters);
  }
}
