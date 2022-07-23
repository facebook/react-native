/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.systrace;

import java.util.ArrayList;
import java.util.List;

public final class SystraceMessage {

  public static Boolean INCLUDE_ARGS = false;

  public static Builder beginSection(long tag, String sectionName) {
    return new StartSectionBuilder(tag, sectionName);
  }

  public static Builder endSection(long tag) {
    return new EndSectionBuilder(tag);
  }

  public abstract static class Builder {

    public abstract void flush();

    public abstract Builder arg(String key, Object value);

    public abstract Builder arg(String key, int value);

    public abstract Builder arg(String key, long value);

    public abstract Builder arg(String key, double value);
  }

  private static class StartSectionBuilder extends Builder {
    private String mSectionName;
    private long mTag;
    private List<String> mArgs;

    public StartSectionBuilder(long tag, String sectionName) {
      mTag = tag;
      mSectionName = sectionName;
      mArgs = new ArrayList<>();
    }

    @Override
    public void flush() {
      Systrace.beginSection(
              mTag,
              mSectionName + (INCLUDE_ARGS && mArgs.size() > 0 ? (" (" + String.join(", ", mArgs) + ")") : ""));
    }

    @Override
    public Builder arg(String key, Object value) {
      mArgs.add(key + ": " + value.toString());
      return this;
    }

    @Override
    public Builder arg(String key, int value) {
      mArgs.add(key + ": " + value);
      return this;
    }

    @Override
    public Builder arg(String key, long value) {
      mArgs.add(key + ": " + value);
      return this;
    }

    @Override
    public Builder arg(String key, double value) {
      mArgs.add(key + ": " + value);
      return this;
    }
  }

  private static class EndSectionBuilder extends Builder {
    private long mTag;

    public EndSectionBuilder(long tag) {
      mTag = tag;
    }

    @Override
    public void flush() {
      Systrace.endSection(mTag);
    }

    @Override
    public Builder arg(String key, Object value) {
      return this;
    }

    @Override
    public Builder arg(String key, int value) {
      return this;
    }

    @Override
    public Builder arg(String key, long value) {
      return this;
    }

    @Override
    public Builder arg(String key, double value) {
      return this;
    }
  }
}
