#!/usr/bin/env python3


import gdb
import gdb.printing
import gdb.types
import gdb.unwinder
import gdb.xmethod
import collections


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


class FiberManagerPrinter:
    """Print a folly::fibers::Fiber"""

    fiber_print_limit = 100

    def __init__(self, fm):
        self.fm = fm

    def children(self):
        all_fibers = \
            self.fm['allFibers_']['data_']['root_plus_size_']['m_header']
        fiber_hook = all_fibers['next_']

        active_fibers = collections.OrderedDict()

        fiber_count = 0

        while fiber_hook != all_fibers.address:
            if fiber_count == FiberManagerPrinter.fiber_print_limit:
                active_fibers["..."] = "..."
                break

            fiber = fiber_hook.cast(gdb.lookup_type("int64_t"))
            fiber = fiber - gdb.parse_and_eval(
                "(int64_t)&'folly::fibers::Fiber'::globalListHook_")
            fiber = fiber.cast(
                gdb.lookup_type('folly::fibers::Fiber').pointer()).dereference()

            if FiberPrinter(fiber).state != "folly::fibers::Fiber::INVALID":
                active_fibers[str(fiber.address)] = fiber

            fiber_hook = fiber_hook.dereference()['next_']

            fiber_count = fiber_count + 1

        return active_fibers.items()

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


def fiber_activate(fiber_ptr):
    fiber_type = gdb.lookup_type("folly::fibers::Fiber")
    fiber = fiber_ptr.cast(fiber_type.pointer()).dereference()
    if not FiberPrinter(fiber).backtrace_available():
        return "Can not activate a non-waiting fiber."
    FiberUnwinder.set_fiber(fiber)
    return "Fiber " + str(fiber_ptr) + " activated. You can call 'bt' now."


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
    global_cache_type = gdb.lookup_type(
        "folly::fibers::(anonymous namespace)::GlobalCache<" + evb_type + ">")
    global_cache_instance_ptr_ptr = gdb.parse_and_eval(
        "&'" + global_cache_type.name + "::instance()::ret'")
    global_cache_instance = global_cache_instance_ptr_ptr.cast(
        global_cache_type.pointer().pointer()).dereference().dereference()
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
    FiberPrintLimitCommand()
    FiberActivateCommand()
    FiberDeactivateCommand()
    Shortcut("get_fiber_manager_map_evb", get_fiber_manager_map_evb)
    Shortcut("get_fiber_manager_map_vevb", get_fiber_manager_map_vevb)


def info():
    return "Pretty printers for folly::fibers"
