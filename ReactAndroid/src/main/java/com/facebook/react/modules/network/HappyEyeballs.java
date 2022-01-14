package com.facebook.react.modules.network;

import android.os.Handler;

import androidx.annotation.NonNull;

import org.jetbrains.annotations.NotNull;

import java.io.IOException;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReferenceArray;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Connection;
import okhttp3.Dns;
import okhttp3.EventListener;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Simplistic HappyEyeballs implementation for OkHttp3. It currently is lacking preferential address
 * selection based on previous requests in the same network.
 * */

public class HappyEyeballs {
  private final OkHttpClient.Builder mClientBuilder;
  private final Request.Builder mRequestBuilder;
  private final Callback mCallback;

  private List<InetAddress> mOrderedAddresses;
  private final AtomicInteger mSelectedConnectionIndex;
  private final AtomicReferenceArray<Call> mCalls;
  private final AtomicInteger mFailedCallsCount;

  private final Handler mHandler;
  private Runnable mNextRequest;

  private static final int INITIAL_SELECTED_CONNECTION_INDEX = -1;
  private static final int MAX_ADDRESSES = 8;

  HappyEyeballs(OkHttpClient.Builder clientBuilder, Request.Builder requestBuilder, Callback callback) {
    mClientBuilder = clientBuilder;
    mRequestBuilder = requestBuilder;
    mCallback = callback;

    mSelectedConnectionIndex = new AtomicInteger(INITIAL_SELECTED_CONNECTION_INDEX);
    mCalls = new AtomicReferenceArray<>(MAX_ADDRESSES);
    mFailedCallsCount = new AtomicInteger(0);

    mHandler = new Handler();

    // the runnable ensures thread safety of mOrderedAddresses
    request(0, () -> queueNextRequest(1, 400));
  }

  private void request(int index, Runnable onResolveAddresses) {
    OkHttpClient client = mClientBuilder
      .dns(new NthAddress(index, onResolveAddresses))
      .eventListener(new SelectConnectionOnAcquire(index))
      .build();

    Call call = client
      .newCall(mRequestBuilder.build());

    mCalls.set(index, call);

    // one of the previous connections resolved -> no need to enqueue this one
    if (mSelectedConnectionIndex.get() != INITIAL_SELECTED_CONNECTION_INDEX) {
      return;
    }

    call.enqueue(new Callback() {
      @Override
      public void onFailure(@NonNull Call call, @NonNull IOException e) {
        // check if DNS resolution or a step before failed
        if (mOrderedAddresses == null) {
          mCallback.onFailure(call, e);
          return;
        }

        int failedCallsCount = mFailedCallsCount.incrementAndGet();
        boolean isLastCall = failedCallsCount == mOrderedAddresses.size();

        if (isLastCall || mSelectedConnectionIndex.get() == index) {
          mCallback.onFailure(call, e);
        }
      }

      @Override
      public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
        if (mSelectedConnectionIndex.get() != index) {
          return;
        }

        mCallback.onResponse(call, response);
      }
    });
  }

  private void queueNextRequest(int index, int delayMillis) {
    if (
      mOrderedAddresses == null // DNS resolution or a step before failed
      || mOrderedAddresses.size() <= index
    ) {
      return;
    }

    Runnable nextRequest = () -> {
      request(index, null);
      queueNextRequest(index + 1, Math.min(
        Math.round(1.5f * delayMillis),
        2000 // see https://datatracker.ietf.org/doc/html/rfc8305#section-5
      ));
    };

    mHandler.postDelayed(nextRequest, delayMillis);
    mNextRequest = nextRequest;
  }

  private final class NthAddress implements Dns {
    private final int mAddressIndex;
    private final Runnable mOnResolveDNS;

    NthAddress(int addressIndex, Runnable onResolveDNS) {
      mAddressIndex = addressIndex;
      mOnResolveDNS = onResolveDNS;
    }

    public List<InetAddress> lookup(@NotNull String hostname) throws UnknownHostException {
      if (mOrderedAddresses == null) {
        try {
          mOrderedAddresses = getOrderedAddresses(hostname);
        } finally {
          if (mOnResolveDNS != null) {
            mOnResolveDNS.run();
          }
        }
      }

      if (mOrderedAddresses.size() <= mAddressIndex) {
        throw new UnknownHostException();
      }

      return mOrderedAddresses.subList(mAddressIndex, mAddressIndex + 1);
    }

    private List<InetAddress> getOrderedAddresses(@NotNull String hostname) throws UnknownHostException {
      List<InetAddress> addresses = Dns.SYSTEM.lookup(hostname);

      List<Inet4Address> inet4Addresses = new ArrayList<>();
      List<Inet6Address> inet6Addresses = new ArrayList<>();
      for (InetAddress address : addresses) {
        if (address instanceof Inet4Address) {
          inet4Addresses.add((Inet4Address) address);
        } else {
          inet6Addresses.add((Inet6Address) address);
        }
      }

      List<InetAddress> zippedAddresses = new ArrayList<>();
      for (int i = 0; i < Math.min(
        Math.max(inet4Addresses.size(), inet6Addresses.size()),
        MAX_ADDRESSES / 2
      ); i++) {
        if (inet6Addresses.size() > i) zippedAddresses.add(inet6Addresses.get(i));
        if (inet4Addresses.size() > i) zippedAddresses.add(inet4Addresses.get(i));
      }

      return zippedAddresses;
    }
  }

  private final class SelectConnectionOnAcquire extends EventListener {
    private final int mConnectionIndex;

    SelectConnectionOnAcquire(int connectionIndex) {
      mConnectionIndex = connectionIndex;
    }

    @Override
    public void connectStart(@NonNull Call call, @NonNull InetSocketAddress inetSocketAddress, @NonNull Proxy proxy) {
      // combat runnable race conditions
      if (mSelectedConnectionIndex.get() != INITIAL_SELECTED_CONNECTION_INDEX) {
        call.cancel();
      }
    }

    @Override
    public void connectionAcquired(@NonNull Call call, @NonNull Connection connection) {
      boolean isSelectedConnection =
        mSelectedConnectionIndex.compareAndSet(INITIAL_SELECTED_CONNECTION_INDEX, mConnectionIndex);

      if (isSelectedConnection) {
        mHandler.removeCallbacks(mNextRequest);

        for (int i = 0; i < MAX_ADDRESSES; i++) {
          if (i == mConnectionIndex) {
            continue;
          }

          Call other = mCalls.get(i);
          if (other != null) {
            other.cancel();
          }
        }
      }
    }
  }
}
