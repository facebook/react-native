from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

import re
import unittest

"""
#                              _-----=> irqs-off
#                             / _----=> need-resched
#                            | / _---=> hardirq/softirq
#                            || / _--=> preempt-depth
#                            ||| /     delay
#           TASK-PID   CPU#  ||||    TIMESTAMP  FUNCTION
#              | |       |   ||||       |         |
          <idle>-0     [001] ...2  3269.291072: sched_switch: prev_comm=swapper/1 prev_pid=0 prev_prio=120 prev_state=R ==> next_comm=mmcqd/0 next_pid=120 next_prio=120
"""
TRACE_LINE_PATTERN = re.compile(
    r'^\s*(?P<task>.+)-(?P<pid>\d+)\s+(?:\((?P<tgid>.+)\)\s+)?\[(?P<cpu>\d+)\]\s+(?:(?P<flags>\S{4})\s+)?(?P<timestamp>[0-9.]+):\s+(?P<function>.+)$')

"""
Example lines from custom app traces:
0: B|27295|providerRemove
0: E
tracing_mark_write: S|27311|NNFColdStart<D-7744962>|1112249168
"""
APP_TRACE_LINE_PATTERN = re.compile(
    r'^(?P<type>.+?): (?P<args>.+)$')

"""
Example section names:
NNFColdStart
NNFColdStart<0><T7744962>
NNFColdStart<X>
NNFColdStart<T7744962>
"""
DECORATED_SECTION_NAME_PATTERN = re.compile(r'^(?P<section_name>.*?)(?:<0>)?(?:<(?P<command>.)(?P<argument>.*?)>)?$')

SYSTRACE_LINE_TYPES = set(['0', 'tracing_mark_write'])

class TraceLine(object):
    def __init__(self, task, pid, tgid, cpu, flags, timestamp, function):
        self.task = task
        self.pid = pid
        self.tgid = tgid
        self.cpu = cpu
        self.flags = flags
        self.timestamp = timestamp
        self.function = function
        self.canceled = False

    @property
    def is_app_trace_line(self):
        return isinstance(self.function, AppTraceFunction)

    def cancel(self):
        self.canceled = True

    def __str__(self):
        if self.canceled:
            return ""
        elif self.tgid:
            return "{task:>16s}-{pid:<5d} ({tgid:5s}) [{cpu:03d}] {flags:4s} {timestamp:12f}: {function}\n".format(**vars(self))
        elif self.flags:
            return "{task:>16s}-{pid:<5d} [{cpu:03d}] {flags:4s} {timestamp:12f}: {function}\n".format(**vars(self))
        else:
            return "{task:>16s}-{pid:<5d} [{cpu:03d}] {timestamp:12.6f}: {function}\n".format(**vars(self))


class AppTraceFunction(object):
    def __init__(self, type, args):
        self.type = type
        self.args = args
        self.operation = args[0]

        if len(args) >= 2 and args[1]:
            self.pid = int(args[1])
        if len(args) >= 3:
            self._section_name, self.command, self.argument = _parse_section_name(args[2])
            args[2] = self._section_name
        else:
            self._section_name = None
            self.command = None
            self.argument = None
        self.cookie = None

    @property
    def section_name(self):
        return self._section_name

    @section_name.setter
    def section_name(self, value):
        self._section_name = value
        self.args[2] = value

    def __str__(self):
        return "{type}: {args}".format(type=self.type, args='|'.join(self.args))


class AsyncTraceFunction(AppTraceFunction):
    def __init__(self, type, args):
        super(AsyncTraceFunction, self).__init__(type, args)

        self.cookie = int(args[3])


TRACE_TYPE_MAP = {
    'S': AsyncTraceFunction,
    'T': AsyncTraceFunction,
    'F': AsyncTraceFunction,
}

def parse_line(line):
    match = TRACE_LINE_PATTERN.match(line.strip())
    if not match:
        return None

    task = match.group("task")
    pid = int(match.group("pid"))
    tgid = match.group("tgid")
    cpu = int(match.group("cpu"))
    flags = match.group("flags")
    timestamp = float(match.group("timestamp"))
    function = match.group("function")

    app_trace = _parse_function(function)
    if app_trace:
        function = app_trace

    return TraceLine(task, pid, tgid, cpu, flags, timestamp, function)

