package com.facebook.react.bridge.collections

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowReadableNativeArray
import com.facebook.testutils.shadows.ShadowReadableNativeMap
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowWritableNativeArray
import com.facebook.testutils.shadows.ShadowWritableNativeMap
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(
  shadows = [
    ShadowSoLoader::class,
    ShadowNativeLoader::class,
    ShadowWritableNativeMap::class,
    ShadowWritableNativeArray::class,
    ShadowReadableNativeMap::class,
    ShadowReadableNativeArray::class,
  ]
)
class ReadableMapBuilderTest {

  @Test
  fun `buildReadableMap creates simple entries correctly`() {
    val map: ReadableMap = buildReadableMap {
      put("stringKey", "stringValue")
      put("intKey", 42)
      put("boolKey", false)
      putNull("nullKey")
    }

    assertEquals(4, map.toHashMap().size)

    assertTrue(map.hasKey("stringKey"))
    assertEquals(ReadableType.String, map.getType("stringKey"))
    assertEquals("stringValue", map.getString("stringKey"))

    assertTrue(map.hasKey("intKey"))
    assertEquals(ReadableType.Number, map.getType("intKey"))
    assertEquals(42, map.getInt("intKey"))

    assertTrue(map.hasKey("boolKey"))
    assertEquals(ReadableType.Boolean, map.getType("boolKey"))
    assertFalse(map.getBoolean("boolKey"))

    assertTrue(map.hasKey("nullKey"))
    assertTrue(map.isNull("nullKey"))
  }

  @Test
  fun `buildReadableMap supports nested maps and arrays`() {
    val map: ReadableMap = buildReadableMap {
      putMap("nestedMap") {
        put("innerString", "innerValue")
        put("innerNumber", 123L)
      }
      putArray("nestedArray") {
        add(10)
        add(20)
        add(30)
      }
    }

    // Nested Map
    val nestedMap = map.getMap("nestedMap")
    assertNotNull(nestedMap)
    nestedMap!!.let {
      assertEquals(2, it.toHashMap().size)
      assertEquals("innerValue", it.getString("innerString"))
      assertEquals(123, it.getInt("innerNumber"))
    }

    // Nested Array inside Map
    val nestedArray = map.getArray("nestedArray")
    assertNotNull(nestedArray)
    nestedArray!!.let {
      assertEquals(3, it.size())
      assertEquals(10, it.getInt(0))
      assertEquals(20, it.getInt(1))
      assertEquals(30, it.getInt(2))
    }
  }
}
