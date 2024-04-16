# frozen_string_literal: true

module ActiveSupport
  class Deprecation
    module Disallowed
      # Sets the criteria used to identify deprecation messages which should be
      # disallowed. Can be an array containing strings, symbols, or regular
      # expressions. (Symbols are treated as strings.) These are compared against
      # the text of the generated deprecation warning.
      #
      # Additionally the scalar symbol +:all+ may be used to treat all
      # deprecations as disallowed.
      #
      # Deprecations matching a substring or regular expression will be handled
      # using the configured Behavior#disallowed_behavior rather than
      # Behavior#behavior.
      attr_writer :disallowed_warnings

      # Returns the configured criteria used to identify deprecation messages
      # which should be treated as disallowed.
      def disallowed_warnings
        @disallowed_warnings ||= []
      end

      private
        def deprecation_disallowed?(message)
          disallowed = ActiveSupport::Deprecation.disallowed_warnings
          return false if explicitly_allowed?(message)
          return true if disallowed == :all
          disallowed.any? do |rule|
            case rule
            when String, Symbol
              message.include?(rule.to_s)
            when Regexp
              rule.match?(message)
            end
          end
        end

        def explicitly_allowed?(message)
          allowances = @explicitly_allowed_warnings.value
          return false unless allowances
          return true if allowances == :all
          allowances = [allowances] unless allowances.kind_of?(Array)
          allowances.any? do |rule|
            case rule
            when String, Symbol
              message.include?(rule.to_s)
            when Regexp
              rule.match?(message)
            end
          end
        end
    end
  end
end
