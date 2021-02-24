# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

Pod::Spec.new do |spec|
  spec.name = 'RCT-Folly'
  spec.version = '2020.01.13.00'
  spec.license = { :type => 'Apache License, Version 2.0' }
  spec.homepage = 'https://github.com/facebook/folly'
  spec.summary = 'An open-source C++ library developed and used at Facebook.'
  spec.authors = 'Facebook'
  spec.source = { :git => 'https://github.com/facebook/folly.git',
                  :tag => "v#{spec.version}" }
  spec.module_name = 'folly'
  spec.header_mappings_dir = '.'
  spec.dependency 'boost-for-react-native'
  spec.dependency 'DoubleConversion'
  spec.dependency 'glog'
  spec.compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_HAVE_PTHREAD=1 -Wno-comma -Wno-shorten-64-to-32 -Wno-documentation'
  spec.source_files = 'folly/String.cpp',
                      'folly/Conv.cpp',
                      'folly/Demangle.cpp',
                      'folly/FileUtil.cpp',
                      'folly/Format.cpp',
                      'folly/lang/SafeAssert.cpp',
                      'folly/ScopeGuard.cpp',
                      'folly/Unicode.cpp',
                      'folly/dynamic.cpp',
                      'folly/json.cpp',
                      'folly/json_pointer.cpp',
                      'folly/container/detail/F14Table.cpp',
                      'folly/detail/Demangle.cpp',
                      'folly/detail/UniqueInstance.cpp',
                      'folly/hash/SpookyHashV2.cpp',
                      'folly/lang/Assume.cpp',
                      'folly/lang/CString.cpp',
                      'folly/memory/detail/MallocImpl.cpp',
                      'folly/net/NetOps.cpp',
                      'folly/portability/SysUio.cpp',
                      'folly/*.h',
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
  spec.libraries           = "stdc++"
  spec.pod_target_xcconfig = { "USE_HEADERMAP" => "NO",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++14",
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)\" \"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/libevent/include/\"" }

  # TODO: The boost spec should really be selecting these files so that dependents of Folly can also access the required headers.
  spec.user_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost-for-react-native\"" }

  spec.default_subspec = 'Default'

  spec.subspec 'Default' do
    # no-op
  end

  spec.subspec 'Fabric' do |fabric|
    fabric.source_files = 'folly/SharedMutex.cpp',
                          'folly/concurrency/CacheLocality.cpp',
                          'folly/detail/Futex.cpp',
                          'folly/synchronization/ParkingLot.cpp',
                          'folly/portability/Malloc.cpp'
    fabric.preserve_paths = 'folly/concurrency/CacheLocality.h',
                            'folly/synchronization/ParkingLot.h',
                            'folly/synchronization/SanitizeThread.h',
                            'folly/system/ThreadId.h'
  end

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
                           'folly/experimental/{ExecutionObserver,ReadMostlySharedPtr,SingleWriterFixedHashMap,TLRefCount}.{h,cpp}',
                           'folly/io/async/{AsyncTimeout,DelayedDestruction,DelayedDestructionBase,EventBase,EventBaseManager,EventBaseBackendBase,EventHandler,EventUtil,HHWheelTimer,HHWheelTimer-fwd,NotificationQueue,Request,TimeoutManager,VirtualEventBase}.{h,cpp}',
                           'folly/io/{Cursor,Cursor-inl,IOBuf,IOBufQueue}.{h,cpp}',
                           'folly/tracing/StaticTracepoint.{h,cpp}',
                           'folly/{Executor,ExceptionWrapper,ExceptionWrapper-inl,FileUtil,Singleton,SharedMutex}.{h,cpp}',
                           'folly/detail/{AsyncTrace,AtFork,Futex,Futex-inl,MemoryIdler,SingletonStackTrace,StaticSingletonManager,ThreadLocalDetail}.{h,cpp}',
                           'folly/lang/SafeAssert.{h,cpp}',
                           'folly/memory/MallctlHelper.{h,cpp}',
                           'folly/portability/{GFlags,SysUio}.{h,cpp}',
                           'folly/chrono/Hardware.{h,cpp}'
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
  spec.platforms = { :ios => "9.0", :tvos => "9.0" }
end
