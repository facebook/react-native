# frozen_string_literal: true

require "active_support/core_ext/array/extract_options"
require "active_support/core_ext/module/redefine_method"

module ActiveSupport
  class Deprecation
    module MethodWrapper
      # Declare that a method has been deprecated.
      #
      #   class Fred
      #     def aaa; end
      #     def bbb; end
      #     def ccc; end
      #     def ddd; end
      #     def eee; end
      #   end
      #
      # Using the default deprecator:
      #   ActiveSupport::Deprecation.deprecate_methods(Fred, :aaa, bbb: :zzz, ccc: 'use Bar#ccc instead')
      #   # => Fred
      #
      #   Fred.new.aaa
      #   # DEPRECATION WARNING: aaa is deprecated and will be removed from Rails 5.1. (called from irb_binding at (irb):10)
      #   # => nil
      #
      #   Fred.new.bbb
      #   # DEPRECATION WARNING: bbb is deprecated and will be removed from Rails 5.1 (use zzz instead). (called from irb_binding at (irb):11)
      #   # => nil
      #
      #   Fred.new.ccc
      #   # DEPRECATION WARNING: ccc is deprecated and will be removed from Rails 5.1 (use Bar#ccc instead). (called from irb_binding at (irb):12)
      #   # => nil
      #
      # Passing in a custom deprecator:
      #   custom_deprecator = ActiveSupport::Deprecation.new('next-release', 'MyGem')
      #   ActiveSupport::Deprecation.deprecate_methods(Fred, ddd: :zzz, deprecator: custom_deprecator)
      #   # => [:ddd]
      #
      #   Fred.new.ddd
      #   DEPRECATION WARNING: ddd is deprecated and will be removed from MyGem next-release (use zzz instead). (called from irb_binding at (irb):15)
      #   # => nil
      #
      # Using a custom deprecator directly:
      #   custom_deprecator = ActiveSupport::Deprecation.new('next-release', 'MyGem')
      #   custom_deprecator.deprecate_methods(Fred, eee: :zzz)
      #   # => [:eee]
      #
      #   Fred.new.eee
      #   DEPRECATION WARNING: eee is deprecated and will be removed from MyGem next-release (use zzz instead). (called from irb_binding at (irb):18)
      #   # => nil
      def deprecate_methods(target_module, *method_names)
        options = method_names.extract_options!
        deprecator = options.delete(:deprecator) || self
        method_names += options.keys
        mod = nil

        method_names.each do |method_name|
          message = options[method_name]
          if target_module.method_defined?(method_name) || target_module.private_method_defined?(method_name)
            method = target_module.instance_method(method_name)
            target_module.module_eval do
              redefine_method(method_name) do |*args, &block|
                deprecator.deprecation_warning(method_name, message)
                method.bind_call(self, *args, &block)
              end
              ruby2_keywords(method_name)
            end
          else
            mod ||= Module.new
            mod.module_eval do
              define_method(method_name) do |*args, &block|
                deprecator.deprecation_warning(method_name, message)
                super(*args, &block)
              end
              ruby2_keywords(method_name)
            end
          end
        end

        target_module.prepend(mod) if mod
      end
    end
  end
end
