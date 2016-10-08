/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.systrace;

/**
 * Systrace stub.
 */
public final class SystraceMessage {

  private static final Builder NOOP_BUILDER = new NoopBuilder();

  public static Builder beginSection(long tag, String sectionName) {
    return NOOP_BUILDER;
  }

  public static Builder endSection(long tag) {
    return NOOP_BUILDER;
  }

  public static abstract class Builder {

    public abstract void flush();

    public abstract Builder arg(String key, Object value);

    public abstract Builder arg(String key, int value);

    public abstract Builder arg(String key, long value);

    public abstract Builder arg(String key, double value);
  }

  private interface Flusher {
    void flush(StringBuilder builder);
  }

  private static class NoopBuilder extends Builder {
    @Override
    public void flush() {
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
