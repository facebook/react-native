// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.devsupport;

import javax.annotation.Nullable;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import android.os.Handler;
import android.os.Looper;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Inspector;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okhttp3.ws.WebSocket;
import okhttp3.ws.WebSocketCall;
import okhttp3.ws.WebSocketListener;
import okio.Buffer;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class InspectorPackagerConnection {
  private static final String TAG = "InspectorPackagerConnection";

  private final Connection mConnection;
  private final Map<String, Inspector.LocalConnection> mInspectorConnections;

  public InspectorPackagerConnection(String url) {
    mConnection = new Connection(url);
    mInspectorConnections = new HashMap<>();
  }

  public void connect() {
    mConnection.connect();
  }

  public void closeQuietly() {
    mConnection.close();
  }

  public void sendOpenEvent(String pageId) {
    try {
      JSONObject payload = makePageIdPayload(pageId);
      sendEvent("open", payload);
    } catch (JSONException | IOException e) {
      FLog.e(TAG, "Failed to open page", e);
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

  private void handleConnect(JSONObject payload) throws JSONException, IOException {
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
          } catch (IOException | JSONException e) {
            FLog.w(TAG, "Couldn't send event to packager", e);
          }
        }

        @Override
        public void onDisconnect() {
          try {
            mInspectorConnections.remove(pageId);
            sendEvent("disconnect", makePageIdPayload(pageId));
          } catch (IOException | JSONException e) {
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

  private void handleWrappedEvent(JSONObject payload) throws JSONException, IOException {
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
    for (Inspector.Page page : pages) {
      JSONObject jsonPage = new JSONObject();
      jsonPage.put("id", String.valueOf(page.getId()));
      jsonPage.put("title", page.getTitle());
      array.put(jsonPage);
    }
    return array;
  }

  private void sendWrappedEvent(String pageId, String message) throws IOException, JSONException {
    JSONObject payload = new JSONObject();
    payload.put("pageId", pageId);
    payload.put("wrappedEvent", message);
    sendEvent("wrappedEvent", payload);
  }

  private void sendEvent(String name, Object payload)
      throws JSONException, IOException {
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

  private class Connection implements WebSocketListener {
    private static final int RECONNECT_DELAY_MS = 2000;

    private final String mUrl;

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
    public void onFailure(IOException e, Response response) {
      if (mWebSocket != null) {
        abort("Websocket exception", e);
      }
      if (!mClosed) {
        reconnect();
      }
    }

    @Override
    public void onMessage(ResponseBody message) throws IOException {
      try {
        handleProxyMessage(new JSONObject(message.string()));
      } catch (JSONException e) {
        throw new IOException(e);
      } finally {
        message.close();
      }
    }

    @Override
    public void onPong(Buffer payload) {
    }

    @Override
    public void onClose(int code, String reason) {
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
      OkHttpClient httpClient = new OkHttpClient.Builder()
          .connectTimeout(10, TimeUnit.SECONDS)
          .writeTimeout(10, TimeUnit.SECONDS)
          .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read
          .build();

      Request request = new Request.Builder().url(mUrl).build();
      WebSocketCall call = WebSocketCall.create(httpClient, request);
      call.enqueue(this);
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
        } catch (IOException e) {
          // swallow, no need to handle it here
        }
        mWebSocket = null;
      }
    }

    public void send(JSONObject object) throws IOException {
      if (mWebSocket == null) {
        return;
      }

      mWebSocket.sendMessage(RequestBody.create(WebSocket.TEXT, object.toString()));
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
        } catch (IOException e) {
          // swallow, no need to handle it here
        }
        mWebSocket = null;
      }
    }
  }
}
