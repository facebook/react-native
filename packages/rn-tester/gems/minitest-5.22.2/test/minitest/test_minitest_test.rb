# encoding: UTF-8

require "pathname"
require "minitest/metametameta"

if defined? Encoding then
  e = Encoding.default_external
  if e != Encoding::UTF_8 then
    warn ""
    warn ""
    warn "NOTE: External encoding #{e} is not UTF-8. Tests WILL fail."
    warn "      Run tests with `RUBYOPT=-Eutf-8 rake` to avoid errors."
    warn ""
    warn ""
  end
end

class Minitest::Runnable
  def whatever # faked for testing
    assert true
  end
end

class TestMinitestUnit < MetaMetaMetaTestCase
  parallelize_me!

  pwd = Pathname.new File.expand_path Dir.pwd
  basedir = Pathname.new(File.expand_path "lib/minitest") + "mini"
  basedir = basedir.relative_path_from(pwd).to_s
  MINITEST_BASE_DIR = basedir[/\A\./] ? basedir : "./#{basedir}"
  BT_MIDDLE = ["#{MINITEST_BASE_DIR}/test.rb:161:in `each'",
               "#{MINITEST_BASE_DIR}/test.rb:158:in `each'",
               "#{MINITEST_BASE_DIR}/test.rb:139:in `run'",
               "#{MINITEST_BASE_DIR}/test.rb:106:in `run'"]

  def test_filter_backtrace
    # this is a semi-lame mix of relative paths.
    # I cheated by making the autotest parts not have ./
    bt = (["lib/autotest.rb:571:in `add_exception'",
           "test/test_autotest.rb:62:in `test_add_exception'",
           "#{MINITEST_BASE_DIR}/test.rb:165:in `__send__'"] +
          BT_MIDDLE +
          ["#{MINITEST_BASE_DIR}/test.rb:29",
           "test/test_autotest.rb:422"])
    bt = util_expand_bt bt

    ex = ["lib/autotest.rb:571:in `add_exception'",
          "test/test_autotest.rb:62:in `test_add_exception'"]
    ex = util_expand_bt ex

    Minitest::Test.io_lock.synchronize do # try not to trounce in parallel
      fu = Minitest.filter_backtrace(bt)

      assert_equal ex, fu
    end
  end

  def test_filter_backtrace_all_unit
    bt = (["#{MINITEST_BASE_DIR}/test.rb:165:in `__send__'"] +
          BT_MIDDLE +
          ["#{MINITEST_BASE_DIR}/test.rb:29"])
    ex = bt.clone
    fu = Minitest.filter_backtrace(bt)
    assert_equal ex, fu
  end

  def test_filter_backtrace_unit_starts
    bt = (["#{MINITEST_BASE_DIR}/test.rb:165:in `__send__'"] +
          BT_MIDDLE +
          ["#{MINITEST_BASE_DIR}/mini/test.rb:29",
           "-e:1"])

    bt = util_expand_bt bt

    ex = ["-e:1"]
    Minitest::Test.io_lock.synchronize do # try not to trounce in parallel
      fu = Minitest.filter_backtrace bt
      assert_equal ex, fu
    end
  end

  def test_filter_backtrace__empty
    with_empty_backtrace_filter do
      bt = %w[first second third]
      fu = Minitest.filter_backtrace bt.dup
      assert_equal bt, fu
    end
  end

  def test_infectious_binary_encoding
    @tu = Class.new FakeNamedTest do
      def test_this_is_not_ascii_assertion
        assert_equal "ЁЁЁ", "ёёё"
      end

      def test_this_is_non_ascii_failure_message
        fail 'ЁЁЁ'.force_encoding('ASCII-8BIT')
      end
    end

    expected = clean <<-EOM
      FE

      Finished in 0.00

        1) Failure:
      FakeNamedTestXX#test_this_is_not_ascii_assertion [FILE:LINE]:
      Expected: \"ЁЁЁ\"
        Actual: \"ёёё\"

        2) Error:
      FakeNamedTestXX#test_this_is_non_ascii_failure_message:
      RuntimeError: ЁЁЁ
          FILE:LINE:in `test_this_is_non_ascii_failure_message'

      2 runs, 1 assertions, 1 failures, 1 errors, 0 skips
    EOM

    Minitest::Test.io_lock.synchronize do # try not to trounce in parallel
      assert_report expected
    end
  end

  def test_passed_eh_teardown_good
    test_class = Class.new FakeNamedTest do
      def teardown; assert true; end
      def test_omg; assert true; end
    end

    test = test_class.new :test_omg
    test.run

    refute_predicate test, :error?
    assert_predicate test, :passed?
    refute_predicate test, :skipped?
  end

  def test_passed_eh_teardown_skipped
    test_class = Class.new FakeNamedTest do
      def teardown; assert true; end
      def test_omg; skip "bork"; end
    end

    test = test_class.new :test_omg
    test.run

    refute_predicate test, :error?
    refute_predicate test, :passed?
    assert_predicate test, :skipped?
  end

  def test_passed_eh_teardown_flunked
    test_class = Class.new FakeNamedTest do
      def teardown; flunk;       end
      def test_omg; assert true; end
    end

    test = test_class.new :test_omg
    test.run

    refute_predicate test, :error?
    refute_predicate test, :passed?
    refute_predicate test, :skipped?
  end

  def util_expand_bt bt
    bt.map { |f| (f =~ /^\./) ? File.expand_path(f) : f }
  end
end

class TestMinitestUnitInherited < MetaMetaMetaTestCase
  def with_overridden_include
    Class.class_eval do
      def inherited_with_hacks _klass
        throw :inherited_hook
      end

      alias inherited_without_hacks inherited
      alias inherited               inherited_with_hacks
      alias IGNORE_ME!              inherited # 1.8 bug. god I love venture bros
    end

    yield
  ensure
    Class.class_eval do
      alias inherited inherited_without_hacks

      undef_method :inherited_with_hacks
      undef_method :inherited_without_hacks
    end

    refute_respond_to Class, :inherited_with_hacks
    refute_respond_to Class, :inherited_without_hacks
  end

  def test_inherited_hook_plays_nice_with_others
    with_overridden_include do
      assert_throws :inherited_hook do
        Class.new FakeNamedTest
      end
    end
  end
end

class TestMinitestRunner < MetaMetaMetaTestCase
  # do not parallelize this suite... it just can't handle it.

  def test_class_runnables
    @assertion_count = 0

    tc = Class.new(Minitest::Test)

    assert_equal 1, Minitest::Test.runnables.size
    assert_equal [tc], Minitest::Test.runnables
  end

  def test_run_test
    @tu =
    Class.new FakeNamedTest do
      attr_reader :foo

      def run
        @foo = "hi mom!"
        r = super
        @foo = "okay"

        r
      end

      def test_something
        assert_equal "hi mom!", foo
      end
    end

    expected = clean <<-EOM
      .

      Finished in 0.00

      1 runs, 1 assertions, 0 failures, 0 errors, 0 skips
    EOM

    assert_report expected
  end

  def test_run_error
    @tu =
    Class.new FakeNamedTest do
      def test_something
        assert true
      end

      def test_error
        raise "unhandled exception"
      end
    end

    expected = clean <<-EOM
      .E

      Finished in 0.00

        1) Error:
      FakeNamedTestXX#test_error:
      RuntimeError: unhandled exception
          FILE:LINE:in \`test_error\'

      2 runs, 1 assertions, 0 failures, 1 errors, 0 skips
    EOM

    assert_report expected
  end

  def test_run_error_teardown
    @tu =
    Class.new FakeNamedTest do
      def test_something
        assert true
      end

      def teardown
        raise "unhandled exception"
      end
    end

    expected = clean <<-EOM
      E

      Finished in 0.00

        1) Error:
      FakeNamedTestXX#test_something:
      RuntimeError: unhandled exception
          FILE:LINE:in \`teardown\'

      1 runs, 1 assertions, 0 failures, 1 errors, 0 skips
    EOM

    assert_report expected
  end

  def test_run_failing
    setup_basic_tu

    expected = clean <<-EOM
      .F

      Finished in 0.00

        1) Failure:
      FakeNamedTestXX#test_failure [FILE:LINE]:
      Expected false to be truthy.

      2 runs, 2 assertions, 1 failures, 0 errors, 0 skips
    EOM

    assert_report expected
  end

  def setup_basic_tu
    @tu =
    Class.new FakeNamedTest do
      def test_something
        assert true
      end

      def test_failure
        assert false
      end
    end
  end

  def test_seed # this is set for THIS run, so I'm not testing it's actual value
    assert_instance_of Integer, Minitest.seed
  end

  def test_run_failing_filtered
    setup_basic_tu

    expected = clean <<-EOM
      .

      Finished in 0.00

      1 runs, 1 assertions, 0 failures, 0 errors, 0 skips
    EOM

    assert_report expected, %w[--name /some|thing/ --seed 42]
  end

  def assert_filtering filter, name, expected, a = false
    args = %W[--#{filter} #{name} --seed 42]

    alpha = Class.new FakeNamedTest do
      define_method :test_something do
        assert a
      end
    end
    Object.const_set(:Alpha, alpha)

    beta = Class.new FakeNamedTest do
      define_method :test_something do
        assert true
      end
    end
    Object.const_set(:Beta, beta)

    @tus = [alpha, beta]

    assert_report expected, args
  ensure
    Object.send :remove_const, :Alpha
    Object.send :remove_const, :Beta
  end

  def test_run_filtered_including_suite_name
    expected = clean <<-EOM
      .

      Finished in 0.00

      1 runs, 1 assertions, 0 failures, 0 errors, 0 skips
    EOM

    assert_filtering "name", "/Beta#test_something/", expected
  end

  def test_run_filtered_including_suite_name_string
    expected = clean <<-EOM
      .

      Finished in 0.00

      1 runs, 1 assertions, 0 failures, 0 errors, 0 skips
    EOM

    assert_filtering "name", "Beta#test_something", expected
  end

  def test_run_filtered_string_method_only
    expected = clean <<-EOM
      ..

      Finished in 0.00

      2 runs, 2 assertions, 0 failures, 0 errors, 0 skips
    EOM

    assert_filtering "name", "test_something", expected, :pass
  end

  def test_run_failing_excluded
    setup_basic_tu

    expected = clean <<-EOM
      .

      Finished in 0.00

      1 runs, 1 assertions, 0 failures, 0 errors, 0 skips
    EOM

    assert_report expected, %w[--exclude /failure/ --seed 42]
  end

  def test_run_filtered_excluding_suite_name
    expected = clean <<-EOM
      .

      Finished in 0.00

      1 runs, 1 assertions, 0 failures, 0 errors, 0 skips
    EOM

    assert_filtering "exclude", "/Alpha#test_something/", expected
  end

  def test_run_filtered_excluding_suite_name_string
    expected = clean <<-EOM
      .

      Finished in 0.00

      1 runs, 1 assertions, 0 failures, 0 errors, 0 skips
    EOM

    assert_filtering "exclude", "Alpha#test_something", expected
  end

  def test_run_filtered_excluding_string_method_only
    expected = clean <<-EOM


      Finished in 0.00

      0 runs, 0 assertions, 0 failures, 0 errors, 0 skips
    EOM

    assert_filtering "exclude", "test_something", expected, :pass
  end

  def test_run_passing
    @tu =
    Class.new FakeNamedTest do
      def test_something
        assert true
      end
    end

    expected = clean <<-EOM
      .

      Finished in 0.00

      1 runs, 1 assertions, 0 failures, 0 errors, 0 skips
    EOM

    assert_report expected
  end

  def test_run_skip
    @tu =
    Class.new FakeNamedTest do
      def test_something
        assert true
      end

      def test_skip
        skip "not yet"
      end
    end

    expected = clean <<-EOM
      .S

      Finished in 0.00

      2 runs, 1 assertions, 0 failures, 0 errors, 1 skips

      You have skipped tests. Run with --verbose for details.
    EOM

    restore_env do
      assert_report expected
    end
  end

  def test_run_skip_verbose
    @tu =
    Class.new FakeNamedTest do
      def test_something
        assert true
      end

      def test_skip
        skip "not yet"
      end
    end

    expected = clean <<-EOM
      FakeNamedTestXX#test_something = 0.00 s = .
      FakeNamedTestXX#test_skip = 0.00 s = S

      Finished in 0.00

        1) Skipped:
      FakeNamedTestXX#test_skip [FILE:LINE]:
      not yet

      2 runs, 1 assertions, 0 failures, 0 errors, 1 skips
    EOM

    assert_report expected, %w[--seed 42 --verbose]
  end

  def test_run_skip_show_skips
    @tu =
    Class.new FakeNamedTest do
      def test_something
        assert true
      end

      def test_skip
        skip "not yet"
      end
    end

    expected = clean <<-EOM
      .S

      Finished in 0.00

        1) Skipped:
      FakeNamedTestXX#test_skip [FILE:LINE]:
      not yet

      2 runs, 1 assertions, 0 failures, 0 errors, 1 skips
    EOM

    assert_report expected, %w[--seed 42 --show-skips]
  end

  def test_run_with_other_runner
    @tu =
    Class.new FakeNamedTest do
      def self.run reporter, options = {}
        @reporter = reporter
        before_my_suite
        super
      end

      def self.name; "wacky!" end

      def self.before_my_suite
        @reporter.io.puts "Running #{self.name} tests"
        @@foo = 1
      end

      def test_something
        assert_equal 1, @@foo
      end

      def test_something_else
        assert_equal 1, @@foo
      end
    end

    expected = clean <<-EOM
      Running wacky! tests
      ..

      Finished in 0.00

      2 runs, 2 assertions, 0 failures, 0 errors, 0 skips
    EOM

    assert_report expected
  end

  require "monitor"

  class Latch
    def initialize count = 1
      @count = count
      @lock  = Monitor.new
      @cv    = @lock.new_cond
    end

    def release
      @lock.synchronize do
        @count -= 1 if @count > 0
        @cv.broadcast if @count == 0
      end
    end

    def await
      @lock.synchronize { @cv.wait_while { @count > 0 } }
    end
  end

  def test_run_parallel
    test_count = 2
    test_latch = Latch.new test_count
    wait_latch = Latch.new test_count
    main_latch = Latch.new

    thread = Thread.new {
      Thread.current.abort_on_exception = true

      # This latch waits until both test latches have been released.  Both
      # latches can't be released unless done in separate threads because
      # `main_latch` keeps the test method from finishing.
      test_latch.await
      main_latch.release
    }

    @tu =
    Class.new FakeNamedTest do
      parallelize_me!

      test_count.times do |i|
        define_method :"test_wait_on_main_thread_#{i}" do
          test_latch.release

          # This latch blocks until the "main thread" releases it. The main
          # thread can't release this latch until both test latches have
          # been released.  This forces the latches to be released in separate
          # threads.
          main_latch.await
          assert true
        end
      end
    end

    expected = clean <<-EOM
      ..

      Finished in 0.00

      2 runs, 2 assertions, 0 failures, 0 errors, 0 skips
    EOM

    skip if Minitest.parallel_executor.size < 2 # locks up test runner if 1 CPU

    assert_report(expected) do |reporter|
      reporter.extend(Module.new {
        define_method("record") do |result|
          super(result)
          wait_latch.release
        end

        define_method("report") do
          wait_latch.await
          super()
        end
      })
    end
    assert thread.join
  end
end

class TestMinitestUnitOrder < MetaMetaMetaTestCase
  # do not parallelize this suite... it just can't handle it.

  def test_before_setup
    call_order = []
    @tu =
    Class.new FakeNamedTest do
      define_method :setup do
        super()
        call_order << :setup
      end

      define_method :before_setup do
        call_order << :before_setup
      end

      def test_omg; assert true; end
    end

    run_tu_with_fresh_reporter

    expected = [:before_setup, :setup]
    assert_equal expected, call_order
  end

  def test_after_teardown
    call_order = []
    @tu =
    Class.new FakeNamedTest do
      define_method :teardown do
        super()
        call_order << :teardown
      end

      define_method :after_teardown do
        call_order << :after_teardown
      end

      def test_omg; assert true; end
    end

    run_tu_with_fresh_reporter

    expected = [:teardown, :after_teardown]
    assert_equal expected, call_order
  end

  def test_all_teardowns_are_guaranteed_to_run
    call_order = []
    @tu =
    Class.new FakeNamedTest do
      define_method :after_teardown do
        super()
        call_order << :after_teardown
        raise
      end

      define_method :teardown do
        super()
        call_order << :teardown
        raise
      end

      define_method :before_teardown do
        super()
        call_order << :before_teardown
        raise
      end

      def test_omg; assert true; end
    end

    run_tu_with_fresh_reporter

    expected = [:before_teardown, :teardown, :after_teardown]
    assert_equal expected, call_order
  end

  def test_setup_and_teardown_survive_inheritance
    call_order = []

    @tu = Class.new FakeNamedTest do
      define_method :setup do
        call_order << :setup_method
      end

      define_method :teardown do
        call_order << :teardown_method
      end

      define_method :test_something do
        call_order << :test
      end
    end

    run_tu_with_fresh_reporter

    @tu = Class.new @tu
    run_tu_with_fresh_reporter

    # Once for the parent class, once for the child
    expected = [:setup_method, :test, :teardown_method] * 2

    assert_equal expected, call_order
  end
end

class BetterError < RuntimeError # like better_error w/o infecting RuntimeError
  def set_backtrace bt
    super
    @bad_ivar = binding
  end
end

class TestMinitestRunnable < Minitest::Test
  def setup_marshal klass
    tc = klass.new "whatever"
    tc.assertions = 42
    tc.failures << "a failure"

    yield tc if block_given?

    def tc.setup
      @blah = "blah"
    end
    tc.setup

    @tc = Minitest::Result.from tc
  end

  def assert_marshal expected_ivars
    new_tc = Marshal.load Marshal.dump @tc

    ivars = new_tc.instance_variables.map(&:to_s).sort
    assert_equal expected_ivars, ivars
    assert_equal "whatever",     new_tc.name
    assert_equal 42,             new_tc.assertions
    assert_equal ["a failure"],  new_tc.failures

    yield new_tc if block_given?
  end

  def test_marshal
    setup_marshal Minitest::Runnable

    assert_marshal %w[@NAME @assertions @failures @klass @source_location @time]
  end

  def test_spec_marshal
    klass = describe("whatever") { it("passes") { assert true } }
    rm = klass.runnable_methods.first

    # Run the test
    @tc = klass.new(rm).run

    assert_kind_of Minitest::Result, @tc

    # Pass it over the wire
    over_the_wire = Marshal.load Marshal.dump @tc

    assert_equal @tc.time,       over_the_wire.time
    assert_equal @tc.name,       over_the_wire.name
    assert_equal @tc.assertions, over_the_wire.assertions
    assert_equal @tc.failures,   over_the_wire.failures
    assert_equal @tc.klass,      over_the_wire.klass
  end

  def test_spec_marshal_with_exception
    klass = describe("whatever") {
      it("raises, badly") {
        raise Class.new(StandardError), "this is bad!"
      }
    }

    rm = klass.runnable_methods.first

    # Run the test
    @tc = klass.new(rm).run

    assert_kind_of Minitest::Result, @tc
    assert_instance_of Minitest::UnexpectedError, @tc.failure

    msg = @tc.failure.error.message
    assert_includes msg, "Neutered Exception #<Class:"
    assert_includes msg, "this is bad!"

    # Pass it over the wire
    over_the_wire = Marshal.load Marshal.dump @tc

    assert_equal @tc.time,       over_the_wire.time
    assert_equal @tc.name,       over_the_wire.name
    assert_equal @tc.assertions, over_the_wire.assertions
    assert_equal @tc.failures,   over_the_wire.failures
    assert_equal @tc.klass,      over_the_wire.klass
  end

  def test_spec_marshal_with_exception_nameerror
    klass = describe("whatever") {
      it("raises nameerror") {
        NOPE::does_not_exist
      }
    }

    rm = klass.runnable_methods.first

    # Run the test
    @tc = klass.new(rm).run

    assert_kind_of Minitest::Result, @tc
    assert_instance_of Minitest::UnexpectedError, @tc.failure

    msg = @tc.failure.error.message
    assert_includes msg, "uninitialized constant TestMinitestRunnable::NOPE"

    # Pass it over the wire
    over_the_wire = Marshal.load Marshal.dump @tc

    assert_equal @tc.time,       over_the_wire.time
    assert_equal @tc.name,       over_the_wire.name
    assert_equal @tc.assertions, over_the_wire.assertions
    assert_equal @tc.failures,   over_the_wire.failures
    assert_equal @tc.klass,      over_the_wire.klass
  end

  def with_runtime_error klass
    old_runtime = RuntimeError
    Object.send :remove_const, :RuntimeError
    Object.const_set :RuntimeError, klass
    yield
  ensure
    Object.send :remove_const, :RuntimeError
    Object.const_set :RuntimeError, old_runtime
  end

  def test_spec_marshal_with_exception__better_error_typeerror
    klass = describe("whatever") {
      it("raises with binding") {
        raise BetterError, "boom"
      }
    }

    rm = klass.runnable_methods.first

    # Run the test
    @tc = with_runtime_error BetterError do
      klass.new(rm).run
    end

    assert_kind_of Minitest::Result, @tc
    assert_instance_of Minitest::UnexpectedError, @tc.failure

    msg = @tc.failure.error.message
    assert_equal "Neutered Exception BetterError: boom", msg

    # Pass it over the wire
    over_the_wire = Marshal.load Marshal.dump @tc

    assert_equal @tc.time,       over_the_wire.time
    assert_equal @tc.name,       over_the_wire.name
    assert_equal @tc.assertions, over_the_wire.assertions
    assert_equal @tc.failures,   over_the_wire.failures
    assert_equal @tc.klass,      over_the_wire.klass
  end

  def test_spec_marshal_with_exception__worse_error_typeerror
    worse_error_klass = Class.new(StandardError) do
      # problem #1: anonymous subclass can'tmarshal, fails sanitize_exception
      def initialize(record = nil)

        super(record.first)
      end
    end

    klass = describe("whatever") {
      it("raises with NoMethodError") {
        # problem #2: instantiated with a NON-string argument
        #
        # problem #3: arg responds to #first, but it becomes message
        #             which gets passed back in via new_exception
        #             that passes a string to worse_error_klass#initialize
        #             which calls first on it, which raises NoMethodError
        raise worse_error_klass.new(["boom"])
      }
    }

    rm = klass.runnable_methods.first

    # Run the test
    @tc = klass.new(rm).run

    assert_kind_of Minitest::Result, @tc
    assert_instance_of Minitest::UnexpectedError, @tc.failure

    msg = @tc.failure.error.message.gsub(/0x[A-Fa-f0-9]+/, "0xXXX")

    assert_equal "Neutered Exception #<Class:0xXXX>: boom", msg

    # Pass it over the wire
    over_the_wire = Marshal.load Marshal.dump @tc

    assert_equal @tc.time,       over_the_wire.time
    assert_equal @tc.name,       over_the_wire.name
    assert_equal @tc.assertions, over_the_wire.assertions
    assert_equal @tc.failures,   over_the_wire.failures
    assert_equal @tc.klass,      over_the_wire.klass
  end
end

class TestMinitestTest < TestMinitestRunnable
  def test_dup
    setup_marshal Minitest::Test do |tc|
      tc.time = 3.14
    end

    assert_marshal %w[@NAME @assertions @failures @klass @source_location @time] do |new_tc|
      assert_in_epsilon 3.14, new_tc.time
    end
  end
end

class TestMinitestUnitTestCase < Minitest::Test
  # do not call parallelize_me! - teardown accesses @tc._assertions
  # which is not threadsafe. Nearly every method in here is an
  # assertion test so it isn't worth splitting it out further.

  RUBY18 = !defined? Encoding

  def setup
    super

    Minitest::Test.reset

    @tc = Minitest::Test.new "fake tc"
    @zomg = "zomg ponies!"
    @assertion_count = 1
  end

  def teardown
    assert_equal(@assertion_count, @tc.assertions,
                 "expected #{@assertion_count} assertions to be fired during the test, not #{@tc.assertions}") if @tc.passed?
  end

  def non_verbose
    orig_verbose = $VERBOSE
    $VERBOSE = false

    yield
  ensure
    $VERBOSE = orig_verbose
  end

  def sample_test_case(rand)
    srand rand
    Class.new FakeNamedTest do
      100.times do |i|
        define_method("test_#{i}") { assert true }
      end
    end.runnable_methods
  end

  # srand varies with OS
  def test_runnable_methods_random
    @assertion_count = 0

    random_tests_1 = sample_test_case 42
    random_tests_2 = sample_test_case 42
    random_tests_3 = sample_test_case 1_000

    assert_equal random_tests_1, random_tests_2
    assert_equal random_tests_1, random_tests_3
  end

  def test_runnable_methods_sorted
    @assertion_count = 0

    sample_test_case = Class.new FakeNamedTest do
      def self.test_order; :sorted end
      def test_test3; assert "does not matter" end
      def test_test2; assert "does not matter" end
      def test_test1; assert "does not matter" end
    end

    expected = %w[test_test1 test_test2 test_test3]
    assert_equal expected, sample_test_case.runnable_methods
  end

  def test_i_suck_and_my_tests_are_order_dependent_bang_sets_test_order_alpha
    @assertion_count = 0

    shitty_test_case = Class.new FakeNamedTest

    shitty_test_case.i_suck_and_my_tests_are_order_dependent!

    assert_equal :alpha, shitty_test_case.test_order
  end

  def test_i_suck_and_my_tests_are_order_dependent_bang_does_not_warn
    @assertion_count = 0

    shitty_test_case = Class.new FakeNamedTest

    def shitty_test_case.test_order; :lol end

    assert_silent do
      shitty_test_case.i_suck_and_my_tests_are_order_dependent!
    end
  end

  def test_autorun_does_not_affect_fork_success_status
    @assertion_count = 0
    skip "windows doesn't have fork" unless Process.respond_to?(:fork)
    Process.waitpid(fork {})
    assert_equal true, $?.success?
  end

  def test_autorun_does_not_affect_fork_exit_status
    @assertion_count = 0
    skip "windows doesn't have fork" unless Process.respond_to?(:fork)
    Process.waitpid(fork { exit 42 })
    assert_equal 42, $?.exitstatus
  end

  def test_autorun_optionally_can_affect_fork_exit_status
    @assertion_count = 0
    skip "windows doesn't have fork" unless Process.respond_to?(:fork)
    Minitest.allow_fork = true
    Process.waitpid(fork { exit 42 })
    refute_equal 42, $?.exitstatus
  ensure
    Minitest.allow_fork = false
  end
end

class TestMinitestGuard < Minitest::Test
  parallelize_me!

  def test_mri_eh
    assert self.class.mri? "ruby blah"
    assert self.mri? "ruby blah"
  end

  def test_jruby_eh
    assert self.class.jruby? "java"
    assert self.jruby? "java"
  end

  def test_rubinius_eh
    assert_output "", /DEPRECATED/ do
      assert self.class.rubinius? "rbx"
    end
    assert_output "", /DEPRECATED/ do
      assert self.rubinius? "rbx"
    end
  end

  def test_maglev_eh
    assert_output "", /DEPRECATED/ do
      assert self.class.maglev? "maglev"
    end
    assert_output "", /DEPRECATED/ do
      assert self.maglev? "maglev"
    end
  end

  def test_osx_eh
    assert self.class.osx? "darwin"
    assert self.osx? "darwin"
  end

  def test_windows_eh
    assert self.class.windows? "mswin"
    assert self.windows? "mswin"
  end
end

class TestMinitestUnitRecording < MetaMetaMetaTestCase
  # do not parallelize this suite... it just can't handle it.

  def assert_run_record *expected, &block
    @tu = Class.new FakeNamedTest, &block

    run_tu_with_fresh_reporter

    recorded = first_reporter.results.map(&:failures).flatten.map { |f| f.error.class }

    assert_equal expected, recorded
  end

  def test_run_with_bogus_reporter
    # https://github.com/seattlerb/minitest/issues/659
    # TODO: remove test for minitest 6
    @tu = Class.new FakeNamedTest do
      def test_method
        assert true
      end
    end

    bogus_reporter = Class.new do      # doesn't subclass AbstractReporter
      def start; @success = false; end
      # def prerecord klass, name; end # doesn't define full API
      def record result; @success = true; end
      def report; end
      def passed?; end
      def results; end
      def success?; @success; end
    end.new

    self.reporter = Minitest::CompositeReporter.new
    reporter << bogus_reporter

    Minitest::Runnable.runnables.delete @tu

    @tu.run reporter, {}

    assert_predicate bogus_reporter, :success?
  end

  def test_record_passing
    assert_run_record do
      def test_method
        assert true
      end
    end
  end

  def test_record_failing
    assert_run_record Minitest::Assertion do
      def test_method
        assert false
      end
    end
  end

  def test_record_error
    assert_run_record RuntimeError do
      def test_method
        raise "unhandled exception"
      end
    end
  end

  def test_record_error_teardown
    assert_run_record RuntimeError do
      def test_method
        assert true
      end

      def teardown
        raise "unhandled exception"
      end
    end
  end

  def test_record_error_in_test_and_teardown
    assert_run_record AnError, RuntimeError do
      def test_method
        raise AnError
      end

      def teardown
        raise "unhandled exception"
      end
    end
  end

  def test_to_s_error_in_test_and_teardown
    @tu = Class.new FakeNamedTest do
      def test_method
        raise AnError
      end

      def teardown
        raise "unhandled exception"
      end
    end

    run_tu_with_fresh_reporter

    exp = clean "
      Error:
      FakeNamedTestXX#test_method:
      AnError: AnError
          FILE:LINE:in `test_method'

      Error:
      FakeNamedTestXX#test_method:
      RuntimeError: unhandled exception
          FILE:LINE:in `teardown'
    "

    assert_equal exp.strip, normalize_output(first_reporter.results.first.to_s).strip
  end

  def test_record_skip
    assert_run_record Minitest::Skip do
      def test_method
        skip "not yet"
      end
    end
  end
end

class TestUnexpectedError < Minitest::Test
  def assert_compress exp, input
    e = Minitest::UnexpectedError.new RuntimeError.new

    exp = exp.lines.map(&:chomp) if String === exp
    act = e.compress input

    assert_equal exp, act
  end

  ACT1 = %w[ a b c b c b c b c d ]

  def test_normal
    assert_compress <<~EXP, %w[ a b c b c b c b c d ]
          a
           +->> 4 cycles of 2 lines:
           | b
           | c
           +-<<
          d
        EXP
  end

  def test_normal2
    assert_compress <<~EXP, %w[ a b c b c b c b c ]
          a
           +->> 4 cycles of 2 lines:
           | b
           | c
           +-<<
        EXP
  end

  def test_longer_c_than_b
    # the extra c in the front makes the overall length longer sorting it first
    assert_compress <<~EXP, %w[ c a b c b c b c b c b d ]
          c
          a
          b
           +->> 4 cycles of 2 lines:
           | c
           | b
           +-<<
          d
        EXP
  end

  def test_1_line_cycles
    assert_compress <<~EXP, %w[ c a b c b c b c b c b b b d ]
          c
          a
           +->> 4 cycles of 2 lines:
           | b
           | c
           +-<<
           +->> 3 cycles of 1 lines:
           | b
           +-<<
          d
        EXP
  end

  def test_sanity3
    pre  = ("aa".."am").to_a
    mid  = ("a".."z").to_a * 67
    post = ("aa".."am").to_a
    ary  = pre + mid + post

    exp = pre +
      [" +->> 67 cycles of 26 lines:"] +
      ("a".."z").map { |s| " | #{s}" } +
      [" +-<<"] +
      post

    assert_compress exp, ary
  end

  def test_absurd_patterns
    assert_compress <<~EXP, %w[ a b c b c a b c b c a b c ]
           +->> 2 cycles of 5 lines:
           | a
           |  +->> 2 cycles of 2 lines:
           |  | b
           |  | c
           |  +-<<
           +-<<
          a
          b
          c
        EXP
  end
end
