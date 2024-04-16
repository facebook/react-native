# frozen_string_literal: true

require "active_support/error_reporter"
require "active_support/callbacks"
require "concurrent/hash"

module ActiveSupport
  class ExecutionWrapper
    include ActiveSupport::Callbacks

    Null = Object.new # :nodoc:
    def Null.complete! # :nodoc:
    end

    define_callbacks :run
    define_callbacks :complete

    def self.to_run(*args, &block)
      set_callback(:run, *args, &block)
    end

    def self.to_complete(*args, &block)
      set_callback(:complete, *args, &block)
    end

    RunHook = Struct.new(:hook) do # :nodoc:
      def before(target)
        hook_state = target.send(:hook_state)
        hook_state[hook] = hook.run
      end
    end

    CompleteHook = Struct.new(:hook) do # :nodoc:
      def before(target)
        hook_state = target.send(:hook_state)
        if hook_state.key?(hook)
          hook.complete hook_state[hook]
        end
      end
      alias after before
    end

    # Register an object to be invoked during both the +run+ and
    # +complete+ steps.
    #
    # +hook.complete+ will be passed the value returned from +hook.run+,
    # and will only be invoked if +run+ has previously been called.
    # (Mostly, this means it won't be invoked if an exception occurs in
    # a preceding +to_run+ block; all ordinary +to_complete+ blocks are
    # invoked in that situation.)
    def self.register_hook(hook, outer: false)
      if outer
        to_run RunHook.new(hook), prepend: true
        to_complete :after, CompleteHook.new(hook)
      else
        to_run RunHook.new(hook)
        to_complete CompleteHook.new(hook)
      end
    end

    # Run this execution.
    #
    # Returns an instance, whose +complete!+ method *must* be invoked
    # after the work has been performed.
    #
    # Where possible, prefer +wrap+.
    def self.run!(reset: false)
      if reset
        lost_instance = IsolatedExecutionState.delete(active_key)
        lost_instance&.complete!
      else
        return Null if active?
      end

      new.tap do |instance|
        success = nil
        begin
          instance.run!
          success = true
        ensure
          instance.complete! unless success
        end
      end
    end

    # Perform the work in the supplied block as an execution.
    def self.wrap
      return yield if active?

      instance = run!
      begin
        yield
      rescue => error
        error_reporter.report(error, handled: false)
        raise
      ensure
        instance.complete!
      end
    end

    def self.perform # :nodoc:
      instance = new
      instance.run
      begin
        yield
      ensure
        instance.complete
      end
    end

    def self.error_reporter
      @error_reporter ||= ActiveSupport::ErrorReporter.new
    end

    def self.active_key # :nodoc:
      @active_key ||= :"active_execution_wrapper_#{object_id}"
    end

    def self.active? # :nodoc:
      IsolatedExecutionState.key?(active_key)
    end

    def run! # :nodoc:
      IsolatedExecutionState[self.class.active_key] = self
      run
    end

    def run # :nodoc:
      run_callbacks(:run)
    end

    # Complete this in-flight execution. This method *must* be called
    # exactly once on the result of any call to +run!+.
    #
    # Where possible, prefer +wrap+.
    def complete!
      complete
    ensure
      IsolatedExecutionState.delete(self.class.active_key)
    end

    def complete # :nodoc:
      run_callbacks(:complete)
    end

    private
      def hook_state
        @_hook_state ||= {}
      end
  end
end
