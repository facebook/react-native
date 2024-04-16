# frozen_string_literal: true

require "active_support/core_ext/module/delegation"

module ActiveSupport
  class Deprecation
    module InstanceDelegator # :nodoc:
      def self.included(base)
        base.extend(ClassMethods)
        base.singleton_class.prepend(OverrideDelegators)
        base.public_class_method :new
      end

      module ClassMethods # :nodoc:
        def include(included_module)
          included_module.instance_methods.each { |m| method_added(m) }
          super
        end

        def method_added(method_name)
          singleton_class.delegate(method_name, to: :instance)
        end
      end

      module OverrideDelegators # :nodoc:
        def warn(message = nil, callstack = nil)
          callstack ||= caller_locations(2)
          super
        end

        def deprecation_warning(deprecated_method_name, message = nil, caller_backtrace = nil)
          caller_backtrace ||= caller_locations(2)
          super
        end
      end
    end
  end
end
