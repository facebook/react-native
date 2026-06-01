/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import org.junit.Assume

/**
 * Thin wrapper over HotSpot's `com.sun.management.ThreadMXBean` and the JMX memory pool API to
 * give performance tests a uniform way to measure:
 *  * **allocated bytes** per thread (cumulative, GC-independent) — the right metric for streaming
 *    code.
 *  * **peak heap usage** across all heap pools (coarse upper bound; affected by GC timing).
 *
 * Everything is accessed via reflection because Android's `android.jar` (used to compile
 * library unit tests) strips the `java.lang.management` package. At runtime the host HotSpot
 * JVM provides the full implementation.
 */
internal object AllocationProbe {

  // --- Thread allocation (com.sun.management.ThreadMXBean) ---------------------------------
  private val threadMxBean: Any?
  private val getThreadAllocatedBytesSingle: java.lang.reflect.Method?
  private val getThreadAllocatedBytesBulk: java.lang.reflect.Method?
  private val getAllThreadIds: java.lang.reflect.Method?
  private val setThreadAllocatedMemoryEnabled: java.lang.reflect.Method?
  private val isThreadAllocatedMemorySupported: java.lang.reflect.Method?

  // --- Heap pool peak usage (java.lang.management.MemoryPoolMXBean) ------------------------
  private val heapPools: List<Any>
  private val getPeakUsage: java.lang.reflect.Method?
  private val resetPeakUsage: java.lang.reflect.Method?
  private val memoryUsageGetUsed: java.lang.reflect.Method?

  init {
    val managementFactory = runCatching { Class.forName("java.lang.management.ManagementFactory") }
        .getOrNull()
    val sunThreadMxBeanClass =
        runCatching { Class.forName("com.sun.management.ThreadMXBean") }.getOrNull()
    val threadMxBeanClass =
        runCatching { Class.forName("java.lang.management.ThreadMXBean") }.getOrNull()

    threadMxBean =
        runCatching { managementFactory?.getMethod("getThreadMXBean")?.invoke(null) }
            .getOrNull()
            ?.takeIf { sunThreadMxBeanClass?.isInstance(it) == true }

    getThreadAllocatedBytesSingle =
        sunThreadMxBeanClass?.declaredMethods?.firstOrNull {
          it.name == "getThreadAllocatedBytes" &&
              it.parameterTypes.size == 1 &&
              it.parameterTypes[0] == Long::class.javaPrimitiveType
        }
    getThreadAllocatedBytesBulk =
        sunThreadMxBeanClass?.declaredMethods?.firstOrNull {
          it.name == "getThreadAllocatedBytes" &&
              it.parameterTypes.size == 1 &&
              it.parameterTypes[0] == LongArray::class.java
        }
    getAllThreadIds =
        runCatching { threadMxBeanClass?.getMethod("getAllThreadIds") }.getOrNull()
    setThreadAllocatedMemoryEnabled =
        runCatching {
              sunThreadMxBeanClass?.getMethod(
                  "setThreadAllocatedMemoryEnabled",
                  Boolean::class.javaPrimitiveType,
              )
            }
            .getOrNull()
    isThreadAllocatedMemorySupported =
        runCatching {
              sunThreadMxBeanClass?.getMethod("isThreadAllocatedMemorySupported")
            }
            .getOrNull()

    // Heap pool plumbing.
    val memoryTypeClass = runCatching { Class.forName("java.lang.management.MemoryType") }.getOrNull()
    val heapEnum =
        runCatching { memoryTypeClass?.getField("HEAP")?.get(null) }.getOrNull()
    val memoryPoolMxBeanClass =
        runCatching { Class.forName("java.lang.management.MemoryPoolMXBean") }.getOrNull()
    val getType =
        runCatching { memoryPoolMxBeanClass?.getMethod("getType") }.getOrNull()
    val allPools: List<Any> =
        runCatching {
              @Suppress("UNCHECKED_CAST")
              (managementFactory?.getMethod("getMemoryPoolMXBeans")?.invoke(null) as? List<Any>)
                  ?: emptyList()
            }
            .getOrDefault(emptyList())
    heapPools =
        if (getType != null && heapEnum != null) {
          allPools.filter { runCatching { getType.invoke(it) == heapEnum }.getOrDefault(false) }
        } else emptyList()

    getPeakUsage =
        runCatching { memoryPoolMxBeanClass?.getMethod("getPeakUsage") }.getOrNull()
    resetPeakUsage =
        runCatching { memoryPoolMxBeanClass?.getMethod("resetPeakUsage") }.getOrNull()
    memoryUsageGetUsed =
        runCatching { Class.forName("java.lang.management.MemoryUsage").getMethod("getUsed") }
            .getOrNull()
  }

  /** Skips the calling test if per-thread allocation tracking isn't available. */
  fun requireSupported() {
    Assume.assumeTrue(
        "com.sun.management.ThreadMXBean is unavailable (non-HotSpot JVM?)",
        threadMxBean != null && getThreadAllocatedBytesSingle != null,
    )
    val supported =
        runCatching { isThreadAllocatedMemorySupported?.invoke(threadMxBean) as? Boolean }
            .getOrNull() ?: false
    Assume.assumeTrue("Per-thread allocated memory is not supported on this JVM", supported)
    runCatching { setThreadAllocatedMemoryEnabled?.invoke(threadMxBean, true) }
  }

  /** Cumulative bytes allocated on [threadId] since that thread started, or 0 if unsupported. */
  fun allocatedBytes(threadId: Long): Long =
      runCatching {
            getThreadAllocatedBytesSingle?.invoke(threadMxBean, threadId) as? Long ?: 0L
          }
          .getOrDefault(0L)

  /** Sum of cumulative allocations across every currently live thread. */
  fun totalAllocatedBytes(): Long {
    val bean = threadMxBean ?: return 0L
    val ids = runCatching { getAllThreadIds?.invoke(bean) as? LongArray }.getOrNull() ?: return 0L
    val arr =
        runCatching { getThreadAllocatedBytesBulk?.invoke(bean, ids) as? LongArray }.getOrNull()
            ?: return 0L
    var sum = 0L
    for (v in arr) if (v > 0) sum += v
    return sum
  }

  /** Reset peak heap counters across all heap pools. Call before a measured section. */
  fun resetPeakHeap() {
    val reset = resetPeakUsage ?: return
    heapPools.forEach { runCatching { reset.invoke(it) } }
  }

  /** Peak bytes used across all heap pools since the last [resetPeakHeap]. */
  fun peakHeapBytes(): Long {
    val getUsage = getPeakUsage ?: return 0L
    val getUsed = memoryUsageGetUsed ?: return 0L
    var total = 0L
    for (pool in heapPools) {
      val usage = runCatching { getUsage.invoke(pool) }.getOrNull() ?: continue
      total += runCatching { getUsed.invoke(usage) as? Long ?: 0L }.getOrDefault(0L)
    }
    return total
  }

  /** Encourage the runtime to run a full GC before a measurement. */
  fun settle() {
    System.gc()
    Thread.sleep(50)
    System.gc()
  }

  /** Format a byte count as `12.34 MB`. */
  fun fmt(bytes: Long): String = String.format("%.2f MB", bytes / 1024.0 / 1024.0)
}
