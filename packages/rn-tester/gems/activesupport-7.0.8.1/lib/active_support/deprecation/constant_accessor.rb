# frozen_string_literal: true

module ActiveSupport
  class Deprecation
    # DeprecatedConstantAccessor transforms a constant into a deprecated one by
    # hooking +const_missing+.
    #
    # It takes the names of an old (deprecated) constant and of a new constant
    # (both in string form) and optionally a deprecator. The deprecator defaults
    # to +ActiveSupport::Deprecator+ if none is specified.
    #
    # The deprecated constant now returns the same object as the new one rather
    # than a proxy object, so it can be used transparently in +rescue+ blocks
    # etc.
    #
    #   PLANETS = %w(mercury venus earth mars jupiter saturn uranus neptune pluto)
    #
    #   # (In a later update, the original implementation of `PLANETS` has been removed.)
    #
    #   PLANETS_POST_2006 = %w(mercury venus earth mars jupiter saturn uranus neptune)
    #   include ActiveSupport::Deprecation::DeprecatedConstantAccessor
    #   deprecate_constant 'PLANETS', 'PLANETS_POST_2006'
    #
    #   PLANETS.map { |planet| planet.capitalize }
    #   # => DEPRECATION WARNING: PLANETS is deprecated! Use PLANETS_POST_2006 instead.
    #        (Backtrace information…)
    #        ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"]
    module DeprecatedConstantAccessor
      def self.included(base)
        require "active_support/inflector/methods"

        extension = Module.new do
          def const_missing(missing_const_name)
            if class_variable_defined?(:@@_deprecated_constants)
              if (replacement = class_variable_get(:@@_deprecated_constants)[missing_const_name.to_s])
                replacement[:deprecator].warn(replacement[:message] || "#{name}::#{missing_const_name} is deprecated! Use #{replacement[:new]} instead.", caller_locations)
                return ActiveSupport::Inflector.constantize(replacement[:new].to_s)
              end
            end
            super
          end

          def deprecate_constant(const_name, new_constant, message: nil, deprecator: ActiveSupport::Deprecation.instance)
            class_variable_set(:@@_deprecated_constants, {}) unless class_variable_defined?(:@@_deprecated_constants)
            class_variable_get(:@@_deprecated_constants)[const_name.to_s] = { new: new_constant, message: message, deprecator: deprecator }
          end
        end
        base.singleton_class.prepend extension
      end
    end
  end
end
