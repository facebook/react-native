package com.facebook.react.views.image;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.NinePatch;
import android.graphics.drawable.NinePatchDrawable;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public class NinePatchDrawableFactory {

    // The 9 patch segment is not a solid color.
    private static final int NO_COLOR = 0x00000001;

    public static NinePatchDrawable createNinePatchWithCapInsets(
            Resources res, Bitmap bitmap, int top, int left, int bottom, int right) {
        ByteBuffer buffer = getByteBufferFixed(top, left, bottom, right);
        NinePatch patch = new NinePatch(bitmap, buffer.array(), null);
        return new NinePatchDrawable(res, patch);
    }

    public static ByteBuffer getByteBufferFixed(int top, int left, int bottom, int right) {
        ByteBuffer buffer = ByteBuffer.allocate(84).order(ByteOrder.nativeOrder());
        // was translated
        buffer.put((byte) 0x01);
        // divx size
        buffer.put((byte) 0x02);
        // divy size
        buffer.put((byte) 0x02);
        // color size
        buffer.put((byte) 0x09);

        // skip
        buffer.putInt(0);
        buffer.putInt(0);

        // padding
        buffer.putInt(0);
        buffer.putInt(0);
        buffer.putInt(0);
        buffer.putInt(0);

        // skip 4 bytes
        buffer.putInt(0);

        buffer.putInt(left);
        buffer.putInt(right);
        buffer.putInt(top);
        buffer.putInt(bottom);
        buffer.putInt(NO_COLOR);
        buffer.putInt(NO_COLOR);
        buffer.putInt(NO_COLOR);
        buffer.putInt(NO_COLOR);
        buffer.putInt(NO_COLOR);
        buffer.putInt(NO_COLOR);
        buffer.putInt(NO_COLOR);
        buffer.putInt(NO_COLOR);
        buffer.putInt(NO_COLOR);
        return buffer;
    }
}
