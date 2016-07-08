/*
 * Copyright (C) 2013 MorihiroSoft
 * Copyright 2006 The Android Open Source Project (Images.cpp)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.facebook.react.views.slider;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.drawable.NinePatchDrawable;
import android.os.Build;

/**
 * Create a NinePatchDrawable object.
 * @author MorihiroSoft
 *
 * @see frameworks/base/graphics/java/android/graphics/drawable/NinePatchDrawable.java
 * @see frameworks/base/graphics/java/android/graphics/Bitmap.java
 * @see frameworks/base/include/androidfw/ResourceTypes.h
 * @see frameworks/base/libs/androidfw/ResourceTypes.cpp
 * @see frameworks/base/tools/aapt/Images.cpp
 *
 * Copyright (C) 2013 MorihiroSoft
 * https://github.com/MorihiroSoft/Android_NinePatchDrawableFactory
 */
public class NinePatchDrawableFactory {
	/**
	 * Convert a bitmap to a NinePatchDrawable object.
	 *
	 * @param res     The resources for getting initial target density.
	 * @param bmp     The bitmap describing the patches.
	 * @param srcName The name of the source for the bitmap. Might be null.
	 * @return The new NinePatchDrawable object.
	 *
	 * @see NinePatchDrawable#NinePatchDrawable(Resources, Bitmap, byte[], Rect, String)
	 */
	public static NinePatchDrawable convertBitmap(Resources res, Bitmap bmp, String srcName) {
		byte[] chunk = bmp.getNinePatchChunk();
		if (chunk != null) {
			return convertCompiledBitmap(res, bmp, chunk, srcName);
		} else {
			return convertNotCompiledBitmap(res, bmp, srcName);
		}
	}

	//---------------------------------------------------------------------
	// PRIVATE...
	//---------------------------------------------------------------------
	// The 9 patch segment is not a solid color.
	private static final int NO_SOLID_COLOR    = 0x00000001;

	// The 9 patch segment is completely transparent.
	private static final int TRANSPARENT_COLOR = 0x00000000;

	// For ByteBuffer allocation.
	private static final int SIZE_OF_INT8   = 1;
	private static final int SIZE_OF_INT32  = 4;
	private static final int SIZE_OF_UINT32 = 4;
	private static final int SIZE_OF_PTR    = 4;

	private static NinePatchDrawable convertCompiledBitmap(Resources res, Bitmap bmp, byte[] chunk, String srcName) {
		// Get padding from chunk
		Rect padding = getPadding(chunk);

		// Get layout-bounds from bitmap
		Rect bounds = getLayoutBounds(bmp);

		// Create drawable
		return newInstance(res, bmp, chunk, padding, bounds, srcName);
	}

	private static NinePatchDrawable convertNotCompiledBitmap(Resources res, Bitmap bmp, String srcName) {
		// Check size
		final int w = bmp.getWidth();
		final int h = bmp.getHeight();
		if (w < 3 || h < 3) {
			return null;
		}

		// Create chunk
		Rect padding = new Rect(0,0,0,0);
		Rect bounds  = new Rect(0,0,0,0);
		ByteBuffer chunkB = createChunk(bmp, w, h, padding, bounds);
		if (chunkB == null) {
			return null;
		}

		// Trim "patches"
		bmp = Bitmap.createBitmap(bmp, 1, 1, w-2, h-2);
		if (bmp == null) {
			return null;
		}

		// Create drawable
		return newInstance(res, bmp, chunkB.array(), padding, bounds, srcName);
	}

	private static Rect getPadding(final byte[] chunk) {
		Rect padding = new Rect(0,0,0,0);

		ByteBuffer chunkB = ByteBuffer.wrap(chunk).order(ByteOrder.nativeOrder());
		chunkB.get();    // int8_t wasDeserialized;
		chunkB.get();    // int8_t numXDivs;
		chunkB.get();    // int8_t numYDivs;
		chunkB.get();    // int8_t numColors;
		chunkB.getInt(); // int32_t* xDivs;
		chunkB.getInt(); // int32_t* yDivs;
		padding.left   = chunkB.getInt();
		padding.right  = chunkB.getInt();
		padding.top    = chunkB.getInt();
		padding.bottom = chunkB.getInt();

		return padding;
	}

