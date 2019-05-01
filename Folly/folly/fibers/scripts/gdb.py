#!/usr/bin/env python3


import gdb
import gdb.printing
import gdb.types
import gdb.unwinder
import gdb.xmethod
import collections
import itertools


class FiberPrinter:
    """Print a folly::fibers::Fiber"""

    def __init__(self, val):
        self.val = val

        state = self.val['state_']
        d = gdb.types.make_enum_dict(state.type)
        d = dict((v, k) for k, v in d.items())
        self.state = d[int(state)]

    def state_to_string(self):
        if self.state == "folly::fibers::Fiber::INVALID":
            return "Invalid"
        if self.state == "folly::fibers::Fiber::NOT_STARTED":
            return "Not started"
        if self.state == "folly::fibers::Fiber::READY_TO_RUN":
            return "Ready to run"
        if self.state == "folly::fibers::Fiber::RUNNING":
            return "Running"
        if self.state == "folly::fibers::Fiber::AWAITING":
            return "Awaiting"
        if self.state == "folly::fibers::Fiber::AWAITING_IMMEDIATE":
            return "Awaiting immediate"
        if self.state == "folly::fibers::Fiber::YIELDED":
            return "Yielded"
        return "Unknown"

    def backtrace_available(self):
        return self.state != "folly::fibers::Fiber::INVALID" and \
            self.state != "folly::fibers::Fiber::NOT_STARTED" and \
            self.state != "folly::fibers::Fiber::RUNNING"

    def children(self):
        result = collections.OrderedDict()
        result["state"] = self.state_to_string()
        result["backtrace available"] = self.backtrace_available()
        return result.items()

    def to_string(self):
        return "folly::fibers::Fiber"

    def display_hint(self):
        return "folly::fibers::Fiber"


class GetFiberXMethodWorker(gdb.xmethod.XMethodWorker):
    def get_arg_types(self):
        return gdb.lookup_type('int')

    def get_result_type(self):
        return gdb.lookup_type('int')

    def __call__(self, *args):
        fm = args[0]
        index = int(args[1])
        fiber = next(itertools.islice(fiber_manager_active_fibers(fm),
                                      index,
                                      None))
        if fiber is None:
            raise gdb.GdbError("Index out of range")
        else:
            return fiber


class GetFiberXMethodMatcher(gdb.xmethod.XMethodMatcher):
    def __init__(self):
        super(GetFiberXMethodMatcher, self).__init__(
            "Fiber address method matcher")
        self.worker = GetFiberXMethodWorker()

    def match(self, class_type, method_name):
        if class_type.name == "folly::fibers::FiberManager" and \
           method_name == "get_fiber":
            return self.worker
        return None


def fiber_manager_active_fibers(fm):
    all_fibers = \
        fm['allFibers_']['data_']['root_plus_size_']['m_header']
    fiber_hook = all_fibers['next_']

    fiber_count = 0

    while fiber_hook != all_fibers.address:
        fiber = fiber_hook.cast(gdb.lookup_type("int64_t"))
        fiber = fiber - gdb.parse_and_eval(
            "(int64_t)&'folly::fibers::Fiber'::globalListHook_")
        fiber = fiber.cast(
            gdb.lookup_type('folly::fibers::Fiber').pointer()).dereference()

        if FiberPrinter(fiber).state != "folly::fibers::Fiber::INVALID":
            yield fiber

        fiber_hook = fiber_hook.dereference()['next_']

        fiber_count = fiber_count + 1


class FiberManagerPrinter:
    """Print a folly::fibers::Fiber"""

    fiber_print_limit = 100

    def __init__(self, fm):
        self.fm = fm

    def children(self):
        def limit_with_dots(fibers_iterator):
            num_items = 0
            for fiber in fibers_iterator:
                if num_items >= self.fiber_print_limit:
                    yield ('...', '...')
                    return

                yield (str(fiber.address), fiber)
                num_items += 1

        return limit_with_dots(fiber_manager_active_fibers(self.fm))

    def to_string(self):
        return "folly::fibers::FiberManager"

    def display_hint(self):
        return "folly::fibers::FiberManager"


