/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.camera;

import javax.annotation.Nullable;

import java.io.File;
import java.io.FileOutputStream;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.net.URLConnection;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import android.annotation.SuppressLint;
import android.content.Context;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapRegionDecoder;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.AsyncTask;
import android.provider.MediaStore;
import android.text.TextUtils;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.GuardedAsyncTask;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Native module that provides image cropping functionality.
 */
@ReactModule(name = ImageEditingManager.NAME)
public class ImageEditingManager extends ReactContextBaseJavaModule {

  protected static final String NAME = "ImageEditingManager";

  private static final List<String> LOCAL_URI_PREFIXES = Arrays.asList(
      "file://", "content://");

  private static final String TEMP_FILE_PREFIX = "ReactNative_cropped_image_";

  /** Compress quality of the output file. */
  private static final int COMPRESS_QUALITY = 90;

  @SuppressLint("InlinedApi") private static final String[] EXIF_ATTRIBUTES = new String[] {
    ExifInterface.TAG_APERTURE,
    ExifInterface.TAG_DATETIME,
    ExifInterface.TAG_DATETIME_DIGITIZED,
    ExifInterface.TAG_EXPOSURE_TIME,
    ExifInterface.TAG_FLASH,
    ExifInterface.TAG_FOCAL_LENGTH,
    ExifInterface.TAG_GPS_ALTITUDE,
    ExifInterface.TAG_GPS_ALTITUDE_REF,
    ExifInterface.TAG_GPS_DATESTAMP,
    ExifInterface.TAG_GPS_LATITUDE,
    ExifInterface.TAG_GPS_LATITUDE_REF,
    ExifInterface.TAG_GPS_LONGITUDE,
    ExifInterface.TAG_GPS_LONGITUDE_REF,
    ExifInterface.TAG_GPS_PROCESSING_METHOD,
    ExifInterface.TAG_GPS_TIMESTAMP,
    ExifInterface.TAG_IMAGE_LENGTH,
    ExifInterface.TAG_IMAGE_WIDTH,
    ExifInterface.TAG_ISO,
    ExifInterface.TAG_MAKE,
    ExifInterface.TAG_MODEL,
    ExifInterface.TAG_ORIENTATION,
    ExifInterface.TAG_SUBSEC_TIME,
    ExifInterface.TAG_SUBSEC_TIME_DIG,
    ExifInterface.TAG_SUBSEC_TIME_ORIG,
    ExifInterface.TAG_WHITE_BALANCE
  };