	private static Rect getLayoutBounds(Bitmap bmp) {
		Rect bounds = new Rect(0,0,0,0);

		if (Build.VERSION.SDK_INT >= 18){
			try {
				Method method;
				method = bmp.getClass().getMethod("getLayoutBounds");
				int[] lb = (int[])method.invoke(bmp);
				if (lb != null) {
					bounds.set(lb[0],lb[1],lb[2],lb[3]);
				}
			} catch (NoSuchMethodException e) {
				//e.printStackTrace();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		return bounds;
	}

	private static ByteBuffer createChunk(Bitmap bmp, int w, int h, Rect padding, Rect bounds) {
		final int maxColors = 0x7F;
		int numXDivs  = 0;
		int numYDivs  = 0;
		int numColors = 0;
		int[] xDivs  = new int[w-2];
		int[] yDivs  = new int[h-2];
		int[] colors = new int[maxColors];
		int x, y;
		boolean toggle;

		// Find left and right of sizing areas...
		y = 0;
		toggle = true;
		for (x=1; x<w-1; x++) {
			final int c = bmp.getPixel(x, y);
			if (toggle) {
				if (c == Color.BLACK) {
					toggle = false;
					xDivs[numXDivs++] = x;
				}
			} else {
				if (c != Color.BLACK) {
					toggle = true;
					xDivs[numXDivs++] = x;
				}
			}
		}
		if (numXDivs == 0) {
			return null;
		} else if (numXDivs == 1) {
			xDivs[numXDivs++] = w - 2;
		}

		// Find top and bottom of sizing areas...
		x = 0;
		toggle = true;
		for (y=1; y<h-1; y++) {
			final int c = bmp.getPixel(x, y);
			if (toggle) {
				if (c == Color.BLACK) {
					toggle = false;
					yDivs[numYDivs++] = y;
				}
			} else {
				if (c != Color.BLACK) {
					toggle = true;
					yDivs[numYDivs++] = y;
				}
			}
		}
		if (numYDivs == 0) {
			return null;
		} else if (numYDivs == 1) {
			yDivs[numYDivs++] = h - 2;
		}

		// Find left and right of padding area...
		y = h - 1;
		toggle = true;
		for (x=1; x<w-1; x++) {
			final int c = bmp.getPixel(x, y);
			if (toggle) {
				if (c == Color.BLACK) {
					toggle = false;
					padding.left = x - 1;
				}
			} else {
				if (c != Color.BLACK) {
					padding.right = w - x - 1;
					break;
				}
			}
		}

		// Find top and bottom of padding area...
		x = w - 1;
		toggle = true;
		for (y=1; y<h-1; y++) {
			final int c = bmp.getPixel(x, y);
			if (toggle) {
				if (c == Color.BLACK) {
					toggle = false;
					padding.top = y - 1;
				}
			} else {
				if (c != Color.BLACK) {
					padding.bottom = h - y - 1;
					break;
				}
			}
		}

		// Find left and right of bounds area...
		y = h - 1;
		x = 1;
		if (bmp.getPixel(x, y) == Color.RED) {
			for (x++; x<w-1; x++) {
				final int c = bmp.getPixel(x, y);
				if (c != Color.RED) {
					bounds.left = x - 1;
					break;
				}
			}
		}
		x = w - 2;
		if (bmp.getPixel(x, y) == Color.RED) {
			for (x--; x>0; x--) {
				final int c = bmp.getPixel(x, y);
				if (c != Color.RED) {
					bounds.right = w - x - 2;
					break;
				}
			}
		}

		// Find top and bottom of bounds area...
		x = w - 1;
		y = 1;
		if (bmp.getPixel(x, y) == Color.RED) {
			for (y++; y<h-1; y++) {
				final int c = bmp.getPixel(x, y);
				if (c != Color.RED) {
					bounds.top = y - 1;
					break;
				}
			}
		}
		y = h - 2;
		if (bmp.getPixel(x, y) == Color.RED) {
			for (y--; y>0; y--) {
				final int c = bmp.getPixel(x, y);
				if (c != Color.RED) {
					bounds.bottom = h - y - 2;
					break;
				}
			}
		}

		// Figure out the number of rows and columns in the N-patch
		final int numCols = numXDivs + 1
				- (xDivs[0]>1            ? 0 : 1)
				- (xDivs[numXDivs-1]<w-2 ? 0 : 1);
		final int numRows = numYDivs + 1
				- (yDivs[0]>1            ? 0 : 1)
				- (yDivs[numYDivs-1]<h-2 ? 0 : 1);

		// Fill in color information for each patch.
		numColors = numRows * numCols;
		if (numColors > maxColors) {
			return null;
		}
		int left=0,right=0,top=0,bottom=0;
		for (int j=0,k=0; j<=numYDivs; j++) {
			top    = (j==0       ? 1 : bottom);
			bottom = (j<numYDivs ? yDivs[j] : h-2);
			if (top >= bottom) {
				continue;
			}
			for (int i=0; i<=numXDivs; i++) {
				left  = (i==0       ? 1 : right);
				right = (i<numXDivs ? xDivs[i] : w-2);
				if (left >= right) {
					continue;
				}
				colors[k++] = getBlockColor(bmp, left, top, right-1, bottom-1);
			}
		}

		// Trim
		for (int i=0; i<numXDivs; i++) {
			xDivs[i]--;
		}
		for (int i=0; i<numYDivs; i++) {
			yDivs[i]--;
		}

		//
		ByteBuffer chunkB = ByteBuffer.allocate(
				SIZE_OF_INT8   + // int8_t wasDeserialized;
				SIZE_OF_INT8   + // int8_t numXDivs;
				SIZE_OF_INT8   + // int8_t numYDivs;
				SIZE_OF_INT8   + // int8_t numColors;
				SIZE_OF_PTR    + // int32_t* xDivs;
				SIZE_OF_PTR    + // int32_t* yDivs;
				SIZE_OF_INT32  + // int32_t paddingLeft;
				SIZE_OF_INT32  + // int32_t paddingRight;
				SIZE_OF_INT32  + // int32_t paddingTop;
				SIZE_OF_INT32  + // int32_t paddingBottom;
				SIZE_OF_PTR    + // uint32_t* colors;
				SIZE_OF_INT32  * numXDivs + // xDivs[]
				SIZE_OF_INT32  * numXDivs + // yDivs[]
				SIZE_OF_UINT32 * numColors  // colors[]
				).order(ByteOrder.nativeOrder());
		chunkB.put((byte)1); // wasDeserialized
		chunkB.put((byte)numXDivs);
		chunkB.put((byte)numYDivs);
		chunkB.put((byte)numColors);
		chunkB.putInt(0); // xDivs
		chunkB.putInt(0); // yDivs
		chunkB.putInt(padding.left);
		chunkB.putInt(padding.right);
		chunkB.putInt(padding.top);
		chunkB.putInt(padding.bottom);
		chunkB.putInt(0); // colors
		for (int i=0; i<numXDivs; i++) {
			chunkB.putInt(xDivs[i]);
		}
		for (int i=0; i<numYDivs; i++) {
			chunkB.putInt(yDivs[i]);
		}
		for (int i=0; i<numColors; i++) {
			chunkB.putInt(colors[i]);
		}

		return chunkB;
	}

	private static int getBlockColor(Bitmap bmp, int left, int top, int right, int bottom) {
		final int c = bmp.getPixel(left, top);
		for (int y=top; y<=bottom; y++) {
			for (int x=left; x<=right; x++) {
				final int p = bmp.getPixel(x, y);
				if (p != c && ((c | p) & 0xFF000000) != 0) {
					return NO_SOLID_COLOR;
				}
			}
		}
		if ((c & 0xFF000000) == 0) {
			return TRANSPARENT_COLOR;
		} else {
			return c; // Solid color
		}
	}

	private static NinePatchDrawable newInstance(Resources res, Bitmap bmp, byte[] chunk, Rect padding, Rect bounds, String srcName) {
		// Support "Optical bounds layout mode" ?
		if (Build.VERSION.SDK_INT >= 18){
			try {
				Constructor<NinePatchDrawable> c =
						NinePatchDrawable.class.getConstructor(new Class<?>[]{
								Resources.class,
								Bitmap.class,
								byte[].class,
								Rect.class,
								Rect.class,
								String.class
						});
				return c.newInstance(new Object[]{
						res,
						bmp,
						chunk,
						padding,
						bounds,
						srcName
				});
			} catch (NoSuchMethodException e) {
				//e.printStackTrace();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return new NinePatchDrawable(res, bmp, chunk, padding, srcName);
	}
}
