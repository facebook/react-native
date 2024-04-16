# frozen_string_literal: true

module ActiveSupport
  module ExecutionContext # :nodoc:
    @after_change_callbacks = []
    class << self
      def after_change(&block)
        @after_change_callbacks << block
      end

      # Updates the execution context. If a block is given, it resets the provided keys to their
      # previous value once the block exits.
      def set(**options)
        options.symbolize_keys!
        keys = options.keys

        store = self.store

        previous_context = keys.zip(store.values_at(*keys)).to_h

        store.merge!(options)
        @after_change_callbacks.each(&:call)

        if block_given?
          begin
            yield
          ensure
            store.merge!(previous_context)
            @after_change_callbacks.each(&:call)
          end
        end
      end

      def []=(key, value)
        store[key.to_sym] = value
        @after_change_callbacks.each(&:call)
      end

      def to_h
        store.dup
      end

      def clear
        store.clear
      end

      private
        def store
          IsolatedExecutionState[:active_support_execution_context] ||= {}
        end
    end
  end
end