class FiberPrintLimitCommand(gdb.Command):
    def __init__(self):
        super(FiberPrintLimitCommand, self).__init__(
            "fiber-print-limit", gdb.COMMAND_USER)

    def invoke(self, arg, from_tty):
        if not arg:
            print("New limit has to be passed to 'fiber_print_limit' command")
            return
        FiberManagerPrinter.fiber_print_limit = int(arg)
        print("New fiber limit for FiberManager printer set to " +
              str(FiberManagerPrinter.fiber_print_limit))


class FrameId(object):
    def __init__(self, sp, pc):
        self.sp = sp
        self.pc = pc


class FiberUnwinderFrameFilter:
    instance = None

    @classmethod
    def set_skip_frame_sp(cls, skip_frame_sp):
        if cls.instance is None:
            cls.instance = FiberUnwinderFrameFilter()

        cls.instance.skip_frame_sp = skip_frame_sp

    def __init__(self):
        self.name = "FiberUnwinderFrameFilter"
        self.priority = 100
        self.enabled = True
        gdb.frame_filters[self.name] = self

    def filter(self, frame_iter):
        if not self.skip_frame_sp:
            return frame_iter

        return self.filter_impl(frame_iter)

    def filter_impl(self, frame_iter):
        for frame in frame_iter:
            frame_sp = frame.inferior_frame().read_register("rsp")
            if frame_sp == self.skip_frame_sp:
                continue
            yield frame


class FiberUnwinder(gdb.unwinder.Unwinder):
    instance = None

    @classmethod
    def set_fiber(cls, fiber):
        if cls.instance is None:
            cls.instance = FiberUnwinder()
            gdb.unwinder.register_unwinder(None, cls.instance)

        fiber_impl = fiber['fiberImpl_']
        cls.instance.fiber_context_ptr = fiber_impl['fiberContext_']

    def __init__(self):
        super(FiberUnwinder, self).__init__("Fiber unwinder")
        self.fiber_context_ptr = None

    def __call__(self, pending_frame):
        if not self.fiber_context_ptr:
            return None

        orig_sp = pending_frame.read_register('rsp')
        orig_pc = pending_frame.read_register('rip')

        void_star_star = gdb.lookup_type('uint64_t').pointer()
        ptr = self.fiber_context_ptr.cast(void_star_star)

        # This code may need to be adjusted to newer versions of boost::context.
        #
        # The easiest way to get these offsets is to first attach to any
        # program which uses folly::fibers and add a break point in
        # boost::context::jump_fcontext. You then need to save information about
        # frame 1 via 'info frame 1' command.
        #
        # After that you need to resume program until fiber switch is complete
        # and expore the contents of saved fiber context via
        # 'x/16gx {fiber pointer}->fiberImpl_.fiberContext_' command.
        # You then need to match those to the following values you've previously
        # observed in the output of 'info frame 1'  command.
        #
        # Value found at "rbp at X" of 'info frame 1' output:
        rbp = (ptr + 6).dereference()
        # Value found at "rip = X" of 'info frame 1' output:
        rip = (ptr + 7).dereference()
        # Value found at "caller of frame at X" of 'info frame 1' output:
        rsp = rbp - 96

        frame_id = FrameId(rsp, orig_pc)
        unwind_info = pending_frame.create_unwind_info(frame_id)
        unwind_info.add_saved_register('rbp', rbp)
        unwind_info.add_saved_register('rsp', rsp)
        unwind_info.add_saved_register('rip', rip)

        self.fiber_context_ptr = None

        FiberUnwinderFrameFilter.set_skip_frame_sp(orig_sp)

        return unwind_info


def fiber_activate(fiber):
    fiber_type = gdb.lookup_type("folly::fibers::Fiber")
    if fiber.type != fiber_type:
        fiber = fiber.cast(fiber_type.pointer()).dereference()
    if not FiberPrinter(fiber).backtrace_available():
        return "Can not activate a non-waiting fiber."
    gdb.invalidate_cached_frames()
    FiberUnwinder.set_fiber(fiber)
    return "Fiber 0x{:12x} activated. You can call 'bt' now.".format(int(fiber.address))


