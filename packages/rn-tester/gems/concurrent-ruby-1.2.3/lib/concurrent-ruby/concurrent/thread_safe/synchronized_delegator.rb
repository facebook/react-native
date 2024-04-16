require 'delegate'
require 'monitor'

module Concurrent
  # This class provides a trivial way to synchronize all calls to a given object
  # by wrapping it with a `Delegator` that performs `Monitor#enter/exit` calls
  # around the delegated `#send`. Example:
  #
  #   array = [] # not thread-safe on many impls
  #   array = SynchronizedDelegator.new([]) # thread-safe
  #
  # A simple `Monitor` provides a very coarse-grained way to synchronize a given
  # object, in that it will cause synchronization for methods that have no need
  # for it, but this is a trivial way to get thread-safety where none may exist
  # currently on some implementations.
  #
  # This class is currently being considered for inclusion into stdlib, via
  # https://bugs.ruby-lang.org/issues/8556
  #
  # @!visibility private
  class SynchronizedDelegator < SimpleDelegator
    def setup
      @old_abort = Thread.abort_on_exception
      Thread.abort_on_exception = true
    end

    def teardown
      Thread.abort_on_exception = @old_abort
    end

    def initialize(obj)
      __setobj__(obj)
      @monitor = Monitor.new
    end

    def method_missing(method, *args, &block)
      monitor = @monitor
      begin
        monitor.enter
        super
      ensure
        monitor.exit
      end
    end

  end
end
