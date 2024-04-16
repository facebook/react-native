# frozen_string_literal: true

require "active_support/notifications"

module ActiveSupport
  # Raised when ActiveSupport::Deprecation::Behavior#behavior is set with <tt>:raise</tt>.
  # You would set <tt>:raise</tt>, as a behavior to raise errors and proactively report exceptions from deprecations.
  class DeprecationException < StandardError
  end

  class Deprecation
    # Default warning behaviors per Rails.env.
    DEFAULT_BEHAVIORS = {
      raise: ->(message, callstack, deprecation_horizon, gem_name) {
        e = DeprecationException.new(message)
        e.set_backtrace(callstack.map(&:to_s))
        raise e
      },

      stderr: ->(message, callstack, deprecation_horizon, gem_name) {
        $stderr.puts(message)
        $stderr.puts callstack.join("\n  ") if debug
      },

      log: ->(message, callstack, deprecation_horizon, gem_name) {
        logger =
            if defined?(Rails.logger) && Rails.logger
              Rails.logger
            else
              require "active_support/logger"
              ActiveSupport::Logger.new($stderr)
            end
        logger.warn message
        logger.debug callstack.join("\n  ") if debug
      },

      notify: ->(message, callstack, deprecation_horizon, gem_name) {
        notification_name = "deprecation.#{gem_name.underscore.tr('/', '_')}"
        ActiveSupport::Notifications.instrument(notification_name,
                                                message: message,
                                                callstack: callstack,
                                                gem_name: gem_name,
                                                deprecation_horizon: deprecation_horizon)
      },

      silence: ->(message, callstack, deprecation_horizon, gem_name) { },
    }

    # Behavior module allows to determine how to display deprecation messages.
    # You can create a custom behavior or set any from the +DEFAULT_BEHAVIORS+
    # constant. Available behaviors are:
    #
    # [+raise+]   Raise <tt>ActiveSupport::DeprecationException</tt>.
    # [+stderr+]  Log all deprecation warnings to <tt>$stderr</tt>.
    # [+log+]     Log all deprecation warnings to +Rails.logger+.
    # [+notify+]  Use +ActiveSupport::Notifications+ to notify +deprecation.rails+.
    # [+silence+] Do nothing. On Rails, set <tt>config.active_support.report_deprecations = false</tt> to disable all behaviors.
    #
    # Setting behaviors only affects deprecations that happen after boot time.
    # For more information you can read the documentation of the +behavior=+ method.
    module Behavior
      # Whether to print a backtrace along with the warning.
      attr_accessor :debug

      # Returns the current behavior or if one isn't set, defaults to +:stderr+.
      def behavior
        @behavior ||= [DEFAULT_BEHAVIORS[:stderr]]
      end

      # Returns the current behavior for disallowed deprecations or if one isn't set, defaults to +:raise+.
      def disallowed_behavior
        @disallowed_behavior ||= [DEFAULT_BEHAVIORS[:raise]]
      end

      # Sets the behavior to the specified value. Can be a single value, array,
      # or an object that responds to +call+.
      #
      # Available behaviors:
      #
      # [+raise+]   Raise <tt>ActiveSupport::DeprecationException</tt>.
      # [+stderr+]  Log all deprecation warnings to <tt>$stderr</tt>.
      # [+log+]     Log all deprecation warnings to +Rails.logger+.
      # [+notify+]  Use +ActiveSupport::Notifications+ to notify +deprecation.rails+.
      # [+silence+] Do nothing.
      #
      # Setting behaviors only affects deprecations that happen after boot time.
      # Deprecation warnings raised by gems are not affected by this setting
      # because they happen before Rails boots up.
      #
      #   ActiveSupport::Deprecation.behavior = :stderr
      #   ActiveSupport::Deprecation.behavior = [:stderr, :log]
      #   ActiveSupport::Deprecation.behavior = MyCustomHandler
      #   ActiveSupport::Deprecation.behavior = ->(message, callstack, deprecation_horizon, gem_name) {
      #     # custom stuff
      #   }
      #
      # If you are using Rails, you can set <tt>config.active_support.report_deprecations = false</tt> to disable
      # all deprecation behaviors. This is similar to the +silence+ option but more performant.
      def behavior=(behavior)
        @behavior = Array(behavior).map { |b| DEFAULT_BEHAVIORS[b] || arity_coerce(b) }
      end

      # Sets the behavior for disallowed deprecations (those configured by
      # ActiveSupport::Deprecation.disallowed_warnings=) to the specified
      # value. As with +behavior=+, this can be a single value, array, or an
      # object that responds to +call+.
      def disallowed_behavior=(behavior)
        @disallowed_behavior = Array(behavior).map { |b| DEFAULT_BEHAVIORS[b] || arity_coerce(b) }
      end

      private
        def arity_coerce(behavior)
          unless behavior.respond_to?(:call)
            raise ArgumentError, "#{behavior.inspect} is not a valid deprecation behavior."
          end

          if behavior.respond_to?(:arity) && behavior.arity == 2
            -> message, callstack, _, _ { behavior.call(message, callstack) }
          else
            behavior
          end
        end
    end
  end
end
