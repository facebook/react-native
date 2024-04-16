# frozen_string_literal: true

require "active_support/string_inquirer"

module ActiveSupport
  class EnvironmentInquirer < StringInquirer # :nodoc:
    DEFAULT_ENVIRONMENTS = ["development", "test", "production"]
    def initialize(env)
      super(env)

      DEFAULT_ENVIRONMENTS.each do |default|
        instance_variable_set :"@#{default}", env == default
      end
    end

    DEFAULT_ENVIRONMENTS.each do |env|
      class_eval "def #{env}?; @#{env}; end"
    end
  end
end
