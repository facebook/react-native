# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

folly_release_version = '2021.07.22.00'

Pod::Spec.new do |spec|
  spec.name = 'RCT-Folly'
  # Patched to v2 to address https://github.com/react-native-community/releases/issues/251
  spec.version = folly_release_version
  spec.license = { :type => 'Apache License, Version 2.0' }
  spec.homepage = 'https://github.com/facebook/folly'
  spec.summary = 'An open-source C++ library developed and used at Facebook.'
  spec.authors = 'Facebook'
  spec.source = { :git => 'https://github.com/facebook/folly.git',
                  :tag => "v#{folly_release_version}" }
  spec.module_name = 'folly'
  spec.header_mappings_dir = '.'
  spec.dependency 'boost'
  spec.dependency 'DoubleConversion'
  spec.dependency 'glog'
  spec.dependency 'fmt' , '~> 6.2.1'
  spec.compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_HAVE_PTHREAD=1 -Wno-comma -Wno-shorten-64-to-32 -Wno-documentation -faligned-new'
  spec.source_files = 'folly/dynamic.cpp',
                      'folly/dynamic.h',
                      'folly/dynamic-inl.h',
                      'folly/Conv.cpp',
                      'folly/Conv.h',
                      'folly/json.cpp',
                      'folly/json.h',
                      'folly/Bits.h',
                      'folly/lang/Bits.h',
                      'folly/MoveWrapper.h',
                      'folly/Hash.h',
                      'folly/hash/Hash.h',
                      'folly/container/F14Map.h',
                      'folly/container/F14Set.h',
                      'folly/container/small_vector.h',
                      'folly/Function.h',
                      'folly/Executor.h',
                      'folly/Try.h',
                      'folly/Try-inl.h',
                      'folly/Format.h',
                      'folly/FormatArg.h',
                      'folly/EvictingCacheMap.h',
                      'folly/Expected.h',
                      'folly/CPortability.h',
                      'folly/CppAttributes.h',
                      'folly/Likely.h',
                      'folly/Optional.h',
                      'folly/Portability.h',
                      'folly/Processor.h',
                      'folly/Traits.h',
                      'folly/Unit.h',
                      'folly/Utility.h',
                      'folly/lang/Exception.h',

  # workaround for https://github.com/facebook/react-native/issues/14326
  spec.preserve_paths = 'folly/*.h',
                        'folly/container/*.h',
                        'folly/container/detail/*.h',
                        'folly/detail/*.h',
                        'folly/functional/*.h',
                        'folly/hash/*.h',
                        'folly/lang/*.h',
                        'folly/memory/*.h',
                        'folly/memory/detail/*.h',
                        'folly/net/*.h',
                        'folly/net/detail/*.h',
                        'folly/portability/*.h'
  spec.libraries           = "c++abi" # NOTE Apple-only: Keep c++abi here due to https://github.com/react-native-community/releases/issues/251
  spec.pod_target_xcconfig = { "USE_HEADERMAP" => "NO",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)\" \"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/libevent/include/\" \"$(PODS_ROOT)/fmt/include\"",
                               # In dynamic framework (use_frameworks!) mode, ignore the unused and undefined boost symbols when generating the library.
                               "OTHER_LDFLAGS" => "\"-Wl,-U,_jump_fcontext\" \"-Wl,-U,_make_fcontext\""
                             }

  # TODO: The boost spec should really be selecting these files so that dependents of Folly can also access the required headers.
  spec.user_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"" }

  spec.subspec 'Futures' do |futures|
    futures.dependency 'libevent'
    futures.pod_target_xcconfig = { "HEADER_SEARCH_PATHS" => ["$(inherited)", "$(PODS_ROOT)/Headers/Public/libevent/event"] }
    futures.source_files = 'folly/futures/*.{h,cpp}',
                           'folly/futures/detail/*.{h,cpp}',
                           'folly/executors/*.{h,cpp}',
                           'folly/executors/thread_factory/{NamedThreadFactory,ThreadFactory}.{h,cpp}',
                           'folly/executors/task_queue/{BlockingQueue,UnboundedBlockingQueue,LifoSemMPMCQueue,PriorityUnboundedBlockingQueue,PriorityLifoSemMPMCQueue}.{h,cpp}',
                           'folly/concurrency/*.{h,cpp}',
                           'folly/system/{ThreadId,ThreadName,HardwareConcurrency}.{h,cpp}',
                           'folly/synchronization/*.{h,cpp}',
                           'folly/synchronization/detail/*.{h,cpp}',
                           'folly/Try.cpp',
                           'folly/experimental/{ExecutionObserver,ReadMostlySharedPtr,SingleWriterFixedHashMap,TLRefCount}.{h,cpp}',
                           'folly/io/async/{AtomicNotificationQueue,AtomicNotificationQueue-inl,AsyncTimeout,DelayedDestruction,DelayedDestructionBase,EventBase,EventBaseLocal,EventBaseManager,EventBaseAtomicNotificationQueue,EventBaseAtomicNotificationQueue-inl,EventBaseBackendBase,EventHandler,EventUtil,HHWheelTimer,HHWheelTimer-fwd,NotificationQueue,Request,TimeoutManager,VirtualEventBase}.{h,cpp}',
                           'folly/io/{Cursor,Cursor-inl,IOBuf,IOBufQueue}.{h,cpp}',
                           'folly/tracing/StaticTracepoint.{h,cpp}',
                           'folly/tracing/AsyncStack.{h,cpp}',
                           'folly/tracing/AsyncStack-inl.h',
                           'folly/{Executor,ExceptionString,ExceptionWrapper,ExceptionWrapper-inl,FileUtil,Singleton,SharedMutex}.{h,cpp}',
                           'folly/detail/{AsyncTrace,AtFork,Futex,Futex-inl,MemoryIdler,SingletonStackTrace,StaticSingletonManager,ThreadLocalDetail}.{h,cpp}',
                           'folly/lang/SafeAssert.{h,cpp}',
                           'folly/memory/MallctlHelper.{h,cpp}',
                           'folly/portability/{GFlags,SysUio}.{h,cpp}',
                           'folly/portability/SysMembarrier.cpp',
                           'folly/chrono/Hardware.{h,cpp}',
                           'folly/experimental/coro/Traits.{h,cpp}',
                           'folly/fibers/*.{h,cpp}',
                           'folly/experimental/coro/Coroutine.{h,cpp}',
                           'folly/fibers/Baton-inl.h',
                           'folly/experimental/**/*.h',
                           'folly/system/Pid.{h,cpp}'
                          # TODO: Perhaps some of the wildcards above can be further trimmed down with some of these:
                          #
                          #  'folly/executors/{DrivableExecutor,InlineExecutor,QueuedImmediateExecutor,TimedDrivableExecutor}.{h,cpp}',
                          #  'folly/concurrency/{CacheLocality,UnboundedQueue}.{h,cpp}',
                          #  'folly/system/ThreadId.h',
                          #  'folly/synchronization/Hazptr{,-fwd,Domain,Holder,Obj,ObjLinked,Rec,ThrLocal}.{h,cpp}',
                          #  'folly/synchronization/{AsymmetricMemoryBarrier,AtomicStruct,Baton,MicroSpinLock,ParkingLot,RWSpinLock,SanitizeThread,SaturatingSemaphore,WaitOptions}.{h,cpp}',
                          #  'folly/synchronization/detail/{AtomicUtils,Sleeper,Spin}.{h,cpp}',
                          #  'folly/experimental/{ReadMostlySharedPtr,TLRefCount}.h',
  end

  # Folly has issues when compiled with iOS 10 set as deployment target
  # See https://github.com/facebook/folly/issues/1470 for details
  spec.platforms = { :ios => min_ios_version_supported }
end
