/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;

/**
 * Spec for creating a ReactQueueConfiguration. This exists so that CatalystInstance is able to set
 * Exception handlers on the MessageQueueThreads it uses and it would not be super clean if the
 * threads were configured, then passed to CatalystInstance where they are configured more. These
 * specs allows the Threads to be created fully configured.
 */
public class ReactQueueConfigurationSpec {

  private final MessageQueueThreadSpec mNativeModulesQueueThreadSpec;
  private final MessageQueueThreadSpec mJSQueueThreadSpec;

  public ReactQueueConfigurationSpec(
      MessageQueueThreadSpec nativeModulesQueueThreadSpec,
      MessageQueueThreadSpec jsQueueThreadSpec) {
    mNativeModulesQueueThreadSpec = nativeModulesQueueThreadSpec;
    mJSQueueThreadSpec = jsQueueThreadSpec;
  }

  public MessageQueueThreadSpec getNativeModulesQueueThreadSpec() {
    return mNativeModulesQueueThreadSpec;
  }

  public MessageQueueThreadSpec getJSQueueThreadSpec() {
    return mJSQueueThreadSpec;
  }

  public static Builder builder() {
    return new Builder();
  }

  public static ReactQueueConfigurationSpec createDefault() {
    return new ReactQueueConfigurationSpec(
        MessageQueueThreadSpec.newBackgroundThreadSpec("native_modules"),
        MessageQueueThreadSpec.newBackgroundThreadSpec("js"));
  }

  public static class Builder {

    private @Nullable MessageQueueThreadSpec mNativeModulesQueueSpec;
    private @Nullable MessageQueueThreadSpec mJSQueueSpec;

    public Builder setNativeModulesQueueThreadSpec(MessageQueueThreadSpec spec) {
      Assertions.assertCondition(
          mNativeModulesQueueSpec == null, "Setting native modules queue spec multiple times!");
      mNativeModulesQueueSpec = spec;
      return this;
    }

    public Builder setJSQueueThreadSpec(MessageQueueThreadSpec spec) {
      Assertions.assertCondition(mJSQueueSpec == null, "Setting JS queue multiple times!");
      mJSQueueSpec = spec;
      return this;
    }

    public ReactQueueConfigurationSpec build() {
      return new ReactQueueConfigurationSpec(
          Assertions.assertNotNull(mNativeModulesQueueSpec),
          Assertions.assertNotNull(mJSQueueSpec));
    }
  }
}
