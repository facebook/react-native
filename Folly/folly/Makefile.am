if FOLLY_TESTMAIN
SUBDIRS = . experimental init test
else
SUBDIRS = . test
endif

ACLOCAL_AMFLAGS = -I m4

CLEANFILES =


noinst_PROGRAMS = generate_fingerprint_tables
generate_fingerprint_tables_SOURCES = build/GenerateFingerprintTables.cpp
generate_fingerprint_tables_LDADD = libfollybase.la

noinst_LTLIBRARIES = \
	libfollybasesse42.la \
	libfollybase.la

lib_LTLIBRARIES = \
	libfolly.la \
	libfollybenchmark.la

follyincludedir = $(includedir)/folly

nobase_follyinclude_HEADERS = \
	ApplyTuple.h \
	Arena.h \
	Arena-inl.h \
	Array.h \
	Assume.h \
	AtomicBitSet.h \
	AtomicHashArray.h \
	AtomicHashArray-inl.h \
	AtomicHashMap.h \
	AtomicHashMap-inl.h \
	AtomicIntrusiveLinkedList.h \
	AtomicLinkedList.h \
	AtomicStruct.h \
	AtomicUnorderedMap.h \
	Baton.h \
	Benchmark.h \
	Bits.h \
	CachelinePadded.h \
	CallOnce.h \
	Checksum.h \
	Chrono.h \
	ClockGettimeWrappers.h \
	ConcurrentSkipList.h \
	ConcurrentSkipList-inl.h \
	ContainerTraits.h \
	Conv.h \
	CppAttributes.h \
	CpuId.h \
	CPortability.h \
	detail/AtomicHashUtils.h \
	detail/AtomicUnorderedMapUtils.h \
	detail/BitIteratorDetail.h \
	detail/BitsDetail.h \
	detail/CacheLocality.h \
	detail/CachelinePaddedImpl.h \
	detail/ChecksumDetail.h \
	detail/DiscriminatedPtrDetail.h \
	detail/FileUtilDetail.h \
	detail/FingerprintPolynomial.h \
	detail/Futex.h \
	detail/GroupVarintDetail.h \
	detail/IPAddress.h \
	detail/IPAddressSource.h \
	detail/Malloc.h \
	detail/MemoryIdler.h \
	detail/MPMCPipelineDetail.h \
	detail/RangeCommon.h \
	detail/RangeSse42.h \
	detail/Sleeper.h \
	detail/SlowFingerprint.h \
	detail/SocketFastOpen.h \
	detail/SpinLockImpl.h \
	detail/StaticSingletonManager.h \
	detail/Stats.h \
	detail/ThreadLocalDetail.h \
	detail/TryDetail.h \
	detail/TurnSequencer.h \
	detail/UncaughtExceptionCounter.h \
	Demangle.h \
	DiscriminatedPtr.h \
	DynamicConverter.h \
	dynamic.h \
	dynamic-inl.h \
	Enumerate.h \
	EvictingCacheMap.h \
	Exception.h \
	ExceptionString.h \
	ExceptionWrapper.h \
	Executor.h \
	Expected.h \
	experimental/AsymmetricMemoryBarrier.h \
	experimental/AutoTimer.h \
	experimental/Bits.h \
	experimental/BitVectorCoding.h \
	experimental/DynamicParser.h \
	experimental/DynamicParser-inl.h \
	experimental/ExecutionObserver.h \
	experimental/EliasFanoCoding.h \
	experimental/EnvUtil.h \
	experimental/EventCount.h \
	experimental/Instructions.h \
	experimental/bser/Bser.h \
	experimental/FunctionScheduler.h \
	experimental/FutureDAG.h \
	experimental/io/FsUtil.h \
	experimental/JemallocNodumpAllocator.h \
	experimental/JSONSchema.h \
	experimental/LockFreeRingBuffer.h \
	experimental/NestedCommandLineApp.h \
	experimental/observer/detail/Core.h \
	experimental/observer/detail/GraphCycleDetector.h \
	experimental/observer/detail/ObserverManager.h \
	experimental/observer/detail/Observer-pre.h \
	experimental/observer/Observable.h \
	experimental/observer/Observable-inl.h \
	experimental/observer/Observer.h \
	experimental/observer/Observer-inl.h \
	experimental/observer/SimpleObservable.h \
	experimental/observer/SimpleObservable-inl.h \
	experimental/ProgramOptions.h \
	experimental/ReadMostlySharedPtr.h \
	experimental/symbolizer/Elf.h \
	experimental/symbolizer/Elf-inl.h \
	experimental/symbolizer/ElfCache.h \
	experimental/symbolizer/Dwarf.h \
	experimental/symbolizer/LineReader.h \
	experimental/symbolizer/SignalHandler.h \
	experimental/symbolizer/StackTrace.h \
	experimental/symbolizer/Symbolizer.h \
	experimental/Select64.h \
	experimental/StringKeyedCommon.h \
	experimental/StringKeyedMap.h \
	experimental/StringKeyedSet.h \
	experimental/StringKeyedUnorderedMap.h \
	experimental/StringKeyedUnorderedSet.h \
	experimental/TestUtil.h \
	experimental/TLRefCount.h \
	experimental/TupleOps.h \
	FBString.h \
	FBVector.h \
	File.h \
	FileUtil.h \
	Fingerprint.h \
	FixedString.h \
	folly-config.h \
	Foreach.h \
	FormatArg.h \
	FormatTraits.h \
	Format.h \
	Format-inl.h \
	futures/Barrier.h \
	futures/DrivableExecutor.h \
	futures/Future-pre.h \
	futures/helpers.h \
	futures/Future.h \
	futures/Future-inl.h \
	futures/FutureException.h \
	futures/FutureSplitter.h \
	futures/InlineExecutor.h \
	futures/ManualExecutor.h \
	futures/OpaqueCallbackShunt.h \
	futures/Promise-inl.h \
	futures/Promise.h \
	futures/QueuedImmediateExecutor.h \
	futures/ScheduledExecutor.h \
	futures/SharedPromise.h \
	futures/SharedPromise-inl.h \
	futures/ThreadWheelTimekeeper.h \
	futures/Timekeeper.h \
	futures/detail/Core.h \
	futures/detail/FSM.h \
	futures/detail/Types.h \
	gen/Base.h \
	gen/Base-inl.h \
	gen/Combine.h \
	gen/Combine-inl.h \
	gen/Core.h \
	gen/Core-inl.h \
	gen/File.h \
	gen/File-inl.h \
	gen/Parallel.h \
	gen/Parallel-inl.h \
	gen/ParallelMap.h \
	gen/ParallelMap-inl.h \
	gen/String.h \
	gen/String-inl.h \
	GroupVarint.h \
	Hash.h \
	IPAddress.h \
	IPAddressV4.h \
	IPAddressV6.h \
	IPAddressException.h \
	Indestructible.h \
	IndexedMemPool.h \
	init/Init.h \
	IntrusiveList.h \
	io/Compression.h \
	io/Cursor.h \
	io/Cursor-inl.h \
	io/IOBuf.h \
	io/IOBufQueue.h \
	io/RecordIO.h \
	io/RecordIO-inl.h \
	io/TypedIOBuf.h \
	io/ShutdownSocketSet.h \
	io/async/AsyncPipe.h \
	io/async/AsyncTimeout.h \
	io/async/AsyncTransport.h \
	io/async/AsyncUDPServerSocket.h \
	io/async/AsyncUDPSocket.h \
	io/async/AsyncServerSocket.h \
	io/async/AsyncSignalHandler.h \
	io/async/AsyncSocket.h \
	io/async/AsyncSocketBase.h \
	io/async/AsyncSSLSocket.h \
	io/async/AsyncSocketException.h \
	io/async/DecoratedAsyncTransportWrapper.h \
	io/async/DelayedDestructionBase.h \
	io/async/DelayedDestruction.h \
	io/async/EventBase.h \
	io/async/EventBaseLocal.h \
	io/async/EventBaseManager.h \
	io/async/EventBaseThread.h \
	io/async/EventFDWrapper.h \
	io/async/EventHandler.h \
	io/async/EventUtil.h \
	io/async/NotificationQueue.h \
	io/async/HHWheelTimer.h \
	io/async/ssl/OpenSSLPtrTypes.h \
	io/async/ssl/OpenSSLUtils.h \
	io/async/ssl/SSLErrors.h \
	io/async/ssl/TLSDefinitions.h \
	io/async/Request.h \
	io/async/SSLContext.h \
	io/async/ScopedEventBaseThread.h \
	io/async/TimeoutManager.h \
	io/async/VirtualEventBase.h \
	io/async/WriteChainAsyncTransportWrapper.h \
	io/async/test/AsyncSSLSocketTest.h \
	io/async/test/AsyncSocketTest2.h \
	io/async/test/BlockingSocket.h \
	io/async/test/MockAsyncSocket.h \
	io/async/test/MockAsyncServerSocket.h \
	io/async/test/MockAsyncSSLSocket.h \
	io/async/test/MockAsyncTransport.h \
	io/async/test/MockAsyncUDPSocket.h \
	io/async/test/MockTimeoutManager.h \
	io/async/test/ScopedBoundPort.h \
	io/async/test/SocketPair.h \
	io/async/test/TestSSLServer.h \
	io/async/test/TimeUtil.h \
	io/async/test/UndelayedDestruction.h \
	io/async/test/Util.h \
	json.h \
	Lazy.h \
	LifoSem.h \
	Likely.h \
	LockTraits.h \
	LockTraitsBoost.h \
	Logging.h \
	MacAddress.h \
	MallctlHelper.h \
	Malloc.h \
	MapUtil.h \
	Math.h \
	Memory.h \
	MemoryMapping.h \
	MicroSpinLock.h \
	MicroLock.h \
	MoveWrapper.h \
	MPMCPipeline.h \
	MPMCQueue.h \
	Optional.h \
	PackedSyncPtr.h \
	Padded.h \
	Partial.h \
	PicoSpinLock.h \
	Portability.h \
	portability/Asm.h \
	portability/Atomic.h \
	portability/BitsFunctexcept.h \
	portability/Builtins.h \
	portability/Config.h \
	portability/Constexpr.h \
	portability/Dirent.h \
	portability/Event.h \
	portability/Fcntl.h \
	portability/GFlags.h \
	portability/GMock.h \
	portability/GTest.h \
	portability/IOVec.h \
	portability/Libgen.h \
	portability/Malloc.h \
	portability/Math.h \
	portability/Memory.h \
	portability/OpenSSL.h \
	portability/PThread.h \
	portability/Sockets.h \
	portability/Stdio.h \
	portability/Stdlib.h \
	portability/String.h \
	portability/Syslog.h \
	portability/SysFile.h \
	portability/SysMembarrier.h \
	portability/SysMman.h \
	portability/SysResource.h \
	portability/SysStat.h \
	portability/SysSyscall.h \
	portability/SysTime.h \
	portability/SysTypes.h \
	portability/SysUio.h \
	portability/Time.h \
	portability/TypeTraits.h \
	portability/Windows.h \
	portability/Unistd.h \
	Preprocessor.h \
	PriorityMPMCQueue.h \
	ProducerConsumerQueue.h \
	Random.h \
	Random-inl.h \
	Range.h \
	RWSpinLock.h \
	SafeAssert.h \
	ScopeGuard.h \
	SharedMutex.h \
	Shell.h \
	Singleton.h \
	Singleton-inl.h \
	SingletonThreadLocal.h \
	SmallLocks.h \
	small_vector.h \
	SocketAddress.h \
	sorted_vector_types.h \
	SparseByteSet.h \
	SpinLock.h \
	SpookyHashV1.h \
	SpookyHashV2.h \
	ssl/OpenSSLCertUtils.h \
	ssl/OpenSSLHash.h \
	ssl/OpenSSLVersionFinder.h \
	ssl/SSLSession.h \
	ssl/detail/SSLSessionImpl.h \
	stats/BucketedTimeSeries-defs.h \
	stats/BucketedTimeSeries.h \
	stats/Histogram-defs.h \
	stats/Histogram.h \
	stats/MultiLevelTimeSeries-defs.h \
	stats/MultiLevelTimeSeries.h \
	stats/TimeseriesHistogram-defs.h \
	stats/TimeseriesHistogram.h \
	stop_watch.h \
	String.h \
	String-inl.h \
	Subprocess.h \
	Synchronized.h \
	test/FBStringTestBenchmarks.cpp.h \
	test/FBVectorTestBenchmarks.cpp.h \
	test/function_benchmark/benchmark_impl.h \
	test/function_benchmark/test_functions.h \
	test/SynchronizedTestLib.h \
	test/SynchronizedTestLib-inl.h \
	test/TestUtils.h \
	ThreadCachedArena.h \
	ThreadCachedInt.h \
	ThreadId.h \
	ThreadLocal.h \
	ThreadName.h \
	TimeoutQueue.h \
	TokenBucket.h \
	tracing/StaticTracepoint.h \
	Traits.h \
	Try-inl.h \
	Try.h \
	Unicode.h \
	Function.h \
	UncaughtExceptions.h \
	Unit.h \
	Uri.h \
	Uri-inl.h \
	Utility.h \
	Varint.h \
	VersionCheck.h

