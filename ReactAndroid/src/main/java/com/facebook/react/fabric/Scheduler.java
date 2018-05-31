package com.facebook.react.fabric;

/**
 * This class allows Native code to schedule work in JS.
 * Work (following JS naming) represents a task that needs to be executed in JS.
 *
 * Four types of work are supported by this class:
 *
 * Synchronous:
 *  - Sync work                   -> flushSync
 *  - Work work                   -> flushSerial
 *
 * Asynchronous:
 *  - Interactive work (serial):  -> scheduleSerial
 *  - Deferred work:              -> scheduleWork
 */
public class Scheduler {

  public Scheduler() {
  }

  public void scheduleWork(Work work) {
    // TODO T26717866 this method needs to be implemented. The current implementation is just for
    // testing purpose.
    work.run();
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
}
