require "minitest/autorun"
require "minitest/metametameta"
require "forwardable"

class Runnable
  def woot
    assert true
  end
end

class TestMinitestReporter < MetaMetaMetaTestCase

  attr_accessor :r, :io

  def new_composite_reporter
    # Ruby bug in older versions of 2.2 & 2.3 on all platforms
    # Latest Windows builds were 2.2.6 and 2.3.3.  Latest Ruby releases were
    # 2.2.10 and 2.3.8.
    skip if windows? && RUBY_VERSION < '2.4'
    reporter = Minitest::CompositeReporter.new
    reporter << Minitest::SummaryReporter.new(self.io)
    reporter << Minitest::ProgressReporter.new(self.io)

    # eg reporter.results -> reporters.first.results
    reporter.extend Forwardable
    reporter.delegate :first => :reporters
    reporter.delegate %i[results count assertions options to_s] => :first

    reporter
  end

  def setup
    super
    self.io = StringIO.new("")
    self.r  = new_composite_reporter
  end

  def error_test
    unless defined? @et then
      @et = Minitest::Test.new(:woot)
      @et.failures << Minitest::UnexpectedError.new(begin
                                                      raise "no"
                                                    rescue => e
                                                      e
                                                    end)
      @et = Minitest::Result.from @et
    end
    @et
  end

  def system_stack_error_test
    unless defined? @sse then

      ex = SystemStackError.new

      pre  = ("a".."c").to_a
      mid  = ("aa".."ad").to_a * 67
      post = ("d".."f").to_a
      ary  = pre + mid + post

      ex.set_backtrace ary

      @sse = Minitest::Test.new(:woot)
      @sse.failures << Minitest::UnexpectedError.new(ex)
      @sse = Minitest::Result.from @sse
    end
    @sse
  end

  def fail_test
    unless defined? @ft then
      @ft = Minitest::Test.new(:woot)
      @ft.failures <<   begin
                          raise Minitest::Assertion, "boo"
                        rescue Minitest::Assertion => e
                          e
                        end
      @ft = Minitest::Result.from @ft
    end
    @ft
  end

  def passing_test
    @pt ||= Minitest::Result.from Minitest::Test.new(:woot)
  end

  def passing_test_with_metadata
    test = Minitest::Test.new(:woot)
    test.metadata[:meta] = :data
    @pt ||= Minitest::Result.from test
  end

  def skip_test
    unless defined? @st then
      @st = Minitest::Test.new(:woot)
      @st.failures << begin
                        raise Minitest::Skip
                      rescue Minitest::Assertion => e
                        e
                      end
      @st = Minitest::Result.from @st
    end
    @st
  end

  def test_to_s
    r.record passing_test
    r.record fail_test
    assert_match "woot", r.to_s
  end

  def test_options_skip_F
    r.options[:skip] = "F"

    r.record passing_test
    r.record fail_test

    refute_match "woot", r.to_s
  end

  def test_options_skip_E
    r.options[:skip] = "E"

    r.record passing_test
    r.record error_test

    refute_match "RuntimeError: no", r.to_s
  end

  def test_passed_eh_empty
    assert_predicate r, :passed?
  end

  def test_passed_eh_failure
    r.results << fail_test

    refute_predicate r, :passed?
  end

  SKIP_MSG = "\n\nYou have skipped tests. Run with --verbose for details."

  def test_passed_eh_error
    r.start

    r.results << error_test

    refute_predicate r, :passed?

    r.report

    refute_match SKIP_MSG, io.string
  end

  def test_passed_eh_skipped
    r.start
    r.results << skip_test
    assert r.passed?

    restore_env do
      r.report
    end

    assert_match SKIP_MSG, io.string
  end

  def test_passed_eh_skipped_verbose
    r.options[:verbose] = true

    r.start
    r.results << skip_test
    assert r.passed?
    r.report

    refute_match SKIP_MSG, io.string
  end

  def test_start
    r.start

    exp = "Run options: \n\n# Running:\n\n"

    assert_equal exp, io.string
  end

  def test_record_pass
    r.record passing_test

    assert_equal ".", io.string
    assert_empty r.results
    assert_equal 1, r.count
    assert_equal 0, r.assertions
  end

  def test_record_pass_with_metadata
    reporter = self.r

    def reporter.metadata
      @metadata
    end

    def reporter.record result
      super
      @metadata = result.metadata if result.metadata?
    end

    r.record passing_test_with_metadata

    exp = { :meta => :data }
    assert_equal exp, reporter.metadata

    assert_equal ".", io.string
    assert_empty r.results
    assert_equal 1, r.count
    assert_equal 0, r.assertions
  end

  def test_record_fail
    fail_test = self.fail_test
    r.record fail_test

    assert_equal "F", io.string
    assert_equal [fail_test], r.results
    assert_equal 1, r.count
    assert_equal 0, r.assertions
  end

  def test_record_error
    error_test = self.error_test
    r.record error_test

    assert_equal "E", io.string
    assert_equal [error_test], r.results
    assert_equal 1, r.count
    assert_equal 0, r.assertions
  end

  def test_record_skip
    skip_test = self.skip_test
    r.record skip_test

    assert_equal "S", io.string
    assert_equal [skip_test], r.results
    assert_equal 1, r.count
    assert_equal 0, r.assertions
  end

  def test_report_empty
    r.start
    r.report

    exp = clean <<-EOM
      Run options:

      # Running:



      Finished in 0.00

      0 runs, 0 assertions, 0 failures, 0 errors, 0 skips
    EOM

    assert_equal exp, normalize_output(io.string)
  end

  def test_report_passing
    r.start
    r.record passing_test
    r.report

    exp = clean <<-EOM
      Run options:

      # Running:

      .

      Finished in 0.00

      1 runs, 0 assertions, 0 failures, 0 errors, 0 skips
    EOM

    assert_equal exp, normalize_output(io.string)
  end

  def test_report_failure
    r.start
    r.record fail_test
    r.report

    exp = clean <<-EOM
      Run options:

      # Running:

      F

      Finished in 0.00

        1) Failure:
      Minitest::Test#woot [FILE:LINE]:
      boo

      1 runs, 0 assertions, 1 failures, 0 errors, 0 skips
    EOM

    assert_equal exp, normalize_output(io.string)
  end

  def test_report_error
    r.start
    r.record error_test
    r.report

    exp = clean <<-EOM
      Run options:

      # Running:

      E

      Finished in 0.00

        1) Error:
      Minitest::Test#woot:
      RuntimeError: no
          FILE:LINE:in `error_test'
          FILE:LINE:in `test_report_error'

      1 runs, 0 assertions, 0 failures, 1 errors, 0 skips
    EOM

    assert_equal exp, normalize_output(io.string)
  end

  def test_report_error__sse
    r.start
    r.record system_stack_error_test
    r.report

    exp = clean <<-EOM
      Run options:

      # Running:

      E

      Finished in 0.00

        1) Error:
      Minitest::Test#woot:
      SystemStackError: 274 -> 12
          a
          b
          c
           +->> 67 cycles of 4 lines:
           | aa
           | ab
           | ac
           | ad
           +-<<
          d
          e
          f

      1 runs, 0 assertions, 0 failures, 1 errors, 0 skips
    EOM

    assert_equal exp, normalize_output(io.string)
  end

  def test_report_skipped
    r.start
    r.record skip_test

    restore_env do
      r.report
    end

    exp = clean <<-EOM
      Run options:

      # Running:

      S

      Finished in 0.00

      1 runs, 0 assertions, 0 failures, 0 errors, 1 skips

      You have skipped tests. Run with --verbose for details.
    EOM

    assert_equal exp, normalize_output(io.string)
  end

  def test_report_failure_uses_backtrace_filter
    filter = Minitest::BacktraceFilter.new
    def filter.filter _bt
      ["foo.rb:123:in `foo'"]
    end

    with_backtrace_filter filter do
      r.start
      r.record fail_test
      r.report
    end

    exp = "Minitest::Test#woot [foo.rb:123]"

    assert_includes io.string, exp
  end

  def test_report_failure_uses_backtrace_filter_complex_sorbet
    backtrace = <<~EOBT
      /Users/user/.gem/ruby/3.2.2/gems/minitest-5.20.0/lib/minitest/assertions.rb:183:in `assert'
      example_test.rb:9:in `assert_false'
      /Users/user/.gem/ruby/3.2.2/gems/sorbet-runtime-0.5.11068/lib/types/private/methods/call_validation.rb:256:in `bind_call'
      /Users/user/.gem/ruby/3.2.2/gems/sorbet-runtime-0.5.11068/lib/types/private/methods/call_validation.rb:256:in `validate_call'
      /Users/user/.gem/ruby/3.2.2/gems/sorbet-runtime-0.5.11068/lib/types/private/methods/_methods.rb:275:in `block in _on_method_added'
      example_test.rb:25:in `test_something'
      /Users/user/.gem/ruby/3.2.2/gems/minitest-5.20.0/lib/minitest/test.rb:94:in `block (3 levels) in run'
      /Users/user/.gem/ruby/3.2.2/gems/minitest-5.20.0/lib/minitest/test.rb:191:in `capture_exceptions'
      /Users/user/.gem/ruby/3.2.2/gems/minitest-5.20.0/lib/minitest/test.rb:89:in `block (2 levels) in run'
      ... so many lines ...
    EOBT

    filter = Minitest::BacktraceFilter.new %r%lib/minitest|gems/sorbet%

    with_backtrace_filter filter do
      begin
        assert_equal 1, 2
      rescue Minitest::Assertion => e
        e.set_backtrace backtrace.lines.map(&:chomp)

        assert_match "example_test.rb:25", e.location
      end
    end
  end
end
