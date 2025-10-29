/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue

/** Spec for creating a MessageQueueThread. */
public class MessageQueueThreadSpec
private constructor(
    public val threadType: ThreadType,
    public val name: String,
    public val stackSize: Long = DEFAULT_STACK_SIZE_BYTES,
) {
  public enum class ThreadType {
    MAIN_UI,
    NEW_BACKGROUND,
  }

  public companion object {
    private val MAIN_UI_SPEC = MessageQueueThreadSpec(ThreadType.MAIN_UI, "main_ui")

    // The Thread constructor interprets zero the same as not specifying a stack size
    public const val DEFAULT_STACK_SIZE_BYTES: Long = 0

    @JvmStatic
    @Deprecated("Use newBackgroundThreadSpec")
    public fun newUIBackgroundTreadSpec(name: String): MessageQueueThreadSpec =
        MessageQueueThreadSpec(ThreadType.NEW_BACKGROUND, name)

    @JvmStatic
    public fun newBackgroundThreadSpec(name: String): MessageQueueThreadSpec =
        MessageQueueThreadSpec(ThreadType.NEW_BACKGROUND, name)

    @JvmStatic
    public fun newBackgroundThreadSpec(name: String, stackSize: Long): MessageQueueThreadSpec =
        MessageQueueThreadSpec(ThreadType.NEW_BACKGROUND, name, stackSize)

    @JvmStatic public fun mainThreadSpec(): MessageQueueThreadSpec = MAIN_UI_SPEC
  }
}
