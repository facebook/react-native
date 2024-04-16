module Concurrent

  # Methods form module A included to a module B, which is already included into class C,
  # will not be visible in the C class. If this module is extended to B then A's methods
  # are correctly made visible to C.
  #
  # @example
  #   module A
  #     def a
  #       :a
  #     end
  #   end
  #
  #   module B1
  #   end
  #
  #   class C1
  #     include B1
  #   end
  #
  #   module B2
  #     extend Concurrent::ReInclude
  #   end
  #
  #   class C2
  #     include B2
  #   end
  #
  #   B1.send :include, A
  #   B2.send :include, A
  #
  #   C1.new.respond_to? :a # => false
  #   C2.new.respond_to? :a # => true
  #
  # @!visibility private
  module ReInclude
    # @!visibility private
    def included(base)
      (@re_include_to_bases ||= []) << [:include, base]
      super(base)
    end

    # @!visibility private
    def extended(base)
      (@re_include_to_bases ||= []) << [:extend, base]
      super(base)
    end

    # @!visibility private
    def include(*modules)
      result = super(*modules)
      modules.reverse.each do |module_being_included|
        (@re_include_to_bases ||= []).each do |method, mod|
          mod.send method, module_being_included
        end
      end
      result
    end
  end
end
