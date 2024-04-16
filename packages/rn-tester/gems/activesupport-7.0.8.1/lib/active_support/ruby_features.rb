# frozen_string_literal: true

module ActiveSupport
  module RubyFeatures # :nodoc:
    CLASS_SUBCLASSES = Class.method_defined?(:subclasses) # RUBY_VERSION >= "3.1"
  end
end
