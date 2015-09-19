package com.facebook.react.modules.network;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.Response;
import com.squareup.okhttp.ws.WebSocket;
import com.squareup.okhttp.ws.WebSocketCall;
import com.squareup.okhttp.ws.WebSocketListener;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import okio.Buffer;
import okio.BufferedSource;

public class WebSocketModule extends ReactContextBaseJavaModule {
    private static final String TAG = "WebSocketModule";
    private Map<Integer, WebSocket> mSockets = new HashMap<Integer, WebSocket>();
    ReactApplicationContext mContext;

    public WebSocketModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mContext = reactContext;
    }

    @Override
    public String getName() {
        return "WebSocketAndroid";
    }

    @ReactMethod
    public void connect(String url, final int socketId) {
        OkHttpClient client = new OkHttpClient();

        Request request = new Request.Builder()
                .tag(Integer.valueOf(socketId))
                .url(url)
                .build();
        WebSocketCall.create(client, request).enqueue(new WebSocketListener() {
            private void sendEvent(String eventName, WritableMap values) {
                mContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, values);
            }

            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                mSockets.put(socketId, webSocket);
                WritableMap values = Arguments.createMap();
                values.putInt("id", socketId);
                sendEvent("websocketOpen", values);
            }

            @Override
            public void onFailure(IOException e, Response response) {
                Log.v(TAG, "WebSocketModule.onFailure: "+socketId+" - "+e.getMessage());
                WritableMap values = Arguments.createMap();
                values.putInt("id", socketId);
                values.putString("data", e.getMessage());
                sendEvent("websocketFailed", values);
            }

            @Override
            public void onMessage(BufferedSource bufferedSource, WebSocket.PayloadType payloadType) throws IOException {
                WritableMap values = Arguments.createMap();
                values.putInt("id", socketId);
                values.putString("data", bufferedSource.readUtf8());
                sendEvent("websocketMessage", values);
                bufferedSource.close();
            }

            @Override
            public void onPong(Buffer buffer) {
                Log.v(TAG, "WebSocketModule.onPong: "+buffer);
            }

            @Override
            public void onClose(int i, String s) {
                Log.v(TAG, "WebSocketModule.onClose: "+i+" - "+s);
                WritableMap params = Arguments.createMap();

                params.putInt("id", socketId);
                params.putInt("code", i);

                sendEvent("websocketClosed", params);
            }
        });
        client.getDispatcher().getExecutorService().shutdown();
    }

    @ReactMethod
    public void send(String message, final int socketId) {
        try {
            mSockets.get(socketId).sendMessage(WebSocket.PayloadType.TEXT, new Buffer().writeUtf8(message));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void close(int socketId) {
        if (mSockets.containsKey(socketId)) {
            try {
                mSockets.get(socketId).close(0, "unknown");
                mSockets.remove(socketId);
            } catch (IOException e) {
                e.printStackTrace();
            } catch (IllegalStateException ise) {
                // the web socket is likely already closed
                ise.printStackTrace();
            }
        }
    }

}