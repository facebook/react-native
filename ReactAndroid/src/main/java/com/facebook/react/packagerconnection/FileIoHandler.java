/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection;

import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import org.json.JSONObject;

public class FileIoHandler implements Runnable {
  private static final String TAG = JSPackagerClient.class.getSimpleName();
  private static final long FILE_TTL = 30 * 1000;

  private static class TtlFileInputStream {
    private final FileInputStream mStream;
    private long mTtl;

    public TtlFileInputStream(String path) throws FileNotFoundException {
      mStream = new FileInputStream(path);
      mTtl = System.currentTimeMillis() + FILE_TTL;
    }

    private void extendTtl() {
      mTtl = System.currentTimeMillis() + FILE_TTL;
    }

    public boolean expiredTtl() {
      return System.currentTimeMillis() >= mTtl;
    }

    public String read(int size) throws IOException {
      extendTtl();
      byte[] buffer = new byte[size];
      int bytesRead = mStream.read(buffer);
      return Base64.encodeToString(buffer, 0, bytesRead, Base64.DEFAULT);
    }

    public void close() throws IOException {
      mStream.close();
    }
  };

  private int mNextHandle;
  private final Handler mHandler;
  private final Map<Integer, TtlFileInputStream> mOpenFiles;
  private final Map<String, RequestHandler> mRequestHandlers;

  public FileIoHandler() {
    mNextHandle = 1;
    mHandler = new Handler(Looper.getMainLooper());
    mOpenFiles = new HashMap<>();
    mRequestHandlers = new HashMap<>();
    mRequestHandlers.put(
        "fopen",
        new RequestOnlyHandler() {
          @Override
          public void onRequest(@Nullable Object params, Responder responder) {
            synchronized (mOpenFiles) {
              try {
                JSONObject paramsObj = (JSONObject) params;
                if (paramsObj == null) {
                  throw new Exception(
                      "params must be an object { mode: string, filename: string }");
                }
                String mode = paramsObj.optString("mode");
                if (mode == null) {
                  throw new Exception("missing params.mode");
                }
                String filename = paramsObj.optString("filename");
                if (filename == null) {
                  throw new Exception("missing params.filename");
                }
                if (!mode.equals("r")) {
                  throw new IllegalArgumentException("unsupported mode: " + mode);
                }

                responder.respond(addOpenFile(filename));
              } catch (Exception e) {
                responder.error(e.toString());
              }
            }
          }
        });
    mRequestHandlers.put(
        "fclose",
        new RequestOnlyHandler() {
          @Override
          public void onRequest(@Nullable Object params, Responder responder) {
            synchronized (mOpenFiles) {
              try {
                if (!(params instanceof Number)) {
                  throw new Exception("params must be a file handle");
                }
                TtlFileInputStream stream = mOpenFiles.get((int) params);
                if (stream == null) {
                  throw new Exception("invalid file handle, it might have timed out");
                }

                mOpenFiles.remove((int) params);
                stream.close();
                responder.respond("");
              } catch (Exception e) {
                responder.error(e.toString());
              }
            }
          }
        });
    mRequestHandlers.put(
        "fread",
        new RequestOnlyHandler() {
          @Override
          public void onRequest(@Nullable Object params, Responder responder) {
            synchronized (mOpenFiles) {
              try {
                JSONObject paramsObj = (JSONObject) params;
                if (paramsObj == null) {
                  throw new Exception("params must be an object { file: handle, size: number }");
                }
                int file = paramsObj.optInt("file");
                if (file == 0) {
                  throw new Exception("invalid or missing file handle");
                }
                int size = paramsObj.optInt("size");
                if (size == 0) {
                  throw new Exception("invalid or missing read size");
                }
                TtlFileInputStream stream = mOpenFiles.get(file);
                if (stream == null) {
                  throw new Exception("invalid file handle, it might have timed out");
                }

                responder.respond(stream.read(size));
              } catch (Exception e) {
                responder.error(e.toString());
              }
            }
          }
        });
  }

  public Map<String, RequestHandler> handlers() {
    return mRequestHandlers;
  }

  private int addOpenFile(String filename) throws FileNotFoundException {
    int handle = mNextHandle++;
    mOpenFiles.put(handle, new TtlFileInputStream(filename));
    if (mOpenFiles.size() == 1) {
      mHandler.postDelayed(FileIoHandler.this, FILE_TTL);
    }
    return handle;
  }

  @Override
  public void run() {
    // clean up files that are past their expiry date
    synchronized (mOpenFiles) {
      Iterator<TtlFileInputStream> i = mOpenFiles.values().iterator();
      while (i.hasNext()) {
        TtlFileInputStream stream = i.next();
        if (stream.expiredTtl()) {
          i.remove();
          try {
            stream.close();
          } catch (IOException e) {
            FLog.e(TAG, "closing expired file failed: " + e.toString());
          }
        }
      }
      if (!mOpenFiles.isEmpty()) {
        mHandler.postDelayed(this, FILE_TTL);
      }
    }
  }
}
