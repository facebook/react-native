/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import static org.mockito.Mockito.when;

import android.content.Context;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import com.facebook.soloader.SoLoader;
import java.util.List;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.Implementation;
import org.robolectric.annotation.Implements;

@Implements(SoLoader.class)
class ShadowSoLoader {
  @Implementation
  public static void init(Context context, int flags) {}

  @Implementation
  public static boolean loadLibrary(String shortName) {
    return true;
  }
}

/** Tests for {@link BaseJavaModule} and {@link JavaModuleWrapper} */
@Config(
    shadows = {
      ShadowSoLoader.class,
    })
@RunWith(RobolectricTestRunner.class)
public class BaseJavaModuleTest {
  private List<JavaModuleWrapper.MethodDescriptor> mMethods;
  private JavaModuleWrapper mModuleWrapper;

  private List<JavaModuleWrapper.MethodDescriptor> mGeneratedMethods;
  private JavaModuleWrapper mGeneratedModuleWrapper;

  private ReadableNativeArray mArguments;

  @Before
  public void setup() {
    ModuleHolder moduleHolder = new ModuleHolder(new MethodsModule());
    mModuleWrapper = new JavaModuleWrapper(null, moduleHolder);
    mMethods = mModuleWrapper.getMethodDescriptors();

    ModuleHolder generatedModuleHolder = new ModuleHolder(new GeneratedMethodsModule());
    mGeneratedModuleWrapper = new JavaModuleWrapper(null, generatedModuleHolder);
    mGeneratedMethods = mGeneratedModuleWrapper.getMethodDescriptors();

    mArguments = Mockito.mock(ReadableNativeArray.class);
  }

  private int findMethod(String mname, List<JavaModuleWrapper.MethodDescriptor> methods) {
    int posn = -1;
    for (int i = 0; i < methods.size(); i++) {
      JavaModuleWrapper.MethodDescriptor md = methods.get(i);
      if (md.name == mname) {
        posn = i;
        break;
      }
    }
    return posn;
  }

  @Test(expected = NativeArgumentsParseException.class)
  public void testCallMethodWithoutEnoughArgs() throws Exception {
    int methodId = findMethod("regularMethod", mMethods);
    when(mArguments.size()).thenReturn(1);
    mModuleWrapper.invoke(methodId, mArguments);
  }

  @Test
  public void testCallMethodWithEnoughArgs() {
    int methodId = findMethod("regularMethod", mMethods);
    when(mArguments.size()).thenReturn(2);
    mModuleWrapper.invoke(methodId, mArguments);
  }

  @Test
  public void testCallAsyncMethodWithEnoughArgs() {
    // Promise block evaluates to 2 args needing to be passed from JS
    int methodId = findMethod("asyncMethod", mMethods);
    when(mArguments.size()).thenReturn(3);
    mModuleWrapper.invoke(methodId, mArguments);
  }

  @Test
  public void testCallSyncMethod() {
    int methodId = findMethod("syncMethod", mMethods);
    when(mArguments.size()).thenReturn(2);
    mModuleWrapper.invoke(methodId, mArguments);
  }

  @Test
  public void testCallGeneratedMethod() {
    int methodId = findMethod("generatedMethod", mGeneratedMethods);
    when(mArguments.size()).thenReturn(2);
    mGeneratedModuleWrapper.invoke(methodId, mArguments);
  }

  private static class MethodsModule extends BaseJavaModule {
    @Override
    public String getName() {
      return "Methods";
    }

    @ReactMethod
    public void regularMethod(String a, int b) {}

    @ReactMethod
    public void asyncMethod(int a, Promise p) {}

    @ReactMethod(isBlockingSynchronousMethod = true)
    public int syncMethod(int a, int b) {
      return a + b;
    }
  }

  private abstract class NativeTestGeneratedModuleSpec extends BaseJavaModule
      implements TurboModule {
    @ReactMethod
    public abstract void generatedMethod(String a, int b);
  }

  private class GeneratedMethodsModule extends NativeTestGeneratedModuleSpec {
    @Override
    public String getName() {
      return "GeneratedMethods";
    }

    @Override
    public void generatedMethod(String a, int b) {}
  }
}
