/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.react.common.build.ReactBuildConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.core.classloader.annotations.SuppressStaticInitializationFor;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.powermock.reflect.Whitebox;
import org.robolectric.RobolectricTestRunner;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
@SuppressStaticInitializationFor("com.facebook.react.common.build.ReactBuildConfig")
@PrepareForTest({ReactBuildConfig.class})
@RunWith(RobolectricTestRunner.class)
public class ModuleSpecTest {
  @Rule
  public PowerMockRule rule = new PowerMockRule();

  @Test(expected = IllegalArgumentException.class)
  public void testSimpleFailFast() {
    Whitebox.setInternalState(ReactBuildConfig.class, "DEBUG", true);
    ModuleSpec.simple(ComplexModule.class, mock(ReactApplicationContext.class));
  }

  @Test(expected = IllegalArgumentException.class)
  public void testSimpleFailFastDefault() {
    Whitebox.setInternalState(ReactBuildConfig.class, "DEBUG", true);
    ModuleSpec.simple(ComplexModule.class);
  }

  @Test
  public void testSimpleNoFailFastRelease() {
    Whitebox.setInternalState(ReactBuildConfig.class, "DEBUG", false);
    ModuleSpec.simple(ComplexModule.class, mock(ReactApplicationContext.class));
  }

  @Test(expected = RuntimeException.class)
  public void testSimpleFailLateRelease() {
    Whitebox.setInternalState(ReactBuildConfig.class, "DEBUG", false);
    ModuleSpec spec = ModuleSpec.simple(ComplexModule.class, mock(ReactApplicationContext.class));
    spec.getProvider().get();
  }

  @Test
  public void testSimpleDefaultConstructor() {
    Whitebox.setInternalState(ReactBuildConfig.class, "DEBUG", true);
    ModuleSpec spec = ModuleSpec.simple(SimpleModule.class);
    assertThat(spec.getProvider().get()).isInstanceOf(SimpleModule.class);
  }

  @Test
  public void testSimpleContextConstructor() {
    Whitebox.setInternalState(ReactBuildConfig.class, "DEBUG", true);
    ReactApplicationContext context = mock(ReactApplicationContext.class);
    ModuleSpec spec = ModuleSpec.simple(SimpleContextModule.class, context);

    NativeModule module = spec.getProvider().get();
    assertThat(module).isInstanceOf(SimpleContextModule.class);
    SimpleContextModule contextModule = (SimpleContextModule) module;
    assertThat(contextModule.getReactApplicationContext()).isSameAs(context);
  }

  public static class ComplexModule extends BaseJavaModule {

    public ComplexModule(int a, int b) {
    }

    public String getName() {
      return "ComplexModule";
    }
  }

  public static class SimpleModule extends BaseJavaModule {

    public String getName() {
      return "SimpleModule";
    }
  }

  public static class SimpleContextModule extends ReactContextBaseJavaModule {

    public SimpleContextModule(ReactApplicationContext context) {
      super(context);
    }

    public String getName() {
      return "SimpleContextModule";
    }
  }
}
