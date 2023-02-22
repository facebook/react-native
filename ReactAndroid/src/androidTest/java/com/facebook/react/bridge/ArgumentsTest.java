/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import static com.facebook.react.bridge.Arguments.fromBundle;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import androidx.annotation.NonNull;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.runner.AndroidJUnit4;
import com.facebook.soloader.SoLoader;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class ArgumentsTest {

  @Before
  public void setUp() {
    Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
    SoLoader.init(context, false);
  }

  @Test
  public void testFromBundle() {
    verifyBundle(createBundle());
  }

  /**
   * When passing a bundle via {@link Intent} extras, it gets parceled and unparceled. Any array of
   * bundles will return as an array of {@link Parcelable} instead. This test verifies that {@link
   * Arguments#fromArray} handles this situation correctly.
   */
  @Test
  public void testFromMarshaledBundle() {
    verifyBundle(marshalAndUnmarshalBundle(createBundle()));
  }

  private void verifyBundle(@NonNull Bundle bundle) {
    WritableMap map = fromBundle(bundle);
    assertNotNull(map);

    assertEquals(ReadableType.Array, map.getType("children"));
    ReadableArray children = map.getArray("children");
    assertNotNull(children);
    assertEquals(1, children.size());

    assertEquals(ReadableType.Map, children.getType(0));
    ReadableMap child = children.getMap(0);
    assertNotNull(child);
    assertEquals("exampleChild", child.getString("exampleChildKey"));
  }

  @NonNull
  private Bundle marshalAndUnmarshalBundle(@NonNull Bundle bundle) {
    Parcel parcel = null;
    try {
      parcel = Parcel.obtain();
      bundle.writeToParcel(parcel, 0);

      byte[] bytes = parcel.marshall();
      parcel.unmarshall(bytes, 0, bytes.length);
      parcel.setDataPosition(0);
      return Bundle.CREATOR.createFromParcel(parcel);
    } finally {
      if (parcel != null) {
        parcel.recycle();
      }
    }
  }

  @NonNull
  private Bundle createBundle() {
    Bundle bundle = new Bundle();
    Bundle[] children = new Bundle[1];
    children[0] = new Bundle();
    children[0].putString("exampleChildKey", "exampleChild");
    bundle.putSerializable("children", children);
    return bundle;
  }
}