FormatTables.cpp: build/generate_format_tables.py
	$(PYTHON) build/generate_format_tables.py
CLEANFILES += FormatTables.cpp

EscapeTables.cpp: build/generate_escape_tables.py
	$(PYTHON) build/generate_escape_tables.py
CLEANFILES += EscapeTables.cpp

GroupVarintTables.cpp: build/generate_varint_tables.py
	$(PYTHON) build/generate_varint_tables.py
CLEANFILES += GroupVarintTables.cpp

libfollybasesse42_la_SOURCES = \
	detail/RangeSse42.cpp

libfollybase_la_SOURCES = \
	Conv.cpp \
	Demangle.cpp \
	detail/RangeCommon.cpp \
	EscapeTables.cpp \
	Format.cpp \
	FormatTables.cpp \
	MallctlHelper.cpp \
	portability/BitsFunctexcept.cpp \
	StringBase.cpp \
	String.cpp \
	Unicode.cpp

libfolly_la_SOURCES = \
	Assume.cpp \
	Bits.cpp \
	Checksum.cpp \
	ClockGettimeWrappers.cpp \
	detail/CacheLocality.cpp \
	detail/IPAddress.cpp \
	dynamic.cpp \
	ExceptionWrapper.cpp \
	Executor.cpp \
	File.cpp \
	FileUtil.cpp \
	FingerprintTables.cpp \
	futures/Barrier.cpp \
	futures/Future.cpp \
	futures/InlineExecutor.cpp \
	futures/ManualExecutor.cpp \
	futures/QueuedImmediateExecutor.cpp \
	futures/ThreadWheelTimekeeper.cpp \
	detail/Futex.cpp \
	detail/StaticSingletonManager.cpp \
	detail/ThreadLocalDetail.cpp \
	GroupVarint.cpp \
	GroupVarintTables.cpp \
	IPAddress.cpp \
	IPAddressV4.cpp \
	IPAddressV6.cpp \
	LifoSem.cpp \
	init/Init.cpp \
	io/Compression.cpp \
	io/Cursor.cpp \
	io/IOBuf.cpp \
	io/IOBufQueue.cpp \
	io/RecordIO.cpp \
	io/ShutdownSocketSet.cpp \
	io/async/AsyncPipe.cpp \
	io/async/AsyncTimeout.cpp \
	io/async/AsyncUDPSocket.cpp \
	io/async/AsyncServerSocket.cpp \
	io/async/AsyncSignalHandler.cpp \
	io/async/AsyncSocket.cpp \
	io/async/AsyncSSLSocket.cpp \
	io/async/EventBase.cpp \
	io/async/EventBaseLocal.cpp \
	io/async/EventBaseManager.cpp \
	io/async/EventBaseThread.cpp \
	io/async/EventHandler.cpp \
	io/async/Request.cpp \
	io/async/SSLContext.cpp \
	io/async/ScopedEventBaseThread.cpp \
	io/async/VirtualEventBase.cpp \
	io/async/HHWheelTimer.cpp \
	io/async/TimeoutManager.cpp \
	io/async/test/ScopedBoundPort.cpp \
	io/async/test/SocketPair.cpp \
	io/async/test/TimeUtil.cpp \
	io/async/ssl/OpenSSLUtils.cpp \
	io/async/ssl/SSLErrors.cpp \
	json.cpp \
	detail/MemoryIdler.cpp \
	detail/SocketFastOpen.cpp \
	MacAddress.cpp \
	MemoryMapping.cpp \
	portability/Dirent.cpp \
	portability/Fcntl.cpp \
	portability/Libgen.cpp \
	portability/Malloc.cpp \
	portability/Memory.cpp \
	portability/OpenSSL.cpp \
	portability/Sockets.cpp \
	portability/Stdio.cpp \
	portability/Stdlib.cpp \
	portability/String.cpp \
	portability/SysFile.cpp \
	portability/SysMembarrier.cpp \
	portability/SysMman.cpp \
	portability/SysResource.cpp \
	portability/SysStat.cpp \
	portability/SysTime.cpp \
	portability/SysUio.cpp \
	portability/Time.cpp \
	portability/Unistd.cpp \
	Random.cpp \
	SafeAssert.cpp \
	ScopeGuard.cpp \
	SharedMutex.cpp \
	Shell.cpp \
	MicroLock.cpp \
	Singleton.cpp \
	SocketAddress.cpp \
	SpookyHashV1.cpp \
	SpookyHashV2.cpp \
	ssl/OpenSSLCertUtils.cpp \
	ssl/OpenSSLHash.cpp \
	ssl/detail/SSLSessionImpl.cpp \
	stats/Instantiations.cpp \
	Subprocess.cpp \
	ThreadCachedArena.cpp \
	TimeoutQueue.cpp \
	Uri.cpp \
	Version.cpp \
	experimental/AsymmetricMemoryBarrier.cpp \
	experimental/bser/Dump.cpp \
	experimental/bser/Load.cpp \
	experimental/DynamicParser.cpp \
	experimental/EnvUtil.cpp \
	experimental/FunctionScheduler.cpp \
	experimental/io/FsUtil.cpp \
	experimental/JemallocNodumpAllocator.cpp \
	experimental/JSONSchema.cpp \
	experimental/NestedCommandLineApp.cpp \
	experimental/observer/detail/Core.cpp \
	experimental/observer/detail/ObserverManager.cpp \
	experimental/ProgramOptions.cpp \
	experimental/Select64.cpp \
	experimental/TestUtil.cpp

