# frozen_string_literal: true

require "active_support/security_utils"
require "active_support/messages/rotator"

module ActiveSupport
  # The ActiveSupport::SecureCompareRotator is a wrapper around ActiveSupport::SecurityUtils.secure_compare
  # and allows you to rotate a previously defined value to a new one.
  #
  # It can be used as follow:
  #
  #   rotator = ActiveSupport::SecureCompareRotator.new('new_production_value')
  #   rotator.rotate('previous_production_value')
  #   rotator.secure_compare!('previous_production_value')
  #
  # One real use case example would be to rotate a basic auth credentials:
  #
  #   class MyController < ApplicationController
  #     def authenticate_request
  #       rotator = ActiveSupport::SecureCompareRotator.new('new_password')
  #       rotator.rotate('old_password')
  #
  #       authenticate_or_request_with_http_basic do |username, password|
  #         rotator.secure_compare!(password)
  #       rescue ActiveSupport::SecureCompareRotator::InvalidMatch
  #         false
  #       end
  #     end
  #   end
  class SecureCompareRotator
    include SecurityUtils
    prepend Messages::Rotator

    InvalidMatch = Class.new(StandardError)

    def initialize(value, **_options)
      @value = value
    end

    def secure_compare!(other_value, on_rotation: @on_rotation)
      secure_compare(@value, other_value) ||
        run_rotations(on_rotation) { |wrapper| wrapper.secure_compare!(other_value) } ||
        raise(InvalidMatch)
    end

    private
      def build_rotation(previous_value, _options)
        self.class.new(previous_value)
      end
  end
end
