require 'concurrent/configuration'

module Concurrent

  # @!visibility private
  module Options

    # Get the requested `Executor` based on the values set in the options hash.
    #
    # @param [Hash] opts the options defining the requested executor
    # @option opts [Executor] :executor when set use the given `Executor` instance.
    #   Three special values are also supported: `:fast` returns the global fast executor,
    #   `:io` returns the global io executor, and `:immediate` returns a new
    #   `ImmediateExecutor` object.
    #
    # @return [Executor, nil] the requested thread pool, or nil when no option specified
    #
    # @!visibility private
    def self.executor_from_options(opts = {}) # :nodoc:
      if identifier = opts.fetch(:executor, nil)
        executor(identifier)
      else
        nil
      end
    end

    def self.executor(executor_identifier)
      case executor_identifier
      when :fast
        Concurrent.global_fast_executor
      when :io
        Concurrent.global_io_executor
      when :immediate
        Concurrent.global_immediate_executor
      when Concurrent::ExecutorService
        executor_identifier
      else
        raise ArgumentError, "executor not recognized by '#{executor_identifier}'"
      end
    end
  end
end
