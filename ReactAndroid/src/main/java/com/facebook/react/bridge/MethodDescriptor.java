package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;

import java.lang.reflect.Method;

/**
 * Created by ransj on 2017/8/14.
 */

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
