/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.react.common.build.ReactBuildConfig;
import java.lang.reflect.Constructor;
import javax.annotation.Nullable;
import javax.inject.Provider;

/**
 * A specification for a native module. This exists so that we don't have to pay the cost
 * for creation until/if the module is used.
 *
 * If your module either has a default constructor or one taking ReactApplicationContext you can use
 * {@link #simple(Class)} or {@link #simple(Class, ReactApplicationContext)}} methods.
 */
public class ModuleSpec {
  private static final Class[] EMPTY_SIGNATURE = {};
  private static final Class[] CONTEXT_SIGNATURE = { ReactApplicationContext.class };

  private final @Nullable Class<? extends NativeModule> mType;
  private final Provider<? extends NativeModule> mProvider;
  private final String mClassName;

  /**
   * Simple spec for modules with a default constructor.
   */
  public static ModuleSpec simple(final Class<? extends NativeModule> type) {
    return new ModuleSpec(type, new ConstructorProvider(type, EMPTY_SIGNATURE) {
      @Override
      public NativeModule get() {
        try {
          return getConstructor(type, EMPTY_SIGNATURE).newInstance();
        } catch (Exception e) {
          throw new RuntimeException("ModuleSpec with class: " + type.getName(), e);
        }
      }
    });
  }

  /**
   * Simple spec for modules with a constructor taking ReactApplicationContext.
   */
  public static ModuleSpec simple(
      final Class<? extends NativeModule> type,
      final ReactApplicationContext context) {
    return new ModuleSpec(type, new ConstructorProvider(type, CONTEXT_SIGNATURE) {
      @Override
      public NativeModule get() {
        try {
          return getConstructor(type, CONTEXT_SIGNATURE).newInstance(context);
        } catch (Exception e) {
          throw new RuntimeException("ModuleSpec with class: " + type.getName(), e);
        }
      }
    });
  }

  public static ModuleSpec viewManagerSpec(Provider<? extends NativeModule> provider) {
    return new ModuleSpec(null, provider);
  }

  public static ModuleSpec nativeModuleSpec(
      Class<? extends NativeModule> type, Provider<? extends NativeModule> provider) {
    return new ModuleSpec(provider, type.getName());
  }

  public static ModuleSpec nativeModuleSpec(
      String className, Provider<? extends NativeModule> provider) {
    return new ModuleSpec(provider, className);
  }

  private ModuleSpec(
      @Nullable Class<? extends NativeModule> type, Provider<? extends NativeModule> provider) {
    mType = type;
    mProvider = provider;
    mClassName = type == null ? null : type.getName();
  }

  public ModuleSpec(Provider<? extends NativeModule> provider, String name) {
    mType = null;
    mProvider = provider;
    mClassName = name;
  }

  public @Nullable Class<? extends NativeModule> getType() {
    return mType;
  }

  public String getClassName(){return mClassName;}

  public Provider<? extends NativeModule> getProvider() {
    return mProvider;
  }

  private static abstract class ConstructorProvider implements Provider<NativeModule> {
    protected @Nullable Constructor<? extends NativeModule> mConstructor;

    public ConstructorProvider(Class<? extends NativeModule> type, Class[] signature) {
      if (ReactBuildConfig.DEBUG) {
        try {
          mConstructor = getConstructor(type, signature);
        } catch (NoSuchMethodException e) {
          throw new IllegalArgumentException("No such constructor", e);
        }
      }
    }

    protected Constructor<? extends NativeModule> getConstructor(
        Class<? extends NativeModule> mType,
        Class[] signature) throws NoSuchMethodException {
      if (mConstructor != null) {
        return mConstructor;
      } else {
        return mType.getConstructor(signature);
      }
    }
  }
}
