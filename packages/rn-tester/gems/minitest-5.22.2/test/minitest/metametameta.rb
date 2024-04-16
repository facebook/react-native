require "tempfile"
require "stringio"
require "minitest/autorun"

class Minitest::Test
  def clean s
    s.gsub(/^ {6}/, "")
  end

  def with_empty_backtrace_filter
    with_backtrace_filter Minitest::BacktraceFilter.new %r%.% do
      yield
    end
  end

  def with_backtrace_filter filter
    original = Minitest.backtrace_filter

    Minitest::Test.io_lock.synchronize do # try not to trounce in parallel
      begin
        Minitest.backtrace_filter = filter
        yield
      ensure
        Minitest.backtrace_filter = original
      end
    end
  end
end


class FakeNamedTest < Minitest::Test
  @@count = 0

  def self.name
    @fake_name ||= begin
                     @@count += 1
                     "FakeNamedTest%02d" % @@count
                   end
  end
end

module MyModule; end
class AnError < StandardError; include MyModule; end

class MetaMetaMetaTestCase < Minitest::Test
  attr_accessor :reporter, :output, :tu

  def with_stderr err
    old = $stderr
    $stderr = err
    yield
  ensure
    $stderr = old
  end

  def run_tu_with_fresh_reporter flags = %w[--seed 42]
    options = Minitest.process_args flags

    @output = StringIO.new("".encode('UTF-8'))

    self.reporter = Minitest::CompositeReporter.new
    reporter << Minitest::SummaryReporter.new(@output, options)
    reporter << Minitest::ProgressReporter.new(@output, options)

    with_stderr @output do
      reporter.start

      yield(reporter) if block_given?

      @tus ||= [@tu]
      @tus.each do |tu|
        Minitest::Runnable.runnables.delete tu

        tu.run reporter, options
      end

      reporter.report
    end
  end

  def first_reporter
    reporter.reporters.first
  end

  def assert_report expected, flags = %w[--seed 42], &block
    header = clean <<-EOM
      Run options: #{flags.map { |s| s =~ /\|/ ? s.inspect : s }.join " "}

      # Running:

    EOM

    run_tu_with_fresh_reporter flags, &block

    output = normalize_output @output.string.dup

    assert_equal header + expected, output
  end

  def normalize_output output
    output.sub!(/Finished in .*/, "Finished in 0.00")
    output.sub!(/Loaded suite .*/, "Loaded suite blah")

    output.gsub!(/FakeNamedTest\d+/, "FakeNamedTestXX")
    output.gsub!(/ = \d+.\d\d s = /, " = 0.00 s = ")
    output.gsub!(/0x[A-Fa-f0-9]+/, "0xXXX")
    output.gsub!(/ +$/, "")

    file = ->(s) { s.start_with?("/") ? "FULLFILE" : "FILE" }

    if windows? then
      output.gsub!(/\[(?:[A-Za-z]:)?[^\]:]+:\d+\]/, "[FILE:LINE]")
      output.gsub!(/^(\s+)(?:[A-Za-z]:)?[^:]+:\d+:in/, '\1FILE:LINE:in')
    else
      output.gsub!(/\[([^\]:]+):\d+\]/)    {     "[#{file[$1]}:LINE]"   }
      output.gsub!(/^(\s+)([^:]+):\d+:in/) { "#{$1}#{file[$2]}:LINE:in" }
    end

    output.gsub!(/( at )[^:]+:\d+/) { "#{$1}[#{file[$2]}:LINE]" } # eval?

    output
  end

  def restore_env
    old_value = ENV["MT_NO_SKIP_MSG"]
    ENV.delete "MT_NO_SKIP_MSG"

    yield
  ensure
    ENV["MT_NO_SKIP_MSG"] = old_value
  end

  def setup
    super
    Minitest.seed = 42
    Minitest::Test.reset
    @tu = nil
  end
end