if HAVE_LINUX
nobase_follyinclude_HEADERS += \
	experimental/io/HugePages.h
libfolly_la_SOURCES += \
	experimental/io/HugePages.cpp
endif

if !HAVE_WEAK_SYMBOLS
libfollybase_la_SOURCES += detail/MallocImpl.cpp
endif

if HAVE_BOOST_CONTEXT
nobase_follyinclude_HEADERS += \
	fibers/AddTasks.h \
	fibers/AddTasks-inl.h \
	fibers/AtomicBatchDispatcher.h \
	fibers/AtomicBatchDispatcher-inl.h \
	fibers/Baton.h \
	fibers/Baton-inl.h \
	fibers/BatchDispatcher.h \
	fibers/BoostContextCompatibility.h \
	fibers/detail/AtomicBatchDispatcher.h \
	fibers/EventBaseLoopController.h \
	fibers/EventBaseLoopController-inl.h \
	fibers/Fiber.h \
	fibers/Fiber-inl.h \
	fibers/FiberManager.h \
	fibers/FiberManager-inl.h \
	fibers/FiberManagerInternal.h \
	fibers/FiberManagerInternal-inl.h \
	fibers/FiberManagerMap.h \
	fibers/ForEach.h \
	fibers/ForEach-inl.h \
	fibers/GenericBaton.h \
	fibers/GuardPageAllocator.h \
	fibers/LoopController.h \
	fibers/Promise.h \
	fibers/Promise-inl.h \
	fibers/Semaphore.h \
	fibers/SimpleLoopController.h \
	fibers/TimedMutex.h \
	fibers/TimedMutex-inl.h \
	fibers/TimeoutController.h \
	fibers/traits.h \
	fibers/WhenN.h \
	fibers/WhenN-inl.h

