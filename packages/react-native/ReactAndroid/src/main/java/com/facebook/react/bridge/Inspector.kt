/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.common.logging.FLog
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.ReactConstants

@DoNotStrip
public class Inspector
private constructor(@Suppress("NoHungarianNotation") private val mHybridData: HybridData) {

  private external fun getPagesNative(): Array<Page>

  private external fun connectNative(pageId: Int, remote: RemoteConnection): LocalConnection?

  @DoNotStrip
  public class Page
  private constructor(private val id: Int, private val title: String, private val vm: String) {
    public fun getId(): Int = id

    public fun getTitle(): String = title

    public fun getVM(): String = vm

    override fun toString(): String = "Page{id=$id, title='$title'}"
  }

  @DoNotStrip
  public interface RemoteConnection {
    @DoNotStrip public fun onMessage(message: String)

    @DoNotStrip public fun onDisconnect()
  }

  @DoNotStrip
  public class LocalConnection
  private constructor(@Suppress("NoHungarianNotation") private val mHybridData: HybridData) {
    public external fun sendMessage(message: String)

    public external fun disconnect()
  }

  public companion object {
    init {
      BridgeSoLoader.staticInit()
    }

    @JvmStatic
    public fun getPages(): List<Page> {
      return try {
        instance().getPagesNative().toList()
      } catch (e: UnsatisfiedLinkError) {
        FLog.e(ReactConstants.TAG, "Inspector doesn't work in open source yet", e)
        emptyList()
      }
    }

    @JvmStatic
    public fun connect(pageId: Int, remote: RemoteConnection): LocalConnection {
      return try {
        instance().connectNative(pageId, remote)
            ?: throw IllegalStateException("Can't open failed connection")
      } catch (e: UnsatisfiedLinkError) {
        FLog.e(ReactConstants.TAG, "Inspector doesn't work in open source yet", e)
        throw RuntimeException(e)
      }
    }

    @JvmStatic private external fun instance(): Inspector
  }
}