def fiber_deactivate():
    FiberUnwinderFrameFilter.set_skip_frame_sp(None)
    gdb.invalidate_cached_frames()
    return "Fiber de-activated."


class FiberActivateCommand(gdb.Command):
    def __init__(self):
        super(FiberActivateCommand, self).__init__("fiber", gdb.COMMAND_USER)

    def invoke(self, arg, from_tty):
        if not arg:
            print("folly::fibers::Fiber* has to be passed to 'fiber' command")
            return
        fiber_ptr = gdb.parse_and_eval(arg)
        print(fiber_activate(fiber_ptr))


class FiberDeactivateCommand(gdb.Command):
    def __init__(self):
        super(FiberDeactivateCommand, self).__init__(
            "fiber-deactivate", gdb.COMMAND_USER)

    def invoke(self, arg, from_tty):
        print(fiber_deactivate())


class FiberXMethodWorker(gdb.xmethod.XMethodWorker):
    def get_arg_types(self):
        return None

    def get_result_type(self):
        return None

    def __call__(self, *args):
        return fiber_activate(args[0])


class FiberXMethodMatcher(gdb.xmethod.XMethodMatcher):
    def __init__(self):
        super(FiberXMethodMatcher, self).__init__("Fiber method matcher")
        self.worker = FiberXMethodWorker()

    def match(self, class_type, method_name):
        if class_type.name == "folly::fibers::Fiber" and \
           method_name == "activate":
            return self.worker
        return None


class Shortcut(gdb.Function):
    def __init__(self, function_name, value_lambda):
        super(Shortcut, self).__init__(function_name)
        self.value_lambda = value_lambda

    def invoke(self):
        return self.value_lambda()


def get_fiber_manager_map(evb_type):
    try:
        # Exception thrown if unable to find type
        # Probably because of missing debug symbols
        global_cache_type = gdb.lookup_type(
            "folly::fibers::(anonymous namespace)::GlobalCache<" + evb_type + ">")
    except gdb.error:
        raise gdb.GdbError("Unable to find types. "
                           "Please make sure debug info is available for this binary.\n"
                           "Have you run 'fbload debuginfo_fbpkg'?")

    global_cache_instance_ptr_ptr = gdb.parse_and_eval(
        "&'" + global_cache_type.name + "::instance()::ret'")
    global_cache_instance_ptr = global_cache_instance_ptr_ptr.cast(
        global_cache_type.pointer().pointer()).dereference()
    if global_cache_instance_ptr == 0x0:
        raise gdb.GdbError("FiberManager map is empty.")

    global_cache_instance = global_cache_instance_ptr.dereference()
    return global_cache_instance['map_']


def get_fiber_manager_map_evb():
    return get_fiber_manager_map("folly::EventBase")


def get_fiber_manager_map_vevb():
    return get_fiber_manager_map("folly::VirtualEventBase")


def build_pretty_printer():
    pp = gdb.printing.RegexpCollectionPrettyPrinter("folly_fibers")
    pp.add_printer('fibers::Fiber', '^folly::fibers::Fiber$', FiberPrinter)
    pp.add_printer('fibers::FiberManager', '^folly::fibers::FiberManager$',
                   FiberManagerPrinter)
    return pp


def load():
    gdb.printing.register_pretty_printer(gdb, build_pretty_printer())
    gdb.xmethod.register_xmethod_matcher(gdb, FiberXMethodMatcher())
    gdb.xmethod.register_xmethod_matcher(gdb, GetFiberXMethodMatcher())
    FiberPrintLimitCommand()
    FiberActivateCommand()
    FiberDeactivateCommand()
    Shortcut("get_fiber_manager_map_evb", get_fiber_manager_map_evb)
    Shortcut("get_fiber_manager_map_vevb", get_fiber_manager_map_vevb)


def info():
    return "Pretty printers for folly::fibers"
