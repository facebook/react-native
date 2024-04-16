/*
 * Written by Doug Lea with assistance from members of JCP JSR-166
 * Expert Group and released to the public domain, as explained at
 * http://creativecommons.org/publicdomain/zero/1.0/
 */

// This is based on 1.5 version.

package com.concurrent_ruby.ext.jsr166e.nounsafe;

import java.util.Random;
import java.util.concurrent.atomic.AtomicIntegerFieldUpdater;
import java.util.concurrent.atomic.AtomicLongFieldUpdater;

/**
 * A package-local class holding common representation and mechanics
 * for classes supporting dynamic striping on 64bit values. The class
 * extends Number so that concrete subclasses must publicly do so.
 */
abstract class Striped64 extends Number {
    /*
     * This class maintains a lazily-initialized table of atomically
     * updated variables, plus an extra "base" field. The table size
     * is a power of two. Indexing uses masked per-thread hash codes.
     * Nearly all declarations in this class are package-private,
     * accessed directly by subclasses.
     *
     * Table entries are of class Cell; a variant of AtomicLong padded
     * to reduce cache contention on most processors. Padding is
     * overkill for most Atomics because they are usually irregularly
     * scattered in memory and thus don't interfere much with each
     * other. But Atomic objects residing in arrays will tend to be
     * placed adjacent to each other, and so will most often share
     * cache lines (with a huge negative performance impact) without
     * this precaution.
     *
     * In part because Cells are relatively large, we avoid creating
     * them until they are needed.  When there is no contention, all
     * updates are made to the base field.  Upon first contention (a
     * failed CAS on base update), the table is initialized to size 2.
     * The table size is doubled upon further contention until
     * reaching the nearest power of two greater than or equal to the
     * number of CPUS. Table slots remain empty (null) until they are
     * needed.
     *
     * A single spinlock ("busy") is used for initializing and
     * resizing the table, as well as populating slots with new Cells.
     * There is no need for a blocking lock: When the lock is not
     * available, threads try other slots (or the base).  During these
     * retries, there is increased contention and reduced locality,
     * which is still better than alternatives.
     *
     * Per-thread hash codes are initialized to random values.
     * Contention and/or table collisions are indicated by failed
     * CASes when performing an update operation (see method
     * retryUpdate). Upon a collision, if the table size is less than
     * the capacity, it is doubled in size unless some other thread
     * holds the lock. If a hashed slot is empty, and lock is
     * available, a new Cell is created. Otherwise, if the slot
     * exists, a CAS is tried.  Retries proceed by "double hashing",
     * using a secondary hash (Marsaglia XorShift) to try to find a
     * free slot.
     *
     * The table size is capped because, when there are more threads
     * than CPUs, supposing that each thread were bound to a CPU,
     * there would exist a perfect hash function mapping threads to
     * slots that eliminates collisions. When we reach capacity, we
     * search for this mapping by randomly varying the hash codes of
     * colliding threads.  Because search is random, and collisions
     * only become known via CAS failures, convergence can be slow,
     * and because threads are typically not bound to CPUS forever,
     * may not occur at all. However, despite these limitations,
     * observed contention rates are typically low in these cases.
     *
     * It is possible for a Cell to become unused when threads that
     * once hashed to it terminate, as well as in the case where
     * doubling the table causes no thread to hash to it under
     * expanded mask.  We do not try to detect or remove such cells,
     * under the assumption that for long-running instances, observed
     * contention levels will recur, so the cells will eventually be
     * needed again; and for short-lived ones, it does not matter.
     */

    /**
     * Padded variant of AtomicLong supporting only raw accesses plus CAS.
     * The value field is placed between pads, hoping that the JVM doesn't
     * reorder them.
     *
     * JVM intrinsics note: It would be possible to use a release-only
     * form of CAS here, if it were provided.
     */
    static final class Cell {
        volatile long p0, p1, p2, p3, p4, p5, p6;
        volatile long value;
        volatile long q0, q1, q2, q3, q4, q5, q6;

        static AtomicLongFieldUpdater<Cell> VALUE_UPDATER = AtomicLongFieldUpdater.newUpdater(Cell.class, "value");

        Cell(long x) { value = x; }

        final boolean cas(long cmp, long val) {
            return VALUE_UPDATER.compareAndSet(this, cmp, val);
        }

    }

    /**
     * Holder for the thread-local hash code. The code is initially
     * random, but may be set to a different value upon collisions.
     */
    static final class HashCode {
        static final Random rng = new Random();
        int code;
        HashCode() {
            int h = rng.nextInt(); // Avoid zero to allow xorShift rehash
            code = (h == 0) ? 1 : h;
        }
    }

    /**
     * The corresponding ThreadLocal class
     */
    static final class ThreadHashCode extends ThreadLocal<HashCode> {
        public HashCode initialValue() { return new HashCode(); }
    }

