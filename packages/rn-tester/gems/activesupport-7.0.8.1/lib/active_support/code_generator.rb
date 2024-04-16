# frozen_string_literal: true

module ActiveSupport
  class CodeGenerator # :nodoc:
    class MethodSet
      METHOD_CACHES = Hash.new { |h, k| h[k] = Module.new }

      def initialize(namespace)
        @cache = METHOD_CACHES[namespace]
        @sources = []
        @methods = {}
      end

      def define_cached_method(name, as: name)
        name = name.to_sym
        as = as.to_sym
        @methods.fetch(name) do
          unless @cache.method_defined?(as)
            yield @sources
          end
          @methods[name] = as
        end
      end

      def apply(owner, path, line)
        unless @sources.empty?
          @cache.module_eval("# frozen_string_literal: true\n" + @sources.join(";"), path, line)
        end
        @methods.each do |name, as|
          owner.define_method(name, @cache.instance_method(as))
        end
      end
    end

    class << self
      def batch(owner, path, line)
        if owner.is_a?(CodeGenerator)
          yield owner
        else
          instance = new(owner, path, line)
          result = yield instance
          instance.execute
          result
        end
      end
    end

    def initialize(owner, path, line)
      @owner = owner
      @path = path
      @line = line
      @namespaces = Hash.new { |h, k| h[k] = MethodSet.new(k) }
    end

    def define_cached_method(name, namespace:, as: name, &block)
      @namespaces[namespace].define_cached_method(name, as: as, &block)
    end

    def execute
      @namespaces.each_value do |method_set|
        method_set.apply(@owner, @path, @line - 1)
      end
    end
  end
end