libfolly_la_SOURCES += \
	fibers/Baton.cpp \
	fibers/detail/AtomicBatchDispatcher.cpp \
	fibers/Fiber.cpp \
	fibers/FiberManager.cpp \
	fibers/FiberManagerMap.cpp \
	fibers/GuardPageAllocator.cpp \
	fibers/Semaphore.cpp \
	fibers/TimeoutController.cpp
endif

libfollybasesse42_la_LDFLAGS = $(AM_LDFLAGS) -version-info $(LT_VERSION)
libfollybasesse42_la_CXXFLAGS = -msse4.2

libfollybase_la_LIBADD = libfollybasesse42.la
libfollybase_la_LDFLAGS = $(AM_LDFLAGS) -version-info $(LT_VERSION)

libfolly_la_LIBADD = libfollybase.la
libfolly_la_LDFLAGS = $(AM_LDFLAGS) -version-info $(LT_VERSION) -lssl

FingerprintTables.cpp: generate_fingerprint_tables
	./generate_fingerprint_tables
CLEANFILES += FingerprintTables.cpp

libfollybenchmark_la_SOURCES = Benchmark.cpp
libfollybenchmark_la_LIBADD = libfolly.la
libfollybenchmark_la_LDFLAGS = $(AM_LDFLAGS) -version-info $(LT_VERSION)

# install pkg-config metadata file
pkgconfigdir = $(libdir)/pkgconfig
nodist_pkgconfig_DATA = libfolly.pc