    /**
     * Static per-thread hash codes. Shared across all instances to
     * reduce ThreadLocal pollution and because adjustments due to
     * collisions in one table are likely to be appropriate for
     * others.
     */
    static final ThreadHashCode threadHashCode = new ThreadHashCode();

    /** Number of CPUS, to place bound on table size */
    static final int NCPU = Runtime.getRuntime().availableProcessors();

    /**
     * Table of cells. When non-null, size is a power of 2.
     */
    transient volatile Cell[] cells;

    /**
     * Base value, used mainly when there is no contention, but also as
     * a fallback during table initialization races. Updated via CAS.
     */
    transient volatile long base;

    /**
     * Spinlock (locked via CAS) used when resizing and/or creating Cells.
     */
    transient volatile int busy;

    AtomicLongFieldUpdater<Striped64>    BASE_UPDATER = AtomicLongFieldUpdater.newUpdater(Striped64.class, "base");
    AtomicIntegerFieldUpdater<Striped64> BUSY_UPDATER = AtomicIntegerFieldUpdater.newUpdater(Striped64.class, "busy");

    /**
     * Package-private default constructor
     */
    Striped64() {
    }

    /**
     * CASes the base field.
     */
    final boolean casBase(long cmp, long val) {
        return BASE_UPDATER.compareAndSet(this, cmp, val);
    }

    /**
     * CASes the busy field from 0 to 1 to acquire lock.
     */
    final boolean casBusy() {
        return BUSY_UPDATER.compareAndSet(this, 0, 1);
    }

    /**
     * Computes the function of current and new value. Subclasses
     * should open-code this update function for most uses, but the
     * virtualized form is needed within retryUpdate.
     *
     * @param currentValue the current value (of either base or a cell)
     * @param newValue the argument from a user update call
     * @return result of the update function
     */
    abstract long fn(long currentValue, long newValue);

    /**
     * Handles cases of updates involving initialization, resizing,
     * creating new Cells, and/or contention. See above for
     * explanation. This method suffers the usual non-modularity
     * problems of optimistic retry code, relying on rechecked sets of
     * reads.
     *
     * @param x the value
     * @param hc the hash code holder
     * @param wasUncontended false if CAS failed before call
     */
    final void retryUpdate(long x, HashCode hc, boolean wasUncontended) {
        int h = hc.code;
        boolean collide = false;                // True if last slot nonempty
        for (;;) {
            Cell[] as; Cell a; int n; long v;
            if ((as = cells) != null && (n = as.length) > 0) {
                if ((a = as[(n - 1) & h]) == null) {
                    if (busy == 0) {            // Try to attach new Cell
                        Cell r = new Cell(x);   // Optimistically create
                        if (busy == 0 && casBusy()) {
                            boolean created = false;
                            try {               // Recheck under lock
                                Cell[] rs; int m, j;
                                if ((rs = cells) != null &&
                                        (m = rs.length) > 0 &&
                                        rs[j = (m - 1) & h] == null) {
                                    rs[j] = r;
                                    created = true;
                                }
                            } finally {
                                busy = 0;
                            }
                            if (created)
                                break;
                            continue;           // Slot is now non-empty
                        }
                    }
                    collide = false;
                }
                else if (!wasUncontended)       // CAS already known to fail
                    wasUncontended = true;      // Continue after rehash
                else if (a.cas(v = a.value, fn(v, x)))
                    break;
                else if (n >= NCPU || cells != as)
                    collide = false;            // At max size or stale
                else if (!collide)
                    collide = true;
                else if (busy == 0 && casBusy()) {
                    try {
                        if (cells == as) {      // Expand table unless stale
                            Cell[] rs = new Cell[n << 1];
                            for (int i = 0; i < n; ++i)
                                rs[i] = as[i];
                            cells = rs;
                        }
                    } finally {
                        busy = 0;
                    }
                    collide = false;
                    continue;                   // Retry with expanded table
                }
                h ^= h << 13;                   // Rehash
                h ^= h >>> 17;
                h ^= h << 5;
            }
            else if (busy == 0 && cells == as && casBusy()) {
                boolean init = false;
                try {                           // Initialize table
                    if (cells == as) {
                        Cell[] rs = new Cell[2];
                        rs[h & 1] = new Cell(x);
                        cells = rs;
                        init = true;
                    }
                } finally {
                    busy = 0;
                }
                if (init)
                    break;
            }
            else if (casBase(v = base, fn(v, x)))
                break;                          // Fall back on using base
        }
        hc.code = h;                            // Record index for next time
    }


    /**
     * Sets base and all cells to the given value.
     */
    final void internalReset(long initialValue) {
        Cell[] as = cells;
        base = initialValue;
        if (as != null) {
            int n = as.length;
            for (int i = 0; i < n; ++i) {
                Cell a = as[i];
                if (a != null)
                    a.value = initialValue;
            }
        }
    }
}
