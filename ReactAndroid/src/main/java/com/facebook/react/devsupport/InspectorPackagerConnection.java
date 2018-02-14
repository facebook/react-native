// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.devsupport;

import javax.annotation.Nullable;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import android.os.AsyncTask;
import android.os.Handler;
import android.os.Looper;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Inspector;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class InspectorPackagerConnection {
  private static final String TAG = "InspectorPackagerConnection";

  private final Connection mConnection;
  private final Map<String, Inspector.LocalConnection> mInspectorConnections;
  private final String mPackageName;
  private BundleStatusProvider mBundleStatusProvider;

  public InspectorPackagerConnection(
    String url,
    String packageName,
    BundleStatusProvider bundleStatusProvider
  ) {
    mConnection = new Connection(url);
    mInspectorConnections = new HashMap<>();
    mPackageName = packageName;
    mBundleStatusProvider = bundleStatusProvider;
  }

  public void connect() {
    mConnection.connect();
  }

  public void closeQuietly() {
    mConnection.close();
  }

  public void sendEventToAllConnections(String event) {
    for (Map.Entry<String, Inspector.LocalConnection> inspectorConnectionEntry :
        mInspectorConnections.entrySet()) {
      Inspector.LocalConnection inspectorConnection = inspectorConnectionEntry.getValue();
      inspectorConnection.sendMessage(event);
    }
  }

  void handleProxyMessage(JSONObject message)
      throws JSONException, IOException {
    String event = message.getString("event");
    switch (event) {
      case "getPages":
        sendEvent("getPages", getPages());
        break;
      case "wrappedEvent":
        handleWrappedEvent(message.getJSONObject("payload"));
        break;
      case "connect":
        handleConnect(message.getJSONObject("payload"));
        break;
      case "disconnect":
        handleDisconnect(message.getJSONObject("payload"));
        break;
      default:
        throw new IllegalArgumentException("Unknown event: " + event);
    }
  }

  void closeAllConnections() {
    for (Map.Entry<String, Inspector.LocalConnection> entry : mInspectorConnections.entrySet()) {
      entry.getValue().disconnect();
    }
    mInspectorConnections.clear();
  }

  private void handleConnect(JSONObject payload) throws JSONException {
    final String pageId = payload.getString("pageId");
    Inspector.LocalConnection inspectorConnection = mInspectorConnections.remove(pageId);
    if (inspectorConnection != null) {
      throw new IllegalStateException("Already connected: " + pageId);
    }

    try {
      // TODO: Use strings for id's too
      inspectorConnection = Inspector.connect(Integer.parseInt(pageId), new Inspector.RemoteConnection() {
        @Override
        public void onMessage(String message) {
          try {
            sendWrappedEvent(pageId, message);
          } catch (JSONException e) {
            FLog.w(TAG, "Couldn't send event to packager", e);
          }
        }

        @Override
        public void onDisconnect() {
          try {
            mInspectorConnections.remove(pageId);
            sendEvent("disconnect", makePageIdPayload(pageId));
          } catch (JSONException e) {
            FLog.w(TAG, "Couldn't send event to packager", e);
          }
        }
      });
      mInspectorConnections.put(pageId, inspectorConnection);
    } catch (Exception e) {
      FLog.w(TAG, "Failed to open page: " + pageId, e);
      sendEvent("disconnect", makePageIdPayload(pageId));
    }
  }

  private void handleDisconnect(JSONObject payload) throws JSONException {
    final String pageId = payload.getString("pageId");
    Inspector.LocalConnection inspectorConnection = mInspectorConnections.remove(pageId);
    if (inspectorConnection == null) {
      return;
    }

    inspectorConnection.disconnect();
  }

  private void handleWrappedEvent(JSONObject payload) throws JSONException {
    final String pageId = payload.getString("pageId");
    String wrappedEvent = payload.getString("wrappedEvent");
    Inspector.LocalConnection inspectorConnection = mInspectorConnections.get(pageId);
    if (inspectorConnection == null) {
      throw new IllegalStateException("Not connected: " + pageId);
    }
    inspectorConnection.sendMessage(wrappedEvent);
  }

  private JSONArray getPages() throws JSONException {
    List<Inspector.Page> pages = Inspector.getPages();
    JSONArray array = new JSONArray();
    BundleStatus bundleStatus = mBundleStatusProvider.getBundleStatus();
    for (Inspector.Page page : pages) {
      JSONObject jsonPage = new JSONObject();
      jsonPage.put("id", String.valueOf(page.getId()));
      jsonPage.put("title", page.getTitle());
      jsonPage.put("app", mPackageName);
      jsonPage.put("vm", page.getVM());
      jsonPage.put("isLastBundleDownloadSuccess", bundleStatus.isLastDownloadSucess);
      jsonPage.put("bundleUpdateTimestamp", bundleStatus.updateTimestamp);
      array.put(jsonPage);
    }
    return array;
  }

  private void sendWrappedEvent(String pageId, String message) throws JSONException {
    JSONObject payload = new JSONObject();
    payload.put("pageId", pageId);
    payload.put("wrappedEvent", message);
    sendEvent("wrappedEvent", payload);
  }

  private void sendEvent(String name, Object payload)
      throws JSONException {
    JSONObject jsonMessage = new JSONObject();
    jsonMessage.put("event", name);
    jsonMessage.put("payload", payload);
    mConnection.send(jsonMessage);
  }

  private JSONObject makePageIdPayload(String pageId) throws JSONException {
    JSONObject payload = new JSONObject();
    payload.put("pageId", pageId);
    return payload;
  }

  private class Connection extends WebSocketListener {
    private static final int RECONNECT_DELAY_MS = 2000;

    private final String mUrl;

    private OkHttpClient mHttpClient;
    private @Nullable WebSocket mWebSocket;
    private final Handler mHandler;
    private boolean mClosed;
    private boolean mSuppressConnectionErrors;

    public Connection(String url) {
      mUrl = url;
      mHandler = new Handler(Looper.getMainLooper());
    }

    @Override
    public void onOpen(WebSocket webSocket, Response response) {
      mWebSocket = webSocket;
    }

    @Override
    public void onFailure(WebSocket webSocket, Throwable t, Response response) {
      if (mWebSocket != null) {
        abort("Websocket exception", t);
      }
      if (!mClosed) {
        reconnect();
      }
    }

    @Override
    public void onMessage(WebSocket webSocket, String text) {
      try {
        handleProxyMessage(new JSONObject(text));
      } catch (Exception e) {
        throw new RuntimeException(e);
      }
    }

    @Override
    public void onClosed(WebSocket webSocket, int code, String reason) {
      mWebSocket = null;
      closeAllConnections();
      if (!mClosed) {
        reconnect();
      }
    }

    public void connect() {
      if (mClosed) {
        throw new IllegalStateException("Can't connect closed client");
      }
      if (mHttpClient == null) {
        mHttpClient = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read
            .build();
      }

      Request request = new Request.Builder().url(mUrl).build();
      mHttpClient.newWebSocket(request, this);
    }

    private void reconnect() {
      if (mClosed) {
        throw new IllegalStateException("Can't reconnect closed client");
      }
      if (!mSuppressConnectionErrors) {
        FLog.w(TAG, "Couldn't connect to packager, will silently retry");
        mSuppressConnectionErrors = true;
      }
      mHandler.postDelayed(
          new Runnable() {
            @Override
            public void run() {
              // check that we haven't been closed in the meantime
              if (!mClosed) {
                connect();
              }
            }
          },
          RECONNECT_DELAY_MS);
    }

    public void close() {
      mClosed = true;
      if (mWebSocket != null) {
        try {
          mWebSocket.close(1000, "End of session");
        } catch (Exception e) {
          // swallow, no need to handle it here
        }
        mWebSocket = null;
      }
    }

    public void send(final JSONObject object) {
      new AsyncTask<WebSocket, Void, Void>() {
        @Override
        protected Void doInBackground(WebSocket... sockets) {
          if (sockets == null || sockets.length == 0) {
            return null;
          }
          try {
            sockets[0].send(object.toString());
          } catch (Exception e) {
            FLog.w(TAG, "Couldn't send event to packager", e);
          }
          return null;
        }
      }.execute(mWebSocket);
    }

    private void abort(String message, Throwable cause) {
      FLog.e(TAG, "Error occurred, shutting down websocket connection: " + message, cause);
      closeAllConnections();
      closeWebSocketQuietly();
    }

    private void closeWebSocketQuietly() {
      if (mWebSocket != null) {
        try {
          mWebSocket.close(1000, "End of session");
        } catch (Exception e) {
          // swallow, no need to handle it here
        }
        mWebSocket = null;
      }
    }
  }

  static public class BundleStatus {
    public Boolean isLastDownloadSucess;
    public long updateTimestamp = -1;

    public BundleStatus(
      Boolean isLastDownloadSucess,
      long updateTimestamp
    ) {
      this.isLastDownloadSucess = isLastDownloadSucess;
      this.updateTimestamp = updateTimestamp;
    }

    public BundleStatus() {
      this(false, -1);
    }
  }

  public interface BundleStatusProvider {
    public BundleStatus getBundleStatus();
  }
}
