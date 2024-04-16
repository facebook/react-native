require 'concurrent/thread_safe/util'

module Concurrent

  # @!visibility private
  module ThreadSafe

    # @!visibility private
    module Util
      
      # @!visibility private
      module Volatile

        # Provides +volatile+ (in the JVM's sense) attribute accessors implemented
        # atop of +Concurrent::AtomicReference+.
        #
        # Usage:
        #   class Foo
        #     extend Concurrent::ThreadSafe::Util::Volatile
        #     attr_volatile :foo, :bar
        #
        #     def initialize(bar)
        #       super() # must super() into parent initializers before using the volatile attribute accessors
        #       self.bar = bar
        #     end
        #
        #     def hello
        #       my_foo = foo # volatile read
        #       self.foo = 1 # volatile write
        #       cas_foo(1, 2) # => true | a strong CAS
        #     end
        #   end
        def attr_volatile(*attr_names)
          return if attr_names.empty?
          include(Module.new do
            atomic_ref_setup = attr_names.map {|attr_name| "@__#{attr_name} = Concurrent::AtomicReference.new"}
            initialize_copy_setup = attr_names.zip(atomic_ref_setup).map do |attr_name, ref_setup|
              "#{ref_setup}(other.instance_variable_get(:@__#{attr_name}).get)"
            end
            class_eval <<-RUBY_EVAL, __FILE__, __LINE__ + 1
            def initialize(*)
              super
            #{atomic_ref_setup.join('; ')}
            end

            def initialize_copy(other)
              super
            #{initialize_copy_setup.join('; ')}
            end
            RUBY_EVAL

            attr_names.each do |attr_name|
              class_eval <<-RUBY_EVAL, __FILE__, __LINE__ + 1
              def #{attr_name}
                @__#{attr_name}.get
              end

              def #{attr_name}=(value)
                @__#{attr_name}.set(value)
              end

              def compare_and_set_#{attr_name}(old_value, new_value)
                @__#{attr_name}.compare_and_set(old_value, new_value)
              end
              RUBY_EVAL

              alias_method :"cas_#{attr_name}", :"compare_and_set_#{attr_name}"
              alias_method :"lazy_set_#{attr_name}", :"#{attr_name}="
            end
          end)
        end
      end
    end
  end
end
