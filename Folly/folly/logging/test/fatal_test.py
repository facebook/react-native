#!/usr/bin/env python3
#
# Copyright 2004-present Facebook, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import os
import re
import signal
import subprocess
import unittest


class FatalTests(unittest.TestCase):
    def setUp(self):
        fatal_helper_env = os.environ.get("FOLLY_FATAL_HELPER")
        if fatal_helper_env:
            self.helper = fatal_helper_env
        else:
            build_dir = os.path.join(os.getcwd(), "buck-out", "gen")
            self.helper = os.path.join(
                build_dir, "folly", "logging", "test", "fatal_helper"
            )

    def run_helper(self, *args, **kwargs):
        """Run the helper and verify it crashes.

        Check that it crashes with SIGABRT and prints nothing on stdout.
        Returns the data printed to stderr.
        """
        returncode, out, err = self.run_helper_nochecks(*args, **kwargs)
        self.assertEqual(returncode, -signal.SIGABRT)
        self.assertEqual(out, b"")
        return err

    def run_helper_nochecks(self, *args, **kwargs):
        """Run the helper.

        Returns a tuple of [returncode, stdout_output, stderr_output]
        """
        env = kwargs.pop("env", None)
        if kwargs:
            raise TypeError("unexpected keyword arguments: %r" % (list(kwargs.keys())))

        cmd = [self.helper]
        cmd.extend(args)
        p = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env
        )
        out, err = p.communicate()
        return p.returncode, out, err

    def is_debug_build(self):
        returncode, out, err = self.run_helper_nochecks("--check_debug")
        self.assertEqual(b"", err)
        self.assertEqual(0, returncode)
        if out.strip() == b"DEBUG=1":
            return True
        elif out.strip() == b"DEBUG=0":
            return False
        else:
            self.fail("unexpected output from --check_debug: {}".format(out))

    def get_crash_regex(self, msg=b"test program crashing!", glog=True):
        if glog:
            prefix = br"^F[0-9]{4} .* FatalHelper.cpp:[0-9]+\] "
        else:
            prefix = br"^FATAL:.*FatalHelper.cpp:[0-9]+: "
        regex = prefix + re.escape(msg) + b"$"
        return re.compile(regex, re.MULTILINE)

    def test_no_crash(self):
        # Simple sanity check that the program runs without
        # crashing when requested
        returncode, out, err = self.run_helper_nochecks("--crash=no")
        self.assertEqual(0, returncode)
        self.assertEqual(b"", out)
        self.assertEqual(b"", err)

    def test_async(self):
        handler_setings = "default=stream:stream=stderr,async=true"
        err = self.run_helper("--logging=;" + handler_setings)
        self.assertRegex(err, self.get_crash_regex())

    def test_immediate(self):
        handler_setings = "default=stream:stream=stderr,async=false"
        err = self.run_helper("--logging=;" + handler_setings)
        self.assertRegex(err, self.get_crash_regex())

    def test_none(self):
        # The fatal message should be printed directly to stderr when there
        # are no logging handlers configured.
        err = self.run_helper("--logging=ERR:")
        self.assertRegex(err, self.get_crash_regex(glog=False))

    def test_other_category(self):
        err = self.run_helper("--category=foo.bar", "--logging", ".=FATAL")
        regex = re.compile(
            br"^F[0-9]{4} .* FatalHelper.cpp:[0-9]+\] "
            br"crashing to category foo\.bar$",
            re.MULTILINE,
        )
        self.assertRegex(err, regex)

    def test_static_init(self):
        err = self.run_helper(env={"CRASH_DURING_INIT": "1"})
        regex = self.get_crash_regex(br"crashing during static initialization")
        self.assertRegex(err, regex)

    def test_static_destruction(self):
        err = self.run_helper("--crash=no", env={"CRASH_DURING_INIT": "shutdown"})
        # When crashing during static destruction we may or may not see a
        # glog-formatted message.  This depends on whether the crashing
        # destructor runs before or after the code that uninstalls the log
        # handlers, and it is valid for that to occur in either order.
        regex = re.compile(
            br"^(FATAL|C[0-9]{4}).*FatalHelper.cpp:.* "
            br"crashing during static destruction$",
            re.MULTILINE,
        )
        self.assertRegex(err, regex)

    def test_fatal_xlog_if(self):
        # Specify --crash=no to ensure that the XLOG_IF() check is actually what
        # triggers the crash.
        err = self.run_helper("--fail_fatal_xlog_if", "--crash=no")
        self.assertRegex(err, self.get_crash_regex(b"--fail_fatal_xlog_if specified!"))

    def test_dfatal_xlog_if(self):
        returncode, out, err = self.run_helper_nochecks(
            "--fail_dfatal_xlog_if", "--crash=no"
        )
        # The "--fail_dfatal_xlog_if" message should be logged regardless of which build
        # type we are using.  However, in debug builds it will not trigger a crash.
        self.assertRegex(err, self.get_crash_regex(b"--fail_dfatal_xlog_if specified!"))
        self.assertEqual(b"", out)
        if self.is_debug_build():
            self.assertEqual(-signal.SIGABRT, returncode)
        else:
            self.assertEqual(0, returncode)

    def test_xcheck(self):
        # Specify --crash=no to ensure that the XCHECK() is actually what triggers the
        # crash.
        err = self.run_helper("--fail_xcheck", "--crash=no")
        self.assertRegex(
            err,
            self.get_crash_regex(
                b"Check failed: !FLAGS_fail_xcheck : --fail_xcheck specified!"
            ),
        )

    def test_xcheck_nomsg(self):
        err = self.run_helper("--fail_xcheck_nomsg", "--crash=no")
        self.assertRegex(
            err, self.get_crash_regex(b"Check failed: !FLAGS_fail_xcheck_nomsg ")
        )

    def test_xdcheck(self):
        returncode, out, err = self.run_helper_nochecks("--fail_xdcheck", "--crash=no")
        self.assertEqual(b"", out)
        if self.is_debug_build():
            self.assertRegex(
                err,
                self.get_crash_regex(
                    b"Check failed: !FLAGS_fail_xdcheck : --fail_xdcheck specified!"
                ),
            )
            self.assertEqual(-signal.SIGABRT, returncode)
        else:
            self.assertEqual(b"", err)
            self.assertEqual(0, returncode)
