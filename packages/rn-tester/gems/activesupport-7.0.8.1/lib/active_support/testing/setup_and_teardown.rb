# frozen_string_literal: true

require "active_support/callbacks"

module ActiveSupport
  module Testing
    # Adds support for +setup+ and +teardown+ callbacks.
    # These callbacks serve as a replacement to overwriting the
    # <tt>#setup</tt> and <tt>#teardown</tt> methods of your TestCase.
    #
    #   class ExampleTest < ActiveSupport::TestCase
    #     setup do
    #       # ...
    #     end
    #
    #     teardown do
    #       # ...
    #     end
    #   end
    module SetupAndTeardown
      def self.prepended(klass)
        klass.include ActiveSupport::Callbacks
        klass.define_callbacks :setup, :teardown
        klass.extend ClassMethods
      end

      module ClassMethods
        # Add a callback, which runs before <tt>TestCase#setup</tt>.
        def setup(*args, &block)
          set_callback(:setup, :before, *args, &block)
        end

        # Add a callback, which runs after <tt>TestCase#teardown</tt>.
        def teardown(*args, &block)
          set_callback(:teardown, :after, *args, &block)
        end
      end

      def before_setup # :nodoc:
        super
        run_callbacks :setup
      end

      def after_teardown # :nodoc:
        begin
          run_callbacks :teardown
        rescue => e
          self.failures << Minitest::UnexpectedError.new(e)
        end

        super
      end
    end
  end
end
