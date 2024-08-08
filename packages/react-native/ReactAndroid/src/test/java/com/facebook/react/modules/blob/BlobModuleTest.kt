/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.blob

import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.WritableMap
import java.nio.ByteBuffer
import java.util.UUID
import kotlin.random.Random
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class BlobModuleTest {
  private lateinit var bytes: ByteArray
  private lateinit var blobId: String
  private lateinit var blobModule: BlobModule
  private lateinit var arguments: MockedStatic<Arguments>

  @Before
  fun prepareModules() {
    arguments = mockStatic(Arguments::class.java)
    arguments.`when`<WritableMap> { Arguments.createMap() }.thenAnswer { JavaOnlyMap() }

    bytes = ByteArray(120)
    Random.Default.nextBytes(bytes)

    blobModule = BlobModule(ReactTestHelper.createCatalystContextForTest())
    blobId = blobModule.store(bytes)
  }

  @After
  fun cleanUp() {
    blobModule.remove(blobId)
    arguments.close()
  }

  @Test
  fun testResolve() {
    assertThat(blobModule.resolve(blobId, 0, bytes.size)).isEqualTo(bytes)
    val expectedRange = bytes.copyOfRange(30, bytes.size)
    assertThat(blobModule.resolve(blobId, 30, bytes.size - 30)).isEqualTo(expectedRange)
  }

  @Test
  fun testResolveUri() {
    val uri =
        Uri.Builder()
            .appendPath(blobId)
            .appendQueryParameter("offset", "0")
            .appendQueryParameter("size", bytes.size.toString())
            .build()

    assertThat(blobModule.resolve(uri)).isEqualTo(bytes)
  }

  @Test
  fun testResolveMap() {
    val blob =
        JavaOnlyMap().apply {
          putString("blobId", blobId)
          putInt("offset", 0)
          putInt("size", bytes.size)
        }

    assertThat(blobModule.resolve(blob)).isEqualTo(bytes)
  }

  @Test
  fun testRemove() {
    assertThat(blobModule.resolve(blobId, 0, bytes.size)).isNotNull()

    blobModule.remove(blobId)

    assertThat(blobModule.resolve(blobId, 0, bytes.size)).isNull()
  }

  @Test
  fun testCreateFromParts() {
    val id = UUID.randomUUID().toString()

    val blobData =
        JavaOnlyMap().apply {
          putString("blobId", blobId)
          putInt("offset", 0)
          putInt("size", bytes.size)
        }
    val blob =
        JavaOnlyMap().apply {
          putMap("data", blobData)
          putString("type", "blob")
        }

    val stringData = "i \u2665 dogs"
    val stringBytes = stringData.encodeToByteArray()
    val string =
        JavaOnlyMap().apply {
          putString("data", stringData)
          putString("type", "string")
        }

    val parts =
        JavaOnlyArray().apply {
          pushMap(blob)
          pushMap(string)
        }

    blobModule.createFromParts(parts, id)

    val resultSize = bytes.size + stringBytes.size

    val result = blobModule.resolve(id, 0, resultSize)

    val buffer =
        ByteBuffer.allocate(resultSize).apply {
          put(bytes)
          put(stringBytes)
        }

    assertThat(result).isEqualTo(buffer.array())
  }

  @Test
  fun testRelease() {
    assertThat(blobModule.resolve(blobId, 0, bytes.size)).isNotNull()

    blobModule.release(blobId)

    assertThat(blobModule.resolve(blobId, 0, bytes.size)).isNull()
  }
}
