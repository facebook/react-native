require "shellwords"
require "rbconfig"
require "rake/tasklib"

module Minitest # :nodoc:

  ##
  # Minitest::TestTask is a rake helper that generates several rake
  # tasks under the main test task's name-space.
  #
  #   task <name>      :: the main test task
  #   task <name>:cmd  :: prints the command to use
  #   task <name>:deps :: runs each test file by itself to find dependency errors
  #   task <name>:slow :: runs the tests and reports the slowest 25 tests.
  #
  # Examples:
  #
  #   Minitest::TestTask.create
  #
  # The most basic and default setup.
  #
  #   Minitest::TestTask.create :my_tests
  #
  # The most basic/default setup, but with a custom name
  #
  #   Minitest::TestTask.create :unit do |t|
  #     t.test_globs = ["test/unit/**/*_test.rb"]
  #     t.warning = false
  #   end
  #
  # Customize the name and only run unit tests.
  #
  # NOTE: To hook this task up to the default, make it a dependency:
  #
  #   task default: :unit

  class TestTask < Rake::TaskLib
    WINDOWS = RbConfig::CONFIG["host_os"] =~ /mswin|mingw/ # :nodoc:

    ##
    # Create several test-oriented tasks under +name+. Takes an
    # optional block to customize variables.

    def self.create name = :test, &block
      task = new name
      task.instance_eval(&block) if block
      task.process_env
      task.define
      task
    end

    ##
    # Extra arguments to pass to the tests. Defaults empty but gets
    # populated by a number of enviroment variables:
    #
    # N (-n flag) :: a string or regexp of tests to run.
    # X (-e flag) :: a string or regexp of tests to exclude.
    # A (arg)     :: quick way to inject an arbitrary argument (eg A=--help).
    #
    # See #process_env

    attr_accessor :extra_args

    ##
    # The code to load the framework. Defaults to requiring
    # minitest/autorun...
    #
    # Why do I have this as an option?

    attr_accessor :framework

    ##
    # Extra library directories to include. Defaults to %w[lib test
    # .]. Also uses $MT_LIB_EXTRAS allowing you to dynamically
    # override/inject directories for custom runs.

    attr_accessor :libs

    ##
    # The name of the task and base name for the other tasks generated.

    attr_accessor :name

    ##
    # File globs to find test files. Defaults to something sensible to
    # find test files under the test directory.

    attr_accessor :test_globs

    ##
    # Turn on ruby warnings (-w flag). Defaults to true.

    attr_accessor :warning

    ##
    # Optional: Additional ruby to run before the test framework is loaded.

    attr_accessor :test_prelude

    ##
    # Print out commands as they run. Defaults to Rake's +trace+ (-t
    # flag) option.

    attr_accessor :verbose

    ##
    # Use TestTask.create instead.

    def initialize name = :test # :nodoc:
      self.extra_args   = []
      self.framework    = %(require "minitest/autorun")
      self.libs         = %w[lib test .]
      self.name         = name
      self.test_globs   = ["test/**/test_*.rb",
                           "test/**/*_test.rb"]
      self.test_prelude = nil
      self.verbose      = Rake.application.options.trace
      self.warning      = true
    end

    ##
    # Extract variables from the environment and convert them to
    # command line arguments. See #extra_args.
    #
    # Environment Variables:
    #
    # MT_LIB_EXTRAS :: Extra libs to dynamically override/inject for custom runs.
    # N             :: Tests to run (string or /regexp/).
    # X             :: Tests to exclude (string or /regexp/).
    # A             :: Any extra arguments. Honors shell quoting.
    #
    # Deprecated:
    #
    # TESTOPTS      :: For argument passing, use +A+.
    # N             :: For parallel testing, use +MT_CPU+.
    # FILTER        :: Same as +TESTOPTS+.

    def process_env
      warn "TESTOPTS is deprecated in Minitest::TestTask. Use A instead" if
        ENV["TESTOPTS"]
      warn "FILTER is deprecated in Minitest::TestTask. Use A instead" if
        ENV["FILTER"]
      warn "N is deprecated in Minitest::TestTask. Use MT_CPU instead" if
        ENV["N"] && ENV["N"].to_i > 0

      lib_extras = (ENV["MT_LIB_EXTRAS"] || "").split File::PATH_SEPARATOR
      self.libs[0,0] = lib_extras

      extra_args << "-n" << ENV["N"]                      if ENV["N"]
      extra_args << "-e" << ENV["X"]                      if ENV["X"]
      extra_args.concat Shellwords.split(ENV["TESTOPTS"]) if ENV["TESTOPTS"]
      extra_args.concat Shellwords.split(ENV["FILTER"])   if ENV["FILTER"]
      extra_args.concat Shellwords.split(ENV["A"])        if ENV["A"]

      ENV.delete "N" if ENV["N"]

      # TODO? RUBY_DEBUG = ENV["RUBY_DEBUG"]
      # TODO? ENV["RUBY_FLAGS"]

      extra_args.compact!
    end

    def define # :nodoc:
      desc "Run the test suite. Use N, X, A, and TESTOPTS to add flags/args."
      task name do
        ruby make_test_cmd, verbose:verbose
      end

      desc "Print out the test command. Good for profiling and other tools."
      task "#{name}:cmd" do
        puts "ruby #{make_test_cmd}"
      end

      desc "Show which test files fail when run in isolation."
      task "#{name}:isolated" do
        tests = Dir[*self.test_globs].uniq

        # 3 seems to be the magic number... (tho not by that much)
        bad, good, n = {}, [], (ENV.delete("K") || 3).to_i
        file = ENV.delete("F")
        times = {}

        tt0 = Time.now

        n.threads_do tests.sort do |path|
          t0 = Time.now
          output = `#{Gem.ruby} #{make_test_cmd path} 2>&1`
          t1 = Time.now - t0

          times[path] = t1

          if $?.success?
            $stderr.print "."
            good << path
          else
            $stderr.print "x"
            bad[path] = output
          end
        end

        puts "done"
        puts "Ran in %.2f seconds" % [ Time.now - tt0 ]

        if file then
          require "json"
          File.open file, "w" do |io|
            io.puts JSON.pretty_generate times
          end
        end

        unless good.empty?
          puts
          puts "# Good tests:"
          puts
          good.sort.each do |path|
            puts "%.2fs: %s" % [times[path], path]
          end
        end

        unless bad.empty?
          puts
          puts "# Bad tests:"
          puts
          bad.keys.sort.each do |path|
            puts "%.2fs: %s" % [times[path], path]
          end
          puts
          puts "# Bad Test Output:"
          puts
          bad.sort.each do |path, output|
            puts
            puts "# #{path}:"
            puts output
          end
          exit 1
        end
      end

      task "#{name}:deps" => "#{name}:isolated" # now just an alias

      desc "Show bottom 25 tests wrt time."
      task "#{name}:slow" do
        sh ["rake #{name} A=-v",
            "egrep '#test_.* s = .'",
            "sort -n -k2 -t=",
            "tail -25"].join " | "
      end
    end

    ##
    # Generate the test command-line.

    def make_test_cmd globs = test_globs
      tests = []
      tests.concat Dir[*globs].sort.shuffle # TODO: SEED -> srand first?
      tests.map! { |f| %(require "#{f}") }

      runner = []
      runner << test_prelude if test_prelude
      runner << framework
      runner.concat tests
      runner = runner.join "; "

      args  = []
      args << "-I#{libs.join(File::PATH_SEPARATOR)}" unless libs.empty?
      args << "-w" if warning
      args << '-e'
      args << "'#{runner}'"
      args << '--'
      args << extra_args.map(&:shellescape)

      args.join " "
    end
  end
end

class Work < Queue # :nodoc:
  def initialize jobs = [] # :nodoc:
    super()

    jobs.each do |job|
      self << job
    end

    close
  end
end

class Integer # :nodoc:
  def threads_do(jobs) # :nodoc:
    q = Work.new jobs

    self.times.map {
      Thread.new do
        while job = q.pop # go until quit value
          yield job
        end
      end
    }.each(&:join)
  end
end
