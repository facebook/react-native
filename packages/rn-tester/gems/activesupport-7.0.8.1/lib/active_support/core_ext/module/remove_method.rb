# frozen_string_literal: true

require "active_support/core_ext/module/redefine_method"

class Module
  # Removes the named method, if it exists.
  def remove_possible_method(method)
    if method_defined?(method) || private_method_defined?(method)
      undef_method(method)
    end
  end

  # Removes the named singleton method, if it exists.
  def remove_possible_singleton_method(method)
    singleton_class.remove_possible_method(method)
  end
end