def parse_dextr_line(line):
    task = line["name"]
    pid = line["pid"]
    tgid = line["tid"]
    cpu = None
    flags = None
    timestamp = line["ts"]
    function = AppTraceFunction("DextrTrace", [line["ph"], line["pid"], line["name"]])

    return TraceLine(task, pid, tgid, cpu, flags, timestamp, function)


def _parse_function(function):
    line_match = APP_TRACE_LINE_PATTERN.match(function)
    if not line_match:
        return None

    type = line_match.group("type")
    if not type in SYSTRACE_LINE_TYPES:
        return None

    args = line_match.group("args").split('|')
    if len(args) == 1 and len(args[0]) == 0:
        args = None

    constructor = TRACE_TYPE_MAP.get(args[0], AppTraceFunction)
    return constructor(type, args)


def _parse_section_name(section_name):
    if section_name is None:
        return section_name, None, None

    section_name_match = DECORATED_SECTION_NAME_PATTERN.match(section_name)
    section_name = section_name_match.group("section_name")
    command = section_name_match.group("command")
    argument = section_name_match.group("argument")
    return section_name, command, argument


def _format_section_name(section_name, command, argument):
    if not command:
        return section_name

    return "{section_name}<{command}{argument}>".format(**vars())


class RoundTripFormattingTests(unittest.TestCase):
    def testPlainSectionName(self):
        section_name = "SectionName12345-5562342fas"

        self.assertEqual(section_name, _format_section_name(*_parse_section_name(section_name)))

    def testDecoratedSectionName(self):
        section_name = "SectionName12345-5562342fas<D-123456>"

        self.assertEqual(section_name, _format_section_name(*_parse_section_name(section_name)))

    def testSimpleFunction(self):
        function = "0: E"

        self.assertEqual(function, str(_parse_function(function)))

    def testFunctionWithoutCookie(self):
        function = "0: B|27295|providerRemove"

        self.assertEqual(function, str(_parse_function(function)))

    def testFunctionWithCookie(self):
        function = "0: S|27311|NNFColdStart|1112249168"

        self.assertEqual(function, str(_parse_function(function)))

    def testFunctionWithCookieAndArgs(self):
        function = "0: T|27311|NNFColdStart|1122|Start"

        self.assertEqual(function, str(_parse_function(function)))

    def testFunctionWithArgsButNoPid(self):
        function = "0: E|||foo=bar"

        self.assertEqual(function, str(_parse_function(function)))

    def testKitKatFunction(self):
        function = "tracing_mark_write: B|14127|Looper.dispatchMessage|arg=>>>>> Dispatching to Handler (android.os.Handler) {422ae980} null: 0|Java"

        self.assertEqual(function, str(_parse_function(function)))

    def testNonSysTraceFunctionIgnored(self):
        function = "sched_switch: prev_comm=swapper/1 prev_pid=0 prev_prio=120 prev_state=R ==> next_comm=mmcqd/0 next_pid=120 next_prio=120"

        self.assertEqual(None, _parse_function(function))

    def testLineWithFlagsAndTGID(self):
        line = "          <idle>-0     (  550) [000] d..2  7953.258473: cpu_idle: state=1 cpu_id=0\n"

        self.assertEqual(line, str(parse_line(line)))

    def testLineWithFlagsAndNoTGID(self):
        line = "          <idle>-0     (-----) [000] d..2  7953.258473: cpu_idle: state=1 cpu_id=0\n"

        self.assertEqual(line, str(parse_line(line)))

    def testLineWithFlags(self):
        line = "          <idle>-0     [001] ...2  3269.291072: sched_switch: prev_comm=swapper/1 prev_pid=0 prev_prio=120 prev_state=R ==> next_comm=mmcqd/0 next_pid=120 next_prio=120\n"

        self.assertEqual(line, str(parse_line(line)))

    def testLineWithoutFlags(self):
        line = "          <idle>-0     [001]  3269.291072: sched_switch: prev_comm=swapper/1 prev_pid=0 prev_prio=120 prev_state=R ==> next_comm=mmcqd/0 next_pid=120 next_prio=120\n"

        self.assertEqual(line, str(parse_line(line)))