  public ImageEditingManager(ReactApplicationContext reactContext) {
    super(reactContext);
    new CleanTask(getReactApplicationContext()).executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public Map<String, Object> getConstants() {
    return Collections.emptyMap();
  }

  @Override
  public void onCatalystInstanceDestroy() {
    new CleanTask(getReactApplicationContext()).executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  /**
   * Asynchronous task that cleans up cache dirs (internal and, if available, external) of cropped
   * image files. This is run when the catalyst instance is being destroyed (i.e. app is shutting
   * down) and when the module is instantiated, to handle the case where the app crashed.
   */
  private static class CleanTask extends GuardedAsyncTask<Void, Void> {
    private final Context mContext;

    private CleanTask(ReactContext context) {
      super(context);
      mContext = context;
    }

    @Override
    protected void doInBackgroundGuarded(Void... params) {
      cleanDirectory(mContext.getCacheDir());
      File externalCacheDir = mContext.getExternalCacheDir();
      if (externalCacheDir != null) {
        cleanDirectory(externalCacheDir);
      }
    }

    private void cleanDirectory(File directory) {
      File[] toDelete = directory.listFiles(
          new FilenameFilter() {
            @Override
            public boolean accept(File dir, String filename) {
              return filename.startsWith(TEMP_FILE_PREFIX);
            }
          });
      if (toDelete != null) {
        for (File file: toDelete) {
          file.delete();
        }
      }
    }
  }

  /**
   * Crop an image. If all goes well, the success callback will be called with the file:// URI of
   * the new image as the only argument. This is a temporary file - consider using
   * CameraRollManager.saveImageWithTag to save it in the gallery.
   *
   * @param uri the MediaStore URI of the image to crop
   * @param options crop parameters specified as {@code {offset: {x, y}, size: {width, height}}}.
   *        Optionally this also contains  {@code {targetSize: {width, height}}}. If this is
   *        specified, the cropped image will be resized to that size.
   *        All units are in pixels (not DPs).
   * @param success callback to be invoked when the image has been cropped; the only argument that
   *        is passed to this callback is the file:// URI of the new image
   * @param error callback to be invoked when an error occurs (e.g. can't create file etc.)
   */
  @ReactMethod
  public void cropImage(
      String uri,
      ReadableMap options,
      final Callback success,
      final Callback error) {
    ReadableMap offset = options.hasKey("offset") ? options.getMap("offset") : null;
    ReadableMap size = options.hasKey("size") ? options.getMap("size") : null;
    if (offset == null || size == null ||
        !offset.hasKey("x") || !offset.hasKey("y") ||
        !size.hasKey("width") || !size.hasKey("height")) {
      throw new JSApplicationIllegalArgumentException("Please specify offset and size");
    }
    if (uri == null || uri.isEmpty()) {
      throw new JSApplicationIllegalArgumentException("Please specify a URI");
    }

    CropTask cropTask = new CropTask(
        getReactApplicationContext(),
        uri,
        (int) offset.getDouble("x"),
        (int) offset.getDouble("y"),
        (int) size.getDouble("width"),
        (int) size.getDouble("height"),
        success,
        error);
    if (options.hasKey("displaySize")) {
      ReadableMap targetSize = options.getMap("displaySize");
      cropTask.setTargetSize(
        (int) targetSize.getDouble("width"),
        (int) targetSize.getDouble("height"));
    }
    cropTask.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  private static class CropTask extends GuardedAsyncTask<Void, Void> {
    final Context mContext;
    final String mUri;
    final int mX;
    final int mY;
    final int mWidth;
    final int mHeight;
    int mTargetWidth = 0;
    int mTargetHeight = 0;
    final Callback mSuccess;
    final Callback mError;

    private CropTask(
        ReactContext context,
        String uri,
        int x,
        int y,
        int width,
        int height,
        Callback success,
        Callback error) {
      super(context);
      if (x < 0 || y < 0 || width <= 0 || height <= 0) {
        throw new JSApplicationIllegalArgumentException(String.format(
            "Invalid crop rectangle: [%d, %d, %d, %d]", x, y, width, height));
      }
      mContext = context;
      mUri = uri;
      mX = x;
      mY = y;
      mWidth = width;
      mHeight = height;
      mSuccess = success;
      mError = error;
    }

    public void setTargetSize(int width, int height) {
      if (width <= 0 || height <= 0) {
        throw new JSApplicationIllegalArgumentException(String.format(
            "Invalid target size: [%d, %d]", width, height));
      }
      mTargetWidth = width;
      mTargetHeight = height;
    }

    private InputStream openBitmapInputStream() throws IOException {
      InputStream stream;
      if (isLocalUri(mUri)) {
        stream = mContext.getContentResolver().openInputStream(Uri.parse(mUri));
      } else {
        URLConnection connection = new URL(mUri).openConnection();
        stream = connection.getInputStream();
      }
      if (stream == null) {
        throw new IOException("Cannot open bitmap: " + mUri);
      }
      return stream;
    }

    @Override
    protected void doInBackgroundGuarded(Void... params) {
      try {
        BitmapFactory.Options outOptions = new BitmapFactory.Options();

        // If we're downscaling, we can decode the bitmap more efficiently, using less memory
        boolean hasTargetSize = (mTargetWidth > 0) && (mTargetHeight > 0);

        Bitmap cropped;
        if (hasTargetSize) {
          cropped = cropAndResize(mTargetWidth, mTargetHeight, outOptions);
        } else {
          cropped = crop(outOptions);
        }

        String mimeType = outOptions.outMimeType;
        if (mimeType == null || mimeType.isEmpty()) {
          throw new IOException("Could not determine MIME type");
        }

        File tempFile = createTempFile(mContext, mimeType);
        writeCompressedBitmapToFile(cropped, mimeType, tempFile);

        if (mimeType.equals("image/jpeg")) {
          copyExif(mContext, Uri.parse(mUri), tempFile);
        }

        mSuccess.invoke(Uri.fromFile(tempFile).toString());
      } catch (Exception e) {
        mError.invoke(e.getMessage());
      }
    }

    /**
     * Reads and crops the bitmap.
     * @param outOptions Bitmap options, useful to determine {@code outMimeType}.
     */
    private Bitmap crop(BitmapFactory.Options outOptions) throws IOException {
      InputStream inputStream = openBitmapInputStream();
      // Effeciently crops image without loading full resolution into memory
      // https://developer.android.com/reference/android/graphics/BitmapRegionDecoder.html
      BitmapRegionDecoder decoder = BitmapRegionDecoder.newInstance(inputStream, false);
      try {
        Rect rect = new Rect(mX, mY, mX + mWidth, mY + mHeight);
        return decoder.decodeRegion(rect, outOptions);
      } finally {
        if (inputStream != null) {
          inputStream.close();
        }
        decoder.recycle();
      }
    }

    /**
     * Crop the rectangle given by {@code mX, mY, mWidth, mHeight} within the source bitmap
     * and scale the result to {@code targetWidth, targetHeight}.
     * @param outOptions Bitmap options, useful to determine {@code outMimeType}.
     */
    private Bitmap cropAndResize(
        int targetWidth,
        int targetHeight,
        BitmapFactory.Options outOptions)
        throws IOException {
      Assertions.assertNotNull(outOptions);

      // Loading large bitmaps efficiently:
      // http://developer.android.com/training/displaying-bitmaps/load-bitmap.html

      // Just decode the dimensions
      BitmapFactory.Options options = new BitmapFactory.Options();
      options.inJustDecodeBounds = true;
      InputStream inputStream = openBitmapInputStream();
      try {
        BitmapFactory.decodeStream(inputStream, null, options);
      } finally {
        if (inputStream != null) {
          inputStream.close();
        }
      }

      // This uses scaling mode COVER

      // Where would the crop rect end up within the scaled bitmap?
      float newWidth, newHeight, newX, newY, scale;
      float cropRectRatio = mWidth / (float) mHeight;
      float targetRatio = targetWidth / (float) targetHeight;
      if (cropRectRatio > targetRatio) {
        // e.g. source is landscape, target is portrait
        newWidth = mHeight * targetRatio;
        newHeight = mHeight;
        newX = mX + (mWidth - newWidth) / 2;
        newY = mY;
        scale = targetHeight / (float) mHeight;
      } else {
        // e.g. source is landscape, target is portrait
        newWidth = mWidth;
        newHeight = mWidth / targetRatio;
        newX = mX;
        newY = mY + (mHeight - newHeight) / 2;
        scale = targetWidth / (float) mWidth;
      }

      // Decode the bitmap. We have to open the stream again, like in the example linked above.
      // Is there a way to just continue reading from the stream?
      outOptions.inSampleSize = getDecodeSampleSize(mWidth, mHeight, targetWidth, targetHeight);
      options.inJustDecodeBounds = false;
      inputStream = openBitmapInputStream();

      Bitmap bitmap;
      try {
        // This can use significantly less memory than decoding the full-resolution bitmap
        bitmap = BitmapFactory.decodeStream(inputStream, null, outOptions);
        if (bitmap == null) {
          throw new IOException("Cannot decode bitmap: " + mUri);
        }
      } finally {
        if (inputStream != null) {
          inputStream.close();
        }
      }

      int cropX = (int) Math.floor(newX / (float) outOptions.inSampleSize);
      int cropY = (int) Math.floor(newY / (float) outOptions.inSampleSize);
      int cropWidth = (int) Math.floor(newWidth / (float) outOptions.inSampleSize);
      int cropHeight = (int) Math.floor(newHeight / (float) outOptions.inSampleSize);
      float cropScale = scale * outOptions.inSampleSize;

      Matrix scaleMatrix = new Matrix();
      scaleMatrix.setScale(cropScale, cropScale);
      boolean filter = true;

      return Bitmap.createBitmap(bitmap, cropX, cropY, cropWidth, cropHeight, scaleMatrix, filter);
    }
  }

  // Utils

  private static void copyExif(Context context, Uri oldImage, File newFile) throws IOException {
    File oldFile = getFileFromUri(context, oldImage);
    if (oldFile == null) {
      FLog.w(ReactConstants.TAG, "Couldn't get real path for uri: " + oldImage);
      return;
    }

    ExifInterface oldExif = new ExifInterface(oldFile.getAbsolutePath());
    ExifInterface newExif = new ExifInterface(newFile.getAbsolutePath());
    for (String attribute : EXIF_ATTRIBUTES) {
      String value = oldExif.getAttribute(attribute);
      if (value != null) {
        newExif.setAttribute(attribute, value);
      }
    }
    newExif.saveAttributes();
  }

  private static @Nullable File getFileFromUri(Context context, Uri uri) {
    if (uri.getScheme().equals("file")) {
      return new File(uri.getPath());
    } else if (uri.getScheme().equals("content")) {
      Cursor cursor = context.getContentResolver()
        .query(uri, new String[] { MediaStore.MediaColumns.DATA }, null, null, null);
      if (cursor != null) {
        try {
          if (cursor.moveToFirst()) {
            String path = cursor.getString(0);
            if (!TextUtils.isEmpty(path)) {
              return new File(path);
            }
          }
        } finally {
          cursor.close();
        }
      }
    }

    return null;
  }

  private static boolean isLocalUri(String uri) {
    for (String localPrefix : LOCAL_URI_PREFIXES) {
      if (uri.startsWith(localPrefix)) {
        return true;
      }
    }
    return false;
  }

  private static String getFileExtensionForType(@Nullable String mimeType) {
    if ("image/png".equals(mimeType)) {
      return ".png";
    }
    if ("image/webp".equals(mimeType)) {
      return ".webp";
    }
    return ".jpg";
  }

  private static Bitmap.CompressFormat getCompressFormatForType(String type) {
    if ("image/png".equals(type)) {
      return Bitmap.CompressFormat.PNG;
    }
    if ("image/webp".equals(type)) {
      return Bitmap.CompressFormat.WEBP;
    }
    return Bitmap.CompressFormat.JPEG;
  }

  private static void writeCompressedBitmapToFile(Bitmap cropped, String mimeType, File tempFile)
      throws IOException {
    OutputStream out = new FileOutputStream(tempFile);
    try {
      cropped.compress(getCompressFormatForType(mimeType), COMPRESS_QUALITY, out);
    } finally {
      if (out != null) {
        out.close();
      }
    }
  }

  /**
   * Create a temporary file in the cache directory on either internal or external storage,
   * whichever is available and has more free space.
   *
   * @param mimeType the MIME type of the file to create (image/*)
   */
  private static File createTempFile(Context context, @Nullable String mimeType)
      throws IOException {
    File externalCacheDir = context.getExternalCacheDir();
    File internalCacheDir = context.getCacheDir();
    File cacheDir;
    if (externalCacheDir == null && internalCacheDir == null) {
      throw new IOException("No cache directory available");
    }
    if (externalCacheDir == null) {
      cacheDir = internalCacheDir;
    }
    else if (internalCacheDir == null) {
      cacheDir = externalCacheDir;
    } else {
      cacheDir = externalCacheDir.getFreeSpace() > internalCacheDir.getFreeSpace() ?
          externalCacheDir : internalCacheDir;
    }
    return File.createTempFile(TEMP_FILE_PREFIX, getFileExtensionForType(mimeType), cacheDir);
  }

  /**
   * When scaling down the bitmap, decode only every n-th pixel in each dimension.
   * Calculate the largest {@code inSampleSize} value that is a power of 2 and keeps both
   * {@code width, height} larger or equal to {@code targetWidth, targetHeight}.
   * This can significantly reduce memory usage.
   */
  private static int getDecodeSampleSize(int width, int height, int targetWidth, int targetHeight) {
    int inSampleSize = 1;
    if (height > targetWidth || width > targetHeight) {
      int halfHeight = height / 2;
      int halfWidth = width / 2;
      while ((halfWidth / inSampleSize) >= targetWidth
          && (halfHeight / inSampleSize) >= targetHeight) {
        inSampleSize *= 2;
      }
    }
    return inSampleSize;
  }
}
