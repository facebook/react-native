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
  private final BaseJavaModule mModule;
  private final ArrayList<BaseJavaModule.JavaMethod> mMethods;

  public JavaModuleWrapper(CatalystInstance catalystinstance, BaseJavaModule module) {
    mCatalystInstance = catalystinstance;
    mModule = module;
    mMethods = new ArrayList<BaseJavaModule.JavaMethod>();
  }

  @DoNotStrip
  public BaseJavaModule getModule() {
    return mModule;
  }

  @DoNotStrip
  public String getName() {
    return mModule.getName();
  }

  @DoNotStrip
  public List<MethodDescriptor> getMethodDescriptors() {
    ArrayList<MethodDescriptor> descs = new ArrayList<>();

    for (Map.Entry<String, BaseJavaModule.NativeMethod> entry :
           mModule.getMethods().entrySet()) {
      MethodDescriptor md = new MethodDescriptor();
      md.name = entry.getKey();
      md.type = entry.getValue().getType();

      BaseJavaModule.JavaMethod method = (BaseJavaModule.JavaMethod) entry.getValue();
      mMethods.add(method);

      descs.add(md);
    }

    return descs;
  }

  @DoNotStrip
  public List<MethodDescriptor> newGetMethodDescriptors() {
    ArrayList<MethodDescriptor> descs = new ArrayList<>();

    for (Map.Entry<String, BaseJavaModule.NativeMethod> entry :
           mModule.getMethods().entrySet()) {
      MethodDescriptor md = new MethodDescriptor();
      md.name = entry.getKey();
      md.type = entry.getValue().getType();

      BaseJavaModule.JavaMethod method = (BaseJavaModule.JavaMethod) entry.getValue();
      md.method = method.getMethod();
      md.signature = method.getSignature();

      descs.add(md);
    }

    for (Map.Entry<String, BaseJavaModule.SyncNativeHook> entry :
        mModule.getSyncHooks().entrySet()) {
      MethodDescriptor md = new MethodDescriptor();
      md.name = entry.getKey();
      md.type = BaseJavaModule.METHOD_TYPE_SYNC;

      BaseJavaModule.SyncJavaHook method = (BaseJavaModule.SyncJavaHook) entry.getValue();
      md.method = method.getMethod();
      md.signature = method.getSignature();

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
    Map<String, Object> map = mModule.getConstants();
    Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);

    SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "WritableNativeMap constants")
      .arg("moduleName", getName())
      .flush();
    WritableNativeMap writableNativeMap;
    try {
      writableNativeMap = Arguments.makeNativeMap(map);
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
    WritableNativeArray array = new WritableNativeArray();
    array.pushMap(writableNativeMap);
    return array;
  }

  @DoNotStrip
  public boolean supportsWebWorkers() {
    return mModule.supportsWebWorkers();
  }

  @DoNotStrip
  public void invoke(ExecutorToken token, int methodId, ReadableNativeArray parameters) {
    if (mMethods == null || methodId >= mMethods.size()) {
      return;
    }

    mMethods.get(methodId).invoke(mCatalystInstance, token, parameters);
  }
}
