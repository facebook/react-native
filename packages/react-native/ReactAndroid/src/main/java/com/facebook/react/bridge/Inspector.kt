/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 package com.facebook.react.bridge

 import com.facebook.common.logging.FLog
 import com.facebook.infer.annotation.Nullsafe
 import com.facebook.jni.HybridData
 import com.facebook.proguard.annotations.DoNotStrip
 import com.facebook.react.common.ReactConstants
 
 @Nullsafe(Nullsafe.Mode.LOCAL)
 @DoNotStrip
 public class Inspector private constructor(private val mHybridData: HybridData) {
 
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
                 val local = instance().connectNative(pageId, remote)
                 local ?: throw IllegalStateException("Can't open failed connection")
             } catch (e: UnsatisfiedLinkError) {
                 FLog.e(ReactConstants.TAG, "Inspector doesn't work in open source yet", e)
                 throw RuntimeException(e)
             }
         }
 
         private external fun instance(): Inspector
     }
 
     private external fun getPagesNative(): Array<Page>
 
     private external fun connectNative(pageId: Int, remote: RemoteConnection): LocalConnection
 
     @DoNotStrip
     public class Page private constructor(
         private val mId: Int,
         private val mTitle: String,
         private val mVM: String
     ) {
         public fun getId(): Int = mId
         public fun getTitle(): String = mTitle
         public fun getVM(): String = mVM
 
         override fun toString(): String {
             return "Page{mId=$mId, mTitle='$mTitle'}"
         }
     }
 
     @DoNotStrip
     public interface RemoteConnection {
         @DoNotStrip
         public fun onMessage(message: String)
 
         @DoNotStrip
         public fun onDisconnect()
     }
 
     @DoNotStrip
     public class LocalConnection private constructor(
         private val mHybridData: HybridData
     ) {
         public external fun sendMessage(message: String)
         public external fun disconnect()
     }
 }
