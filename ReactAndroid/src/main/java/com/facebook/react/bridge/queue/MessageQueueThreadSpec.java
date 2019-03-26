/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue;

/**
 * Spec for creating a MessageQueueThread.
 */
public class MessageQueueThreadSpec {

  private static final MessageQueueThreadSpec MAIN_UI_SPEC =
      new MessageQueueThreadSpec(ThreadType.MAIN_UI, "main_ui");

  // The Thread constructor interprets zero the same as not specifying a stack size
  public static final long DEFAULT_STACK_SIZE_BYTES = 0;

  protected static enum ThreadType {
    MAIN_UI,
    NEW_BACKGROUND,
  }

  public static MessageQueueThreadSpec newUIBackgroundTreadSpec(String name) {
    return new MessageQueueThreadSpec(ThreadType.NEW_BACKGROUND, name);
  }

  public static MessageQueueThreadSpec newBackgroundThreadSpec(String name) {
    return new MessageQueueThreadSpec(ThreadType.NEW_BACKGROUND, name);
  }

  public static MessageQueueThreadSpec newBackgroundThreadSpec(String name, long stackSize) {
    return new MessageQueueThreadSpec(ThreadType.NEW_BACKGROUND, name, stackSize);
  }

  public static MessageQueueThreadSpec mainThreadSpec() {
    return MAIN_UI_SPEC;
  }

  private final ThreadType mThreadType;
  private final String mName;
  private final long mStackSize;

  private MessageQueueThreadSpec(ThreadType threadType, String name) {
    this(threadType, name, DEFAULT_STACK_SIZE_BYTES);
  }

  private MessageQueueThreadSpec(ThreadType threadType, String name, long stackSize) {
    mThreadType = threadType;
    mName = name;
    mStackSize = stackSize;
  }

  public ThreadType getThreadType() {
    return mThreadType;
  }

  public String getName() {
    return mName;
  }

  public long getStackSize() {
    return mStackSize;
  }
}
