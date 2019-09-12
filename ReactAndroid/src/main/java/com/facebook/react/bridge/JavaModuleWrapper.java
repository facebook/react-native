/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import static com.facebook.react.bridge.ReactMarkerConstants.CONVERT_CONSTANTS_END;
import static com.facebook.react.bridge.ReactMarkerConstants.CONVERT_CONSTANTS_START;
import static com.facebook.react.bridge.ReactMarkerConstants.GET_CONSTANTS_END;
import static com.facebook.react.bridge.ReactMarkerConstants.GET_CONSTANTS_START;
import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

import androidx.annotation.Nullable;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * This is part of the glue which wraps a java BaseJavaModule in a C++ NativeModule. This could all
 * be in C++, but it's android-specific initialization code, and writing it this way is easier to
 * read and means fewer JNI calls.
 */
@DoNotStrip
public class JavaModuleWrapper {
  @DoNotStrip
  public class MethodDescriptor {
    @DoNotStrip Method method;
    @DoNotStrip String signature;
    @DoNotStrip String name;
    @DoNotStrip String type;
  }

  private final JSInstance mJSInstance;
  private final ModuleHolder mModuleHolder;
  private final ArrayList<NativeModule.NativeMethod> mMethods;
  private final ArrayList<MethodDescriptor> mDescs;

  public JavaModuleWrapper(JSInstance jsInstance, ModuleHolder moduleHolder) {
    mJSInstance = jsInstance;
    mModuleHolder = moduleHolder;
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

    Class<? extends NativeModule> classForMethods = mModuleHolder.getModule().getClass();
    Class<? extends NativeModule> superClass =
        (Class<? extends NativeModule>) classForMethods.getSuperclass();
    if (ReactModuleWithSpec.class.isAssignableFrom(superClass)) {
      // For java module that is based on generated flow-type spec, inspect the
      // spec abstract class instead, which is the super class of the given java
      // module.
      classForMethods = superClass;
    }
    Method[] targetMethods = classForMethods.getDeclaredMethods();

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
        JavaMethodWrapper method =
            new JavaMethodWrapper(this, targetMethod, annotation.isBlockingSynchronousMethod());
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

  @DoNotStrip
  public @Nullable NativeMap getConstants() {
    if (!mModuleHolder.getHasConstants()) {
      return null;
    }

    final String moduleName = getName();
    SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "JavaModuleWrapper.getConstants")
        .arg("moduleName", moduleName)
        .flush();
    ReactMarker.logMarker(GET_CONSTANTS_START, moduleName);

    BaseJavaModule baseJavaModule = getModule();

    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "module.getConstants");
    Map<String, Object> map = baseJavaModule.getConstants();
    Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);

    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "create WritableNativeMap");
    ReactMarker.logMarker(CONVERT_CONSTANTS_START, moduleName);
    try {
      return Arguments.makeNativeMap(map);
    } finally {
      ReactMarker.logMarker(CONVERT_CONSTANTS_END, moduleName);
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);

      ReactMarker.logMarker(GET_CONSTANTS_END, moduleName);
      SystraceMessage.endSection(TRACE_TAG_REACT_JAVA_BRIDGE).flush();
    }
  }

  @DoNotStrip
  public void invoke(int methodId, ReadableNativeArray parameters) {
    if (mMethods == null || methodId >= mMethods.size()) {
      return;
    }

    mMethods.get(methodId).invoke(mJSInstance, parameters);
  }
}
