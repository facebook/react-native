# frozen_string_literal: true

require "active_support/core_ext/string/filters"
require "active_support/inflector"

class Module
  # Returns the name of the module containing this one.
  #
  #   M::N.module_parent_name # => "M"
  def module_parent_name
    if defined?(@parent_name)
      @parent_name
    else
      parent_name = name =~ /::[^:]+\z/ ? -$` : nil
      @parent_name = parent_name unless frozen?
      parent_name
    end
  end

  # Returns the module which contains this one according to its name.
  #
  #   module M
  #     module N
  #     end
  #   end
  #   X = M::N
  #
  #   M::N.module_parent # => M
  #   X.module_parent    # => M
  #
  # The parent of top-level and anonymous modules is Object.
  #
  #   M.module_parent          # => Object
  #   Module.new.module_parent # => Object
  def module_parent
    module_parent_name ? ActiveSupport::Inflector.constantize(module_parent_name) : Object
  end

  # Returns all the parents of this module according to its name, ordered from
  # nested outwards. The receiver is not contained within the result.
  #
  #   module M
  #     module N
  #     end
  #   end
  #   X = M::N
  #
  #   M.module_parents    # => [Object]
  #   M::N.module_parents # => [M, Object]
  #   X.module_parents    # => [M, Object]
  def module_parents
    parents = []
    if module_parent_name
      parts = module_parent_name.split("::")
      until parts.empty?
        parents << ActiveSupport::Inflector.constantize(parts * "::")
        parts.pop
      end
    end
    parents << Object unless parents.include? Object
    parents
  end
end
