package com.facebook.react.bridge.collections

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowReadableNativeArray
import com.facebook.testutils.shadows.ShadowReadableNativeMap
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowWritableNativeArray
import com.facebook.testutils.shadows.ShadowWritableNativeMap
import org.junit.Assert.assertEquals
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
class ReadableArrayBuilderTest {

  @Test
  fun `buildReadableArray creates array entries correctly`() {
    val array: ReadableArray = buildReadableArray {
      add("one")
      add(2)
      add(true)
      addNull()
      addMap {
        put("nestedKey", "nestedValue")
      }
    }

    assertEquals(5, array.size())
    assertEquals(ReadableType.String, array.getType(0))
    assertEquals("one", array.getString(0))

    assertEquals(ReadableType.Number, array.getType(1))
    assertEquals(2, array.getInt(1))

    assertEquals(ReadableType.Boolean, array.getType(2))
    assertTrue(array.getBoolean(2))

    assertTrue(array.isNull(3))

    // Nested Map inside Array
    val nestedMap = array.getMap(4)
    assertNotNull(nestedMap)
    assertEquals("nestedValue", nestedMap!!.getString("nestedKey"))
  }

  @Test
  fun `buildReadableArray supports nested arrays`() {
    val array: ReadableArray = buildReadableArray {
      addArray {
        add(1)
        add(2)
      }
    }

    assertEquals(1, array.size())
    val inner = array.getArray(0)
    assertNotNull(inner)
    inner!!.let {
      assertEquals(2, it.size())
      assertEquals(1, it.getInt(0))
      assertEquals(2, it.getInt(1))
    }
  }
}
