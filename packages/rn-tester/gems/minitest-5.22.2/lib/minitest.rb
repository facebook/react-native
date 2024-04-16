require "optparse"
require "stringio"
require "etc"

require_relative "minitest/parallel"
require_relative "minitest/compress"

##
# :include: README.rdoc

module Minitest
  VERSION = "5.22.2" # :nodoc:

  @@installed_at_exit ||= false
  @@after_run = []
  @extensions = []

  def self.cattr_accessor name # :nodoc:
    (class << self; self; end).attr_accessor name
  end

  ##
  # The random seed used for this run. This is used to srand at the
  # start of the run and between each +Runnable.run+.
  #
  # Set via Minitest.run after processing args.

  cattr_accessor :seed

  ##
  # Parallel test executor

  cattr_accessor :parallel_executor

  warn "DEPRECATED: use MT_CPU instead of N for parallel test runs" if ENV["N"] && ENV["N"].to_i > 0
  n_threads = (ENV["MT_CPU"] || ENV["N"] || Etc.nprocessors).to_i

  self.parallel_executor = Parallel::Executor.new n_threads

  ##
  # Filter object for backtraces.

  cattr_accessor :backtrace_filter

  ##
  # Reporter object to be used for all runs.
  #
  # NOTE: This accessor is only available during setup, not during runs.

  cattr_accessor :reporter

  ##
  # Names of known extension plugins.

  cattr_accessor :extensions

  ##
  # The signal to use for dumping information to STDERR. Defaults to "INFO".

  cattr_accessor :info_signal
  self.info_signal = "INFO"

  cattr_accessor :allow_fork
  self.allow_fork = false

  ##
  # Registers Minitest to run at process exit

  def self.autorun
    if Object.const_defined?(:Warning) && Warning.respond_to?(:[]=)
      Warning[:deprecated] = true
    end

    at_exit {
      next if $! and not ($!.kind_of? SystemExit and $!.success?)

      exit_code = nil

      pid = Process.pid
      at_exit {
        next if !Minitest.allow_fork && Process.pid != pid
        @@after_run.reverse_each(&:call)
        exit exit_code || false
      }

      exit_code = Minitest.run ARGV
    } unless @@installed_at_exit
    @@installed_at_exit = true
  end

  ##
  # A simple hook allowing you to run a block of code after everything
  # is done running. Eg:
  #
  #   Minitest.after_run { p $debugging_info }

  def self.after_run &block
    @@after_run << block
  end

  def self.init_plugins options # :nodoc:
    self.extensions.each do |name|
      msg = "plugin_#{name}_init"
      send msg, options if self.respond_to? msg
    end
  end

  def self.load_plugins # :nodoc:
    return unless self.extensions.empty?

    seen = {}

    require "rubygems" unless defined? Gem

    Gem.find_files("minitest/*_plugin.rb").each do |plugin_path|
      name = File.basename plugin_path, "_plugin.rb"

      next if seen[name]
      seen[name] = true

      require plugin_path
      self.extensions << name
    end
  end

  ##
  # This is the top-level run method. Everything starts from here. It
  # tells each Runnable sub-class to run, and each of those are
  # responsible for doing whatever they do.
  #
  # The overall structure of a run looks like this:
  #
  #   Minitest.autorun
  #     Minitest.run(args)
  #       Minitest.__run(reporter, options)
  #         Runnable.runnables.each
  #           runnable_klass.run(reporter, options)
  #             self.runnable_methods.each
  #               self.run_one_method(self, runnable_method, reporter)
  #                 Minitest.run_one_method(klass, runnable_method)
  #                   klass.new(runnable_method).run

  def self.run args = []
    self.load_plugins unless args.delete("--no-plugins") || ENV["MT_NO_PLUGINS"]

    options = process_args args

    Minitest.seed = options[:seed]
    srand Minitest.seed

    reporter = CompositeReporter.new
    reporter << SummaryReporter.new(options[:io], options)
    reporter << ProgressReporter.new(options[:io], options) unless options[:quiet]

    self.reporter = reporter # this makes it available to plugins
    self.init_plugins options
    self.reporter = nil # runnables shouldn't depend on the reporter, ever

    self.parallel_executor.start if parallel_executor.respond_to?(:start)
    reporter.start
    begin
      __run reporter, options
    rescue Interrupt
      warn "Interrupted. Exiting..."
    end
    self.parallel_executor.shutdown

    # might have been removed/replaced during init_plugins:
    summary = reporter.reporters.grep(SummaryReporter).first
    return empty_run! options if summary && summary.count == 0

    reporter.report

    reporter.passed?
  end

  def self.empty_run! options # :nodoc:
    filter = options[:filter]
    return true unless filter # no filter, but nothing ran == success

    warn "Nothing ran for filter: %s" % [filter]

    require "did_you_mean" # soft dependency, punt if it doesn't load

    ms = Runnable.runnables.flat_map(&:runnable_methods)
    cs = DidYouMean::SpellChecker.new(dictionary: ms).correct filter

    warn DidYouMean::Formatter.message_for cs unless cs.empty?
  rescue LoadError
    # do nothing
  end

  ##
  # Internal run method. Responsible for telling all Runnable
  # sub-classes to run.

  def self.__run reporter, options
    suites = Runnable.runnables.shuffle
    parallel, serial = suites.partition { |s| s.test_order == :parallel }

    # If we run the parallel tests before the serial tests, the parallel tests
    # could run in parallel with the serial tests. This would be bad because
    # the serial tests won't lock around Reporter#record. Run the serial tests
    # first, so that after they complete, the parallel tests will lock when
    # recording results.
    serial.map { |suite| suite.run reporter, options } +
      parallel.map { |suite| suite.run reporter, options }
  end

  def self.process_args args = [] # :nodoc:
    options = {
               :io => $stdout,
              }
    orig_args = args.dup

    OptionParser.new do |opts|
      opts.banner  = "minitest options:"
      opts.version = Minitest::VERSION

      opts.on "-h", "--help", "Display this help." do
        puts opts
        exit
      end

      opts.on "--no-plugins", "Bypass minitest plugin auto-loading (or set $MT_NO_PLUGINS)."

      desc = "Sets random seed. Also via env. Eg: SEED=n rake"
      opts.on "-s", "--seed SEED", Integer, desc do |m|
        options[:seed] = m.to_i
      end

      opts.on "-v", "--verbose", "Verbose. Show progress processing files." do
        options[:verbose] = true
      end

      opts.on "-q", "--quiet", "Quiet. Show no progress processing files." do
        options[:quiet] = true
      end

      opts.on "--show-skips", "Show skipped at the end of run." do
        options[:show_skips] = true
      end

      opts.on "-n", "--name PATTERN", "Filter run on /regexp/ or string." do |a|
        options[:filter] = a
      end

      opts.on "-e", "--exclude PATTERN", "Exclude /regexp/ or string from run." do |a|
        options[:exclude] = a
      end

      opts.on "-S", "--skip CODES", String, "Skip reporting of certain types of results (eg E)." do |s|
        options[:skip] = s.chars.to_a
      end

      unless extensions.empty?
        opts.separator ""
        opts.separator "Known extensions: #{extensions.join(", ")}"

        extensions.each do |meth|
          msg = "plugin_#{meth}_options"
          send msg, opts, options if self.respond_to?(msg)
        end
      end

      begin
        opts.parse! args
      rescue OptionParser::InvalidOption => e
        puts
        puts e
        puts
        puts opts
        exit 1
      end

      orig_args -= args
    end

    unless options[:seed] then
      srand
      options[:seed] = (ENV["SEED"] || srand).to_i % 0xFFFF
      orig_args << "--seed" << options[:seed].to_s
    end

    options[:args] = orig_args.map { |s|
      s =~ /[\s|&<>$()]/ ? s.inspect : s
    }.join " "

    options
  end

  def self.filter_backtrace bt # :nodoc:
    result = backtrace_filter.filter bt
    result = bt.dup if result.empty?
    result
  end

  ##
  # Represents anything "runnable", like Test, Spec, Benchmark, or
  # whatever you can dream up.
  #
  # Subclasses of this are automatically registered and available in
  # Runnable.runnables.

  class Runnable
    ##
    # Number of assertions executed in this run.

    attr_accessor :assertions

    ##
    # An assertion raised during the run, if any.

    attr_accessor :failures

    ##
    # The time it took to run.

    attr_accessor :time

    def time_it # :nodoc:
      t0 = Minitest.clock_time

      yield
    ensure
      self.time = Minitest.clock_time - t0
    end

    ##
    # Name of the run.

    def name
      @NAME
    end

    ##
    # Set the name of the run.

    def name= o
      @NAME = o
    end

    ##
    # Returns all instance methods matching the pattern +re+.

    def self.methods_matching re
      public_instance_methods(true).grep(re).map(&:to_s)
    end

    def self.reset # :nodoc:
      @@runnables = []
    end

    reset

    ##
    # Responsible for running all runnable methods in a given class,
    # each in its own instance. Each instance is passed to the
    # reporter to record.

    def self.run reporter, options = {}
      pos = options[:filter]
      neg = options[:exclude]

      pos = Regexp.new $1 if pos.is_a?(String) && pos =~ %r%/(.*)/%
      neg = Regexp.new $1 if neg.is_a?(String) && neg =~ %r%/(.*)/%

      filtered_methods = self.runnable_methods
        .select { |m| !pos ||  pos === m || pos === "#{self}##{m}"  }
        .reject { |m|  neg && (neg === m || neg === "#{self}##{m}") }

      return if filtered_methods.empty?

      with_info_handler reporter do
        filtered_methods.each do |method_name|
          run_one_method self, method_name, reporter
        end
      end
    end

    ##
    # Runs a single method and has the reporter record the result.
    # This was considered internal API but is factored out of run so
    # that subclasses can specialize the running of an individual
    # test. See Minitest::ParallelTest::ClassMethods for an example.

    def self.run_one_method klass, method_name, reporter
      reporter.prerecord klass, method_name
      reporter.record Minitest.run_one_method(klass, method_name)
    end

    ##
    # Defines the order to run tests (:random by default). Override
    # this or use a convenience method to change it for your tests.

    def self.test_order
      :random
    end

    def self.with_info_handler reporter, &block # :nodoc:
      handler = lambda do
        unless reporter.passed? then
          warn "Current results:"
          warn ""
          warn reporter.reporters.first
          warn ""
        end
      end

      on_signal ::Minitest.info_signal, handler, &block
    end

    SIGNALS = Signal.list # :nodoc:

    def self.on_signal name, action # :nodoc:
      supported = SIGNALS[name]

      old_trap = trap name do
        old_trap.call if old_trap.respond_to? :call
        action.call
      end if supported

      yield
    ensure
      trap name, old_trap if supported
    end

    ##
    # Each subclass of Runnable is responsible for overriding this
    # method to return all runnable methods. See #methods_matching.

    def self.runnable_methods
      raise NotImplementedError, "subclass responsibility"
    end

    ##
    # Returns all subclasses of Runnable.

    def self.runnables
      @@runnables
    end

    @@marshal_dump_warned = false

    def marshal_dump # :nodoc:
      unless @@marshal_dump_warned then
        warn ["Minitest::Runnable#marshal_dump is deprecated.",
              "You might be violating internals. From", caller.first].join " "
        @@marshal_dump_warned = true
      end

      [self.name, self.failures, self.assertions, self.time]
    end

    def marshal_load ary # :nodoc:
      self.name, self.failures, self.assertions, self.time = ary
    end

    def failure # :nodoc:
      self.failures.first
    end

    def initialize name # :nodoc:
      self.name       = name
      self.failures   = []
      self.assertions = 0
      # lazy initializer for metadata
    end

    ##
    # Metadata you attach to the test results that get sent to the reporter.
    #
    # Lazily initializes to a hash, to keep memory down.
    #
    # NOTE: this data *must* be plain (read: marshal-able) data!
    # Hashes! Arrays! Strings!

    def metadata
      @metadata ||= {}
    end

    ##
    # Sets metadata, mainly used for +Result.from+.

    attr_writer :metadata

    ##
    # Returns true if metadata exists.

    def metadata?
      defined? @metadata
    end

    ##
    # Runs a single method. Needs to return self.

    def run
      raise NotImplementedError, "subclass responsibility"
    end

    ##
    # Did this run pass?
    #
    # Note: skipped runs are not considered passing, but they don't
    # cause the process to exit non-zero.

    def passed?
      raise NotImplementedError, "subclass responsibility"
    end

    ##
    # Returns a single character string to print based on the result
    # of the run. One of <tt>"."</tt>, <tt>"F"</tt>,
    # <tt>"E"</tt> or <tt>"S"</tt>.

    def result_code
      raise NotImplementedError, "subclass responsibility"
    end

    ##
    # Was this run skipped? See #passed? for more information.

    def skipped?
      raise NotImplementedError, "subclass responsibility"
    end
  end

  ##
  # Shared code for anything that can get passed to a Reporter. See
  # Minitest::Test & Minitest::Result.

  module Reportable
    ##
    # Did this run pass?
    #
    # Note: skipped runs are not considered passing, but they don't
    # cause the process to exit non-zero.

    def passed?
      not self.failure
    end

    BASE_DIR = "#{Dir.pwd}/" # :nodoc:

    ##
    # The location identifier of this test. Depends on a method
    # existing called class_name.

    def location
      loc = " [#{self.failure.location.delete_prefix BASE_DIR}]" unless passed? or error?
      "#{self.class_name}##{self.name}#{loc}"
    end

    def class_name # :nodoc:
      raise NotImplementedError, "subclass responsibility"
    end

    ##
    # Returns ".", "F", or "E" based on the result of the run.

    def result_code
      self.failure and self.failure.result_code or "."
    end

    ##
    # Was this run skipped?

    def skipped?
      self.failure and Skip === self.failure
    end

    ##
    # Did this run error?

    def error?
      self.failures.any? { |f| UnexpectedError === f }
    end
  end

  ##
  # This represents a test result in a clean way that can be
  # marshalled over a wire. Tests can do anything they want to the
  # test instance and can create conditions that cause Marshal.dump to
  # blow up. By using Result.from(a_test) you can be reasonably sure
  # that the test result can be marshalled.

  class Result < Runnable
    include Minitest::Reportable

    undef_method :marshal_dump
    undef_method :marshal_load

    ##
    # The class name of the test result.

    attr_accessor :klass

    ##
    # The location of the test method.

    attr_accessor :source_location

    ##
    # Create a new test result from a Runnable instance.

    def self.from runnable
      o = runnable

      r = self.new o.name
      r.klass      = o.class.name
      r.assertions = o.assertions
      r.failures   = o.failures.dup
      r.time       = o.time
      r.metadata   = o.metadata if o.metadata?

      r.source_location = o.method(o.name).source_location rescue ["unknown", -1]

      r
    end

    def class_name # :nodoc:
      self.klass # for Minitest::Reportable
    end

    def to_s # :nodoc:
      return location if passed? and not skipped?

      failures.map { |failure|
        "#{failure.result_label}:\n#{self.location}:\n#{failure.message}\n"
      }.join "\n"
    end
  end

  ##
  # Defines the API for Reporters. Subclass this and override whatever
  # you want. Go nuts.

  class AbstractReporter

    def initialize # :nodoc:
      @mutex = Mutex.new
    end

    ##
    # Starts reporting on the run.

    def start
    end

    ##
    # About to start running a test. This allows a reporter to show
    # that it is starting or that we are in the middle of a test run.

    def prerecord klass, name
    end

    ##
    # Output and record the result of the test. Call
    # {result#result_code}[rdoc-ref:Runnable#result_code] to get the
    # result character string. Stores the result of the run if the run
    # did not pass.

    def record result
    end

    ##
    # Outputs the summary of the run.

    def report
    end

    ##
    # Did this run pass?

    def passed?
      true
    end

    def synchronize(&block) # :nodoc:
      @mutex.synchronize(&block)
    end
  end

  class Reporter < AbstractReporter # :nodoc:
    ##
    # The IO used to report.

    attr_accessor :io

    ##
    # Command-line options for this run.

    attr_accessor :options

    def initialize io = $stdout, options = {} # :nodoc:
      super()
      self.io      = io
      self.options = options
    end
  end

  ##
  # A very simple reporter that prints the "dots" during the run.
  #
  # This is added to the top-level CompositeReporter at the start of
  # the run. If you want to change the output of minitest via a
  # plugin, pull this out of the composite and replace it with your
  # own.

  class ProgressReporter < Reporter
    def prerecord klass, name #:nodoc:
      if options[:verbose] then
        io.print "%s#%s = " % [klass.name, name]
        io.flush
      end
    end

    def record result # :nodoc:
      io.print "%.2f s = " % [result.time] if options[:verbose]
      io.print result.result_code
      io.puts if options[:verbose]
    end
  end

  ##
  # A reporter that gathers statistics about a test run. Does not do
  # any IO because meant to be used as a parent class for a reporter
  # that does.
  #
  # If you want to create an entirely different type of output (eg,
  # CI, HTML, etc), this is the place to start.
  #
  # Example:
  #
  #   class JenkinsCIReporter < StatisticsReporter
  #     def report
  #       super  # Needed to calculate some statistics
  #
  #       print "<testsuite "
  #       print "tests='#{count}' "
  #       print "failures='#{failures}' "
  #       # Remaining XML...
  #     end
  #   end

  class StatisticsReporter < Reporter
    ##
    # Total number of assertions.

    attr_accessor :assertions

    ##
    # Total number of test cases.

    attr_accessor :count

    ##
    # An +Array+ of test cases that failed or were skipped.

    attr_accessor :results

    ##
    # Time the test run started. If available, the monotonic clock is
    # used and this is a +Float+, otherwise it's an instance of
    # +Time+.

    attr_accessor :start_time

    ##
    # Test run time. If available, the monotonic clock is used and
    # this is a +Float+, otherwise it's an instance of +Time+.

    attr_accessor :total_time

    ##
    # Total number of tests that failed.

    attr_accessor :failures

    ##
    # Total number of tests that erred.

    attr_accessor :errors

    ##
    # Total number of tests that where skipped.

    attr_accessor :skips

    def initialize io = $stdout, options = {} # :nodoc:
      super

      self.assertions = 0
      self.count      = 0
      self.results    = []
      self.start_time = nil
      self.total_time = nil
      self.failures   = nil
      self.errors     = nil
      self.skips      = nil
    end

    def passed? # :nodoc:
      results.all?(&:skipped?)
    end

    def start # :nodoc:
      self.start_time = Minitest.clock_time
    end

    def record result # :nodoc:
      self.count += 1
      self.assertions += result.assertions

      results << result if not result.passed? or result.skipped?
    end

    ##
    # Report on the tracked statistics.

    def report
      aggregate = results.group_by { |r| r.failure.class }
      aggregate.default = [] # dumb. group_by should provide this

      self.total_time = Minitest.clock_time - start_time
      self.failures   = aggregate[Assertion].size
      self.errors     = aggregate[UnexpectedError].size
      self.skips      = aggregate[Skip].size
    end
  end

  ##
  # A reporter that prints the header, summary, and failure details at
  # the end of the run.
  #
  # This is added to the top-level CompositeReporter at the start of
  # the run. If you want to change the output of minitest via a
  # plugin, pull this out of the composite and replace it with your
  # own.

  class SummaryReporter < StatisticsReporter
    # :stopdoc:
    attr_accessor :sync
    attr_accessor :old_sync
    # :startdoc:

    def start # :nodoc:
      super

      io.puts "Run options: #{options[:args]}"
      io.puts
      io.puts "# Running:"
      io.puts

      self.sync = io.respond_to? :"sync="
      self.old_sync, io.sync = io.sync, true if self.sync
    end

    def report # :nodoc:
      super

      io.sync = self.old_sync

      io.puts unless options[:verbose] # finish the dots
      io.puts
      io.puts statistics
      aggregated_results io
      io.puts summary
    end

    def statistics # :nodoc:
      "Finished in %.6fs, %.4f runs/s, %.4f assertions/s." %
        [total_time, count / total_time, assertions / total_time]
    end

    def aggregated_results io # :nodoc:
      filtered_results = results.dup
      filtered_results.reject!(&:skipped?) unless
        options[:verbose] or options[:show_skips]

      skip = options[:skip] || []

      filtered_results.each_with_index { |result, i|
        next if skip.include? result.result_code

        io.puts "\n%3d) %s" % [i+1, result]
      }
      io.puts
      io
    end

    def to_s # :nodoc:
      aggregated_results(StringIO.new(''.b)).string
    end

    def summary # :nodoc:
      extra = ""

      extra = "\n\nYou have skipped tests. Run with --verbose for details." if
        results.any?(&:skipped?) unless
        options[:verbose] or options[:show_skips] or ENV["MT_NO_SKIP_MSG"]

      "%d runs, %d assertions, %d failures, %d errors, %d skips%s" %
        [count, assertions, failures, errors, skips, extra]
    end
  end

  ##
  # Dispatch to multiple reporters as one.

  class CompositeReporter < AbstractReporter
    ##
    # The list of reporters to dispatch to.

    attr_accessor :reporters

    def initialize *reporters # :nodoc:
      super()
      self.reporters = reporters
    end

    def io # :nodoc:
      reporters.first.io
    end

    ##
    # Add another reporter to the mix.

    def << reporter
      self.reporters << reporter
    end

    def passed? # :nodoc:
      self.reporters.all?(&:passed?)
    end

    def start # :nodoc:
      self.reporters.each(&:start)
    end

    def prerecord klass, name # :nodoc:
      self.reporters.each do |reporter|
        # TODO: remove conditional for minitest 6
        reporter.prerecord klass, name if reporter.respond_to? :prerecord
      end
    end

    def record result # :nodoc:
      self.reporters.each do |reporter|
        reporter.record result
      end
    end

    def report # :nodoc:
      self.reporters.each(&:report)
    end
  end

  ##
  # Represents run failures.

  class Assertion < Exception
    RE = /in .(?:assert|refute|flunk|pass|fail|raise|must|wont)/ # :nodoc:

    def error # :nodoc:
      self
    end

    ##
    # Where was this run before an assertion was raised?

    def location
      bt  = Minitest.filter_backtrace self.backtrace
      idx = bt.rindex { |s| s.match? RE } || -1 # fall back to first item
      loc = bt[idx+1] || bt.last || "unknown:-1"

      loc.sub(/:in .*$/, "")
    end

    def result_code # :nodoc:
      result_label[0, 1]
    end

    def result_label # :nodoc:
      "Failure"
    end
  end

  ##
  # Assertion raised when skipping a run.

  class Skip < Assertion
    def result_label # :nodoc:
      "Skipped"
    end
  end

  ##
  # Assertion wrapping an unexpected error that was raised during a run.

  class UnexpectedError < Assertion
    include Minitest::Compress

    # TODO: figure out how to use `cause` instead
    attr_accessor :error # :nodoc:

    def initialize error # :nodoc:
      super "Unexpected exception"

      if SystemStackError === error then
        bt = error.backtrace
        new_bt = compress bt
        error = error.exception "#{bt.size} -> #{new_bt.size}"
        error.set_backtrace new_bt
      end

      self.error = error
    end

    def backtrace # :nodoc:
      self.error.backtrace
    end

    BASE_RE = %r%#{Dir.pwd}/% # :nodoc:

    def message # :nodoc:
      bt = Minitest.filter_backtrace(self.backtrace).join("\n    ")
        .gsub(BASE_RE, "")
      "#{self.error.class}: #{self.error.message}\n    #{bt}"
    end

    def result_label # :nodoc:
      "Error"
    end
  end

  ##
  # Provides a simple set of guards that you can use in your tests
  # to skip execution if it is not applicable. These methods are
  # mixed into Test as both instance and class methods so you
  # can use them inside or outside of the test methods.
  #
  #   def test_something_for_mri
  #     skip "bug 1234"  if jruby?
  #     # ...
  #   end
  #
  #   if windows? then
  #     # ... lots of test methods ...
  #   end

  module Guard

    ##
    # Is this running on jruby?

    def jruby? platform = RUBY_PLATFORM
      "java" == platform
    end

    ##
    # Is this running on maglev?

    def maglev? platform = defined?(RUBY_ENGINE) && RUBY_ENGINE
      where = Minitest.filter_backtrace(caller).first
      where = where.split(/:in /, 2).first # clean up noise
      warn "DEPRECATED: `maglev?` called from #{where}. This will fail in Minitest 6."
      "maglev" == platform
    end

    ##
    # Is this running on mri?

    def mri? platform = RUBY_DESCRIPTION
      /^ruby/ =~ platform
    end

    ##
    # Is this running on macOS?

    def osx? platform = RUBY_PLATFORM
      /darwin/ =~ platform
    end

    ##
    # Is this running on rubinius?

    def rubinius? platform = defined?(RUBY_ENGINE) && RUBY_ENGINE
      where = Minitest.filter_backtrace(caller).first
      where = where.split(/:in /, 2).first # clean up noise
      warn "DEPRECATED: `rubinius?` called from #{where}. This will fail in Minitest 6."
      "rbx" == platform
    end

    ##
    # Is this running on windows?

    def windows? platform = RUBY_PLATFORM
      /mswin|mingw/ =~ platform
    end
  end

  ##
  # The standard backtrace filter for minitest.
  #
  # See Minitest.backtrace_filter=.

  class BacktraceFilter

    MT_RE = %r%lib/minitest% #:nodoc:

    attr_accessor :regexp

    def initialize regexp = MT_RE
      self.regexp = regexp
    end

    ##
    # Filter +bt+ to something useful. Returns the whole thing if
    # $DEBUG (ruby) or $MT_DEBUG (env).

    def filter bt
      return ["No backtrace"] unless bt

      return bt.dup if $DEBUG || ENV["MT_DEBUG"]

      new_bt = bt.take_while { |line| line.to_s !~ regexp }
      new_bt = bt.select     { |line| line.to_s !~ regexp } if new_bt.empty?
      new_bt = bt.dup                                       if new_bt.empty?

      new_bt
    end
  end

  self.backtrace_filter = BacktraceFilter.new

  def self.run_one_method klass, method_name # :nodoc:
    result = klass.new(method_name).run
    raise "#{klass}#run _must_ return a Result" unless Result === result
    result
  end

  # :stopdoc:

  if defined? Process::CLOCK_MONOTONIC # :nodoc:
    def self.clock_time
      Process.clock_gettime Process::CLOCK_MONOTONIC
    end
  else
    def self.clock_time
      Time.now
    end
  end

  class Runnable # re-open
    def self.inherited klass # :nodoc:
      self.runnables << klass
      super
    end
  end

  # :startdoc:
end

require "minitest/test"
