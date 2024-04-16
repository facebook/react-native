# frozen_string_literal: true

require "active_support/core_ext/hash/deep_merge"

module ActiveSupport
  class OptionMerger # :nodoc:
    instance_methods.each do |method|
      undef_method(method) unless method.start_with?("__", "instance_eval", "class", "object_id")
    end

    def initialize(context, options)
      @context, @options = context, options
    end

    private
      def method_missing(method, *arguments, &block)
        options = nil
        if arguments.size == 1 && arguments.first.is_a?(Proc)
          proc = arguments.shift
          arguments << lambda { |*args| @options.deep_merge(proc.call(*args)) }
        elsif arguments.last.respond_to?(:to_hash)
          options = @options.deep_merge(arguments.pop)
        else
          options = @options
        end

        if options
          @context.__send__(method, *arguments, **options, &block)
        else
          @context.__send__(method, *arguments, &block)
        end
      end

      def respond_to_missing?(*arguments)
        @context.respond_to?(*arguments)
      end
  end
end
