# encoding: UTF-8

require "rbconfig"
require "tempfile"
require "stringio"

module Minitest
  ##
  # Minitest Assertions.  All assertion methods accept a +msg+ which is
  # printed if the assertion fails.
  #
  # Protocol: Nearly everything here boils up to +assert+, which
  # expects to be able to increment an instance accessor named
  # +assertions+. This is not provided by Assertions and must be
  # provided by the thing including Assertions. See Minitest::Runnable
  # for an example.

  module Assertions
    UNDEFINED = Object.new # :nodoc:

    def UNDEFINED.inspect # :nodoc:
      "UNDEFINED" # again with the rdoc bugs... :(
    end

    ##
    # Returns the diff command to use in #diff. Tries to intelligently
    # figure out what diff to use.

    def self.diff
      return @diff if defined? @diff

      @diff = if (RbConfig::CONFIG["host_os"] =~ /mswin|mingw/ &&
                  system("diff.exe", __FILE__, __FILE__)) then
                "diff.exe -u"
              elsif system("gdiff", __FILE__, __FILE__)
                "gdiff -u" # solaris and kin suck
              elsif system("diff", __FILE__, __FILE__)
                "diff -u"
              else
                nil
              end
    end

    ##
    # Set the diff command to use in #diff.

    def self.diff= o
      @diff = o
    end

    ##
    # Returns a diff between +exp+ and +act+. If there is no known
    # diff command or if it doesn't make sense to diff the output
    # (single line, short output), then it simply returns a basic
    # comparison between the two.
    #
    # See +things_to_diff+ for more info.

    def diff exp, act
      result = nil

      expect, butwas = things_to_diff(exp, act)

      return "Expected: #{mu_pp exp}\n  Actual: #{mu_pp act}" unless
        expect

      Tempfile.open("expect") do |a|
        a.puts expect
        a.flush

        Tempfile.open("butwas") do |b|
          b.puts butwas
          b.flush

          result = `#{Minitest::Assertions.diff} #{a.path} #{b.path}`
          result.sub!(/^\-\-\- .+/, "--- expected")
          result.sub!(/^\+\+\+ .+/, "+++ actual")

          if result.empty? then
            klass = exp.class
            result = [
                      "No visible difference in the #{klass}#inspect output.\n",
                      "You should look at the implementation of #== on ",
                      "#{klass} or its members.\n",
                      expect,
                     ].join
          end
        end
      end

      result
    end

    ##
    # Returns things to diff [expect, butwas], or [nil, nil] if nothing to diff.
    #
    # Criterion:
    #
    # 1. Strings include newlines or escaped newlines, but not both.
    # 2. or:  String lengths are > 30 characters.
    # 3. or:  Strings are equal to each other (but maybe different encodings?).
    # 4. and: we found a diff executable.

    def things_to_diff exp, act
      expect = mu_pp_for_diff exp
      butwas = mu_pp_for_diff act

      e1, e2 = expect.include?("\n"), expect.include?("\\n")
      b1, b2 = butwas.include?("\n"), butwas.include?("\\n")

      need_to_diff =
        (e1 ^ e2                  ||
         b1 ^ b2                  ||
         expect.size > 30         ||
         butwas.size > 30         ||
         expect == butwas)        &&
        Minitest::Assertions.diff

      need_to_diff && [expect, butwas]
    end

    ##
    # This returns a human-readable version of +obj+. By default
    # #inspect is called. You can override this to use #pretty_inspect
    # if you want.
    #
    # See Minitest::Test.make_my_diffs_pretty!

    def mu_pp obj
      s = obj.inspect

      if defined? Encoding then
        s = s.encode Encoding.default_external

        if String === obj && (obj.encoding != Encoding.default_external ||
                              !obj.valid_encoding?) then
          enc = "# encoding: #{obj.encoding}"
          val = "#    valid: #{obj.valid_encoding?}"
          s = "#{enc}\n#{val}\n#{s}"
        end
      end

      s
    end

    ##
    # This returns a diff-able more human-readable version of +obj+.
    # This differs from the regular mu_pp because it expands escaped
    # newlines and makes hex-values (like object_ids) generic. This
    # uses mu_pp to do the first pass and then cleans it up.

    def mu_pp_for_diff obj
      str = mu_pp obj

      # both '\n' & '\\n' (_after_ mu_pp (aka inspect))
      single = !!str.match(/(?<!\\|^)\\n/)
      double = !!str.match(/(?<=\\|^)\\n/)

      process =
        if single ^ double then
          if single then
            lambda { |s| s == "\\n"   ? "\n"    : s } # unescape
          else
            lambda { |s| s == "\\\\n" ? "\\n\n" : s } # unescape a bit, add nls
          end
        else
          :itself                                     # leave it alone
        end

      str.
        gsub(/\\?\\n/, &process).
        gsub(/:0x[a-fA-F0-9]{4,}/m, ":0xXXXXXX") # anonymize hex values
    end

    ##
    # Fails unless +test+ is truthy.

    def assert test, msg = nil
      self.assertions += 1
      unless test then
        msg ||= "Expected #{mu_pp test} to be truthy."
        msg = msg.call if Proc === msg
        raise Minitest::Assertion, msg
      end
      true
    end

    def _synchronize # :nodoc:
      yield
    end

    ##
    # Fails unless +obj+ is empty.

    def assert_empty obj, msg = nil
      msg = message(msg) { "Expected #{mu_pp(obj)} to be empty" }
      assert_respond_to obj, :empty?
      assert obj.empty?, msg
    end

    def _where # :nodoc:
      where = Minitest.filter_backtrace(caller).first
      where = where.split(/:in /, 2).first # clean up noise
    end

    E = "" # :nodoc:

    ##
    # Fails unless <tt>exp == act</tt> printing the difference between
    # the two, if possible.
    #
    # If there is no visible difference but the assertion fails, you
    # should suspect that your #== is buggy, or your inspect output is
    # missing crucial details.  For nicer structural diffing, set
    # Minitest::Test.make_my_diffs_pretty!
    #
    # For floats use assert_in_delta.
    #
    # See also: Minitest::Assertions.diff

    def assert_equal exp, act, msg = nil
      msg = message(msg, E) { diff exp, act }
      result = assert exp == act, msg

      if nil == exp then
        if Minitest::VERSION =~ /^6/ then
          refute_nil exp, "Use assert_nil if expecting nil."
        else
          warn "DEPRECATED: Use assert_nil if expecting nil from #{_where}. This will fail in Minitest 6."
        end
      end

      result
    end

    ##
    # For comparing Floats.  Fails unless +exp+ and +act+ are within +delta+
    # of each other.
    #
    #   assert_in_delta Math::PI, (22.0 / 7.0), 0.01

    def assert_in_delta exp, act, delta = 0.001, msg = nil
      n = (exp - act).abs
      msg = message(msg) {
        "Expected |#{exp} - #{act}| (#{n}) to be <= #{delta}"
      }
      assert delta >= n, msg
    end

    ##
    # For comparing Floats.  Fails unless +exp+ and +act+ have a relative
    # error less than +epsilon+.

    def assert_in_epsilon exp, act, epsilon = 0.001, msg = nil
      assert_in_delta exp, act, [exp.abs, act.abs].min * epsilon, msg
    end

    ##
    # Fails unless +collection+ includes +obj+.

    def assert_includes collection, obj, msg = nil
      msg = message(msg) {
        "Expected #{mu_pp(collection)} to include #{mu_pp(obj)}"
      }
      assert_respond_to collection, :include?
      assert collection.include?(obj), msg
    end

    ##
    # Fails unless +obj+ is an instance of +cls+.

    def assert_instance_of cls, obj, msg = nil
      msg = message(msg) {
        "Expected #{mu_pp(obj)} to be an instance of #{cls}, not #{obj.class}"
      }

      assert obj.instance_of?(cls), msg
    end

    ##
    # Fails unless +obj+ is a kind of +cls+.

    def assert_kind_of cls, obj, msg = nil
      msg = message(msg) {
        "Expected #{mu_pp(obj)} to be a kind of #{cls}, not #{obj.class}" }

      assert obj.kind_of?(cls), msg
    end

    ##
    # Fails unless +matcher+ <tt>=~</tt> +obj+.

    def assert_match matcher, obj, msg = nil
      msg = message(msg) { "Expected #{mu_pp matcher} to match #{mu_pp obj}" }
      assert_respond_to matcher, :"=~"
      matcher = Regexp.new Regexp.escape matcher if String === matcher
      assert matcher =~ obj, msg

      Regexp.last_match
    end

    ##
    # Fails unless +obj+ is nil

    def assert_nil obj, msg = nil
      msg = message(msg) { "Expected #{mu_pp(obj)} to be nil" }
      assert obj.nil?, msg
    end

    ##
    # For testing with binary operators. Eg:
    #
    #   assert_operator 5, :<=, 4

    def assert_operator o1, op, o2 = UNDEFINED, msg = nil
      return assert_predicate o1, op, msg if UNDEFINED == o2
      msg = message(msg) { "Expected #{mu_pp(o1)} to be #{op} #{mu_pp(o2)}" }
      assert o1.__send__(op, o2), msg
    end

    ##
    # Fails if stdout or stderr do not output the expected results.
    # Pass in nil if you don't care about that streams output. Pass in
    # "" if you require it to be silent. Pass in a regexp if you want
    # to pattern match.
    #
    #   assert_output(/hey/) { method_with_output }
    #
    # NOTE: this uses #capture_io, not #capture_subprocess_io.
    #
    # See also: #assert_silent

    def assert_output stdout = nil, stderr = nil
      flunk "assert_output requires a block to capture output." unless
        block_given?

      out, err = capture_io do
        yield
      end

      err_msg = Regexp === stderr ? :assert_match : :assert_equal if stderr
      out_msg = Regexp === stdout ? :assert_match : :assert_equal if stdout

      y = send err_msg, stderr, err, "In stderr" if err_msg
      x = send out_msg, stdout, out, "In stdout" if out_msg

      (!stdout || x) && (!stderr || y)
    rescue Assertion
      raise
    rescue => e
      raise UnexpectedError, e
    end

    ##
    # Fails unless +path+ exists.

    def assert_path_exists path, msg = nil
      msg = message(msg) { "Expected path '#{path}' to exist" }
      assert File.exist?(path), msg
    end

    ##
    # For testing with pattern matching (only supported with Ruby 3.0 and later)
    #
    #   # pass
    #   assert_pattern { [1,2,3] => [Integer, Integer, Integer] }
    #
    #   # fail "length mismatch (given 3, expected 1)"
    #   assert_pattern { [1,2,3] => [Integer] }
    #
    # The bare <tt>=></tt> pattern will raise a NoMatchingPatternError on failure, which would
    # normally be counted as a test error. This assertion rescues NoMatchingPatternError and
    # generates a test failure. Any other exception will be raised as normal and generate a test
    # error.

    def assert_pattern
      raise NotImplementedError, "only available in Ruby 3.0+" unless RUBY_VERSION >= "3.0"
      flunk "assert_pattern requires a block to capture errors." unless block_given?

      begin # TODO: remove after ruby 2.6 dropped
        yield
        pass
      rescue NoMatchingPatternError => e
        flunk e.message
      end
    end

    ##
    # For testing with predicates. Eg:
    #
    #   assert_predicate str, :empty?
    #
    # This is really meant for specs and is front-ended by assert_operator:
    #
    #   str.must_be :empty?

    def assert_predicate o1, op, msg = nil
      msg = message(msg) { "Expected #{mu_pp(o1)} to be #{op}" }
      assert o1.__send__(op), msg
    end

    ##
    # Fails unless the block raises one of +exp+. Returns the
    # exception matched so you can check the message, attributes, etc.
    #
    # +exp+ takes an optional message on the end to help explain
    # failures and defaults to StandardError if no exception class is
    # passed. Eg:
    #
    #   assert_raises(CustomError) { method_with_custom_error }
    #
    # With custom error message:
    #
    #   assert_raises(CustomError, 'This should have raised CustomError') { method_with_custom_error }
    #
    # Using the returned object:
    #
    #   error = assert_raises(CustomError) do
    #     raise CustomError, 'This is really bad'
    #   end
    #
    #   assert_equal 'This is really bad', error.message

    def assert_raises *exp
      flunk "assert_raises requires a block to capture errors." unless
        block_given?

      msg = "#{exp.pop}.\n" if String === exp.last
      exp << StandardError if exp.empty?

      begin
        yield
      rescue *exp => e
        pass # count assertion
        return e
      rescue Minitest::Assertion # incl Skip & UnexpectedError
        # don't count assertion
        raise
      rescue SignalException, SystemExit
        raise
      rescue Exception => e
        flunk proc {
          exception_details(e, "#{msg}#{mu_pp(exp)} exception expected, not")
        }
      end

      exp = exp.first if exp.size == 1

      flunk "#{msg}#{mu_pp(exp)} expected but nothing was raised."
    end

    ##
    # Fails unless +obj+ responds to +meth+.
    # include_all defaults to false to match Object#respond_to?

    def assert_respond_to obj, meth, msg = nil, include_all: false
      msg = message(msg) {
        "Expected #{mu_pp(obj)} (#{obj.class}) to respond to ##{meth}"
      }
      assert obj.respond_to?(meth, include_all), msg
    end

    ##
    # Fails unless +exp+ and +act+ are #equal?

    def assert_same exp, act, msg = nil
      msg = message(msg) {
        data = [mu_pp(act), act.object_id, mu_pp(exp), exp.object_id]
        "Expected %s (oid=%d) to be the same as %s (oid=%d)" % data
      }
      assert exp.equal?(act), msg
    end

    ##
    # +send_ary+ is a receiver, message and arguments.
    #
    # Fails unless the call returns a true value

    def assert_send send_ary, m = nil
      warn "DEPRECATED: assert_send. From #{_where}"

      recv, msg, *args = send_ary
      m = message(m) {
        "Expected #{mu_pp(recv)}.#{msg}(*#{mu_pp(args)}) to return true" }
      assert recv.__send__(msg, *args), m
    end

    ##
    # Fails if the block outputs anything to stderr or stdout.
    #
    # See also: #assert_output

    def assert_silent
      assert_output "", "" do
        yield
      end
    end

    ##
    # Fails unless the block throws +sym+

    def assert_throws sym, msg = nil
      default = "Expected #{mu_pp(sym)} to have been thrown"
      caught = true
      value = catch(sym) do
        begin
          yield
        rescue ThreadError => e       # wtf?!? 1.8 + threads == suck
          default += ", not \:#{e.message[/uncaught throw \`(\w+?)\'/, 1]}"
        rescue ArgumentError => e     # 1.9 exception
          raise e unless e.message.include?("uncaught throw")
          default += ", not #{e.message.split(/ /).last}"
        rescue NameError => e         # 1.8 exception
          raise e unless e.name == sym
          default += ", not #{e.name.inspect}"
        end
        caught = false
      end

      assert caught, message(msg) { default }
      value
    rescue Assertion
      raise
    rescue => e
      raise UnexpectedError, e
    end

    ##
    # Captures $stdout and $stderr into strings:
    #
    #   out, err = capture_io do
    #     puts "Some info"
    #     warn "You did a bad thing"
    #   end
    #
    #   assert_match %r%info%, out
    #   assert_match %r%bad%, err
    #
    # NOTE: For efficiency, this method uses StringIO and does not
    # capture IO for subprocesses. Use #capture_subprocess_io for
    # that.

    def capture_io
      _synchronize do
        begin
          captured_stdout, captured_stderr = StringIO.new, StringIO.new

          orig_stdout, orig_stderr = $stdout, $stderr
          $stdout, $stderr         = captured_stdout, captured_stderr

          yield

          return captured_stdout.string, captured_stderr.string
        ensure
          $stdout = orig_stdout
          $stderr = orig_stderr
        end
      end
    end

    ##
    # Captures $stdout and $stderr into strings, using Tempfile to
    # ensure that subprocess IO is captured as well.
    #
    #   out, err = capture_subprocess_io do
    #     system "echo Some info"
    #     system "echo You did a bad thing 1>&2"
    #   end
    #
    #   assert_match %r%info%, out
    #   assert_match %r%bad%, err
    #
    # NOTE: This method is approximately 10x slower than #capture_io so
    # only use it when you need to test the output of a subprocess.

    def capture_subprocess_io
      _synchronize do
        begin
          require "tempfile"

          captured_stdout, captured_stderr = Tempfile.new("out"), Tempfile.new("err")

          orig_stdout, orig_stderr = $stdout.dup, $stderr.dup
          $stdout.reopen captured_stdout
          $stderr.reopen captured_stderr

          yield

          $stdout.rewind
          $stderr.rewind

          return captured_stdout.read, captured_stderr.read
        ensure
          $stdout.reopen orig_stdout
          $stderr.reopen orig_stderr

          orig_stdout.close
          orig_stderr.close
          captured_stdout.close!
          captured_stderr.close!
        end
      end
    end

    ##
    # Returns details for exception +e+

    def exception_details e, msg
      [
       "#{msg}",
       "Class: <#{e.class}>",
       "Message: <#{e.message.inspect}>",
       "---Backtrace---",
       "#{Minitest.filter_backtrace(e.backtrace).join("\n")}",
       "---------------",
      ].join "\n"
    end

    ##
    # Fails after a given date (in the local time zone). This allows
    # you to put time-bombs in your tests if you need to keep
    # something around until a later date lest you forget about it.

    def fail_after y,m,d,msg
      flunk msg if Time.now > Time.local(y, m, d)
    end

    ##
    # Fails with +msg+.

    def flunk msg = nil
      msg ||= "Epic Fail!"
      assert false, msg
    end

    ##
    # Returns a proc that will output +msg+ along with the default message.

    def message msg = nil, ending = nil, &default
      proc {
        msg = msg.call.chomp(".") if Proc === msg
        custom_message = "#{msg}.\n" unless msg.nil? or msg.to_s.empty?
        "#{custom_message}#{default.call}#{ending || "."}"
      }
    end

    ##
    # used for counting assertions

    def pass _msg = nil
      assert true
    end

    ##
    # Fails if +test+ is truthy.

    def refute test, msg = nil
      msg ||= message { "Expected #{mu_pp(test)} to not be truthy" }
      assert !test, msg
    end

    ##
    # Fails if +obj+ is empty.

    def refute_empty obj, msg = nil
      msg = message(msg) { "Expected #{mu_pp(obj)} to not be empty" }
      assert_respond_to obj, :empty?
      refute obj.empty?, msg
    end

    ##
    # Fails if <tt>exp == act</tt>.
    #
    # For floats use refute_in_delta.

    def refute_equal exp, act, msg = nil
      msg = message(msg) {
        "Expected #{mu_pp(act)} to not be equal to #{mu_pp(exp)}"
      }
      refute exp == act, msg
    end

    ##
    # For comparing Floats.  Fails if +exp+ is within +delta+ of +act+.
    #
    #   refute_in_delta Math::PI, (22.0 / 7.0)

    def refute_in_delta exp, act, delta = 0.001, msg = nil
      n = (exp - act).abs
      msg = message(msg) {
        "Expected |#{exp} - #{act}| (#{n}) to not be <= #{delta}"
      }
      refute delta >= n, msg
    end

    ##
    # For comparing Floats.  Fails if +exp+ and +act+ have a relative error
    # less than +epsilon+.

    def refute_in_epsilon a, b, epsilon = 0.001, msg = nil
      refute_in_delta a, b, a * epsilon, msg
    end

    ##
    # Fails if +collection+ includes +obj+.

    def refute_includes collection, obj, msg = nil
      msg = message(msg) {
        "Expected #{mu_pp(collection)} to not include #{mu_pp(obj)}"
      }
      assert_respond_to collection, :include?
      refute collection.include?(obj), msg
    end

    ##
    # Fails if +obj+ is an instance of +cls+.

    def refute_instance_of cls, obj, msg = nil
      msg = message(msg) {
        "Expected #{mu_pp(obj)} to not be an instance of #{cls}"
      }
      refute obj.instance_of?(cls), msg
    end

    ##
    # Fails if +obj+ is a kind of +cls+.

    def refute_kind_of cls, obj, msg = nil
      msg = message(msg) { "Expected #{mu_pp(obj)} to not be a kind of #{cls}" }
      refute obj.kind_of?(cls), msg
    end

    ##
    # Fails if +matcher+ <tt>=~</tt> +obj+.

    def refute_match matcher, obj, msg = nil
      msg = message(msg) { "Expected #{mu_pp matcher} to not match #{mu_pp obj}" }
      assert_respond_to matcher, :"=~"
      matcher = Regexp.new Regexp.escape matcher if String === matcher
      refute matcher =~ obj, msg
    end

    ##
    # Fails if +obj+ is nil.

    def refute_nil obj, msg = nil
      msg = message(msg) { "Expected #{mu_pp(obj)} to not be nil" }
      refute obj.nil?, msg
    end

    ##
    # For testing with pattern matching (only supported with Ruby 3.0 and later)
    #
    #   # pass
    #   refute_pattern { [1,2,3] => [String] }
    #
    #   # fail "NoMatchingPatternError expected, but nothing was raised."
    #   refute_pattern { [1,2,3] => [Integer, Integer, Integer] }
    #
    # This assertion expects a NoMatchingPatternError exception, and will fail if none is raised. Any
    # other exceptions will be raised as normal and generate a test error.

    def refute_pattern
      raise NotImplementedError, "only available in Ruby 3.0+" unless RUBY_VERSION >= "3.0"
      flunk "refute_pattern requires a block to capture errors." unless block_given?

      begin
        yield
        flunk("NoMatchingPatternError expected, but nothing was raised.")
      rescue NoMatchingPatternError
        pass
      end
    end

    ##
    # Fails if +o1+ is not +op+ +o2+. Eg:
    #
    #   refute_operator 1, :>, 2 #=> pass
    #   refute_operator 1, :<, 2 #=> fail

    def refute_operator o1, op, o2 = UNDEFINED, msg = nil
      return refute_predicate o1, op, msg if UNDEFINED == o2
      msg = message(msg) { "Expected #{mu_pp(o1)} to not be #{op} #{mu_pp(o2)}" }
      refute o1.__send__(op, o2), msg
    end

    ##
    # Fails if +path+ exists.

    def refute_path_exists path, msg = nil
      msg = message(msg) { "Expected path '#{path}' to not exist" }
      refute File.exist?(path), msg
    end

    ##
    # For testing with predicates.
    #
    #   refute_predicate str, :empty?
    #
    # This is really meant for specs and is front-ended by refute_operator:
    #
    #   str.wont_be :empty?

    def refute_predicate o1, op, msg = nil
      msg = message(msg) { "Expected #{mu_pp(o1)} to not be #{op}" }
      refute o1.__send__(op), msg
    end

    ##
    # Fails if +obj+ responds to the message +meth+.
    # include_all defaults to false to match Object#respond_to?

    def refute_respond_to obj, meth, msg = nil, include_all: false
      msg = message(msg) { "Expected #{mu_pp(obj)} to not respond to #{meth}" }

      refute obj.respond_to?(meth, include_all), msg
    end

    ##
    # Fails if +exp+ is the same (by object identity) as +act+.

    def refute_same exp, act, msg = nil
      msg = message(msg) {
        data = [mu_pp(act), act.object_id, mu_pp(exp), exp.object_id]
        "Expected %s (oid=%d) to not be the same as %s (oid=%d)" % data
      }
      refute exp.equal?(act), msg
    end

    ##
    # Skips the current run. If run in verbose-mode, the skipped run
    # gets listed at the end of the run but doesn't cause a failure
    # exit code.

    def skip msg = nil, _ignored = nil
      msg ||= "Skipped, no message given"
      @skip = true
      raise Minitest::Skip, msg
    end

    ##
    # Skips the current run until a given date (in the local time
    # zone). This allows you to put some fixes on hold until a later
    # date, but still holds you accountable and prevents you from
    # forgetting it.

    def skip_until y,m,d,msg
      skip msg if Time.now < Time.local(y, m, d)
      where = caller.first.rpartition(':in').reject(&:empty?).first
      warn "Stale skip_until %p at %s" % [msg, where]
    end

    ##
    # Was this testcase skipped? Meant for #teardown.

    def skipped?
      defined?(@skip) and @skip
    end
  end
end
