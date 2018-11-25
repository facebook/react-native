package com.facebook.react.tests.core;

import static org.fest.assertions.api.Assertions.assertThat;

import android.support.test.runner.AndroidJUnit4;
import com.facebook.react.bridge.UnexpectedNativeTypeException;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class WritableNativeMapTest {

  private WritableNativeMap mMap;

  @Before
  public void setup() {
    mMap = new WritableNativeMap();
    mMap.putBoolean("boolean", true);
    mMap.putDouble("double", 1.2);
    mMap.putInt("int", 1);
    mMap.putString("string", "abc");
    mMap.putMap("map", new WritableNativeMap());
    mMap.putArray("array", new WritableNativeArray());
    mMap.putBoolean("dvacca", true);
    mMap.setUseNativeAccessor(true);
  }

  @Test
  public void testBoolean() {
    assertThat(mMap.getBoolean("boolean")).isEqualTo(true);
  }

  @Test(expected = UnexpectedNativeTypeException.class)
  public void testBooleanInvalidType() {
    mMap.getBoolean("string");
  }

  @Test
  public void testDouble() {
    assertThat(mMap.getDouble("double")).isEqualTo(1.2);
  }

  @Test(expected = UnexpectedNativeTypeException.class)
  public void testDoubleInvalidType() {
    mMap.getDouble("string");
  }

  @Test
  public void testInt() {
    assertThat(mMap.getInt("int")).isEqualTo(1);
  }

  @Test(expected = UnexpectedNativeTypeException.class)
  public void testIntInvalidType() {
    mMap.getInt("string");
  }

  @Test
  public void testString() {
    assertThat(mMap.getString("string")).isEqualTo("abc");
  }

  @Test(expected = UnexpectedNativeTypeException.class)
  public void testStringInvalidType() {
    mMap.getString("int");
  }

  @Test
  public void testMap() {
    assertThat(mMap.getMap("map")).isNotNull();
  }

  @Test(expected = UnexpectedNativeTypeException.class)
  public void testMapInvalidType() {
    mMap.getMap("string");
  }

  @Test
  public void testArray() {
    assertThat(mMap.getArray("array")).isNotNull();
  }

  @Test(expected = UnexpectedNativeTypeException.class)
  public void testArrayInvalidType() {
    mMap.getArray("string");
  }

  @Ignore("Needs to be implemented")
  @Test
  public void testErrorMessageContainsKey() {
    String key = "fkg";
    try {
      mMap.getString(key);
      Assert.fail("Expected an UnexpectedNativeTypeException to be thrown");
    } catch (UnexpectedNativeTypeException e) {
      assertThat(e.getMessage()).contains(key);
    }
  }
}
