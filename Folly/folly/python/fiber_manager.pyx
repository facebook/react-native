import asyncio
from libcpp.memory cimport unique_ptr
from folly.executor cimport get_executor
from folly.fiber_manager cimport (
    cFiberManager,
    cLoopController,
    cAsyncioLoopController,
    cFiberManagerOptions)
from weakref import WeakKeyDictionary

#asynico Loops to FiberManager
loop_to_controller = WeakKeyDictionary()


cdef class FiberManager:
    cdef unique_ptr[cFiberManager] cManager

    # Lazy constructor, as __cinit__ doesn't support C types
    cdef init(self, const cFiberManagerOptions& opts):
        self.cManager.reset(new cFiberManager(
            unique_ptr[cLoopController](new cAsyncioLoopController(
                get_executor())),
            opts));


cdef cFiberManager* get_fiber_manager(const cFiberManagerOptions& opts):
   loop = asyncio.get_event_loop()
   try:
       manager = <FiberManager>(loop_to_controller[loop])
   except KeyError:
       manager = FiberManager()
       manager.init(opts)
       loop_to_controller[loop] = manager
   return manager.cManager.get()
