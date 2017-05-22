package com.facebook.react.bridge.queue;

import android.os.Looper;

/**
 * Created by xt on 2017/5/22.
 */

public class MessageQueueHandlerThread extends Thread {
  private Looper mLooper;

  public MessageQueueHandlerThread(String name, long stackSize) {
    super(null, null, name, stackSize);
  }

  protected void onLooperPrepared() {
  }

  @Override
  public void run() {
    Looper.prepare();
    synchronized (this) {
      mLooper = Looper.myLooper();
      notifyAll();
    }
    onLooperPrepared();
    Looper.loop();
  }


  public Looper getLooper() {
    if (!isAlive()) {
      return null;
    }

    synchronized (this) {
      while (isAlive() && mLooper == null) {
        try {
          wait();
        } catch (InterruptedException e) {
        }
      }
    }
    return mLooper;
  }
}
