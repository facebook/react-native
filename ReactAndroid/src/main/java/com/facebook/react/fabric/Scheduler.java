package com.facebook.react.fabric;

import android.util.Log;
import com.facebook.react.bridge.ReactContext;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * This class allows Native code to schedule work in JS.
 * Work (following JS naming) represents a task that needs to be executed in JS.
 *
 * Four types of work are supported by this class:
 *
 * Synchronous:
 * - Sync work                   -> flushSync()
 * - Work work                   -> flushSerial()
 *
 * Asynchronous:
 * - Interactive work (serial):  -> scheduleSerial()
 * - Deferred work:              -> scheduleWork()
 *
 */
public class Scheduler {

  private static final String TAG = Scheduler.class.getSimpleName();
  // The usage of this executor might change in the near future.
  private final ExecutorService mExecutor = new ThreadPoolExecutor(1, 1, 0L, TimeUnit.MILLISECONDS, new LinkedBlockingDeque<Runnable>());
  private final ReactContext mReactContext;

  public Scheduler(ReactContext reactContext) {
    mReactContext = reactContext;
  }

  /**
   * This method schedules work to be executed with the lowest priority in the JS Thread.
   *
   * The current implementation queues "work"s in an unbounded queue tight to a SingleThreadExecutor.
   * Work objects are going to be submitted one-by-one at the end of the JS Queue Thread.
   *
   * Notice that the current implementation might experience some delays in JS work execution,
   * depending on the size of the JS Queue and the time it takes to execute each work in JS.
   *
   * TODO: This implementation is very likely to change in the near future.
   */
  public void scheduleWork(final Work work) {
    try {
      mExecutor.execute(new Runnable() {
        @Override
        public void run() {
          mReactContext.runOnJSQueueThread(new Runnable() {
            @Override
            public void run() {
              try {
                work.run();
              } catch (Exception ex) {
                Log.w(TAG, "Exception running work in JS.", ex);
                throw ex;
              }
            }
          });
        }
      });
    } catch (RejectedExecutionException ex) {
      // This can happen if a Work is scheduled when the Scheduler is being shutdown.
      // For now, we log and do not take any action.
      Log.i(TAG, "Unable to schedule task.");
    }
  }

  public void flushSync(Work work) {
    // TODO T26717866 this method needs to be implemented. The current implementation is just for
    // testing purpose.
  }

  public void flushSerial(Work work) {
    // TODO T26717866 this method needs to be implemented. The current implementation is just for
    // testing purpose.
  }

  public void scheduleSerial(Work work) {
    // TODO T26717866 this method needs to be implemented. The current implementation is just for
    // testing purpose.
  }

  /**
   * Shutdowns the {@link Scheduler}. this operation will attempt to stop all "active executing"
   * Works items and it will "halts:" all the Works items waiting to be executed.
   */
  public void shutdown() {
    mExecutor.shutdownNow();
  }
}
