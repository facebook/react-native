require 'concurrent/utility/native_extension_loader' # load native parts first

require 'concurrent/synchronization/safe_initialization'
require 'concurrent/synchronization/volatile'
require 'concurrent/atomic/atomic_reference'

module Concurrent
  module Synchronization

    # Abstract object providing final, volatile, ans CAS extensions to build other concurrent abstractions.
    # - final instance variables see {Object.safe_initialization!}
    # - volatile instance variables see {Object.attr_volatile}
    # - volatile instance variables see {Object.attr_atomic}
    # @!visibility private
    class Object < AbstractObject
      include Volatile

      # TODO make it a module if possible

      # @!method self.attr_volatile(*names)
      #   Creates methods for reading and writing (as `attr_accessor` does) to a instance variable with
      #   volatile (Java) semantic. The instance variable should be accessed only through generated methods.
      #
      #   @param [::Array<Symbol>] names of the instance variables to be volatile
      #   @return [::Array<Symbol>] names of defined method names

      # Has to be called by children.
      def initialize
        super
        __initialize_atomic_fields__
      end

      def self.safe_initialization!
        extend SafeInitialization unless safe_initialization?
      end

      def self.safe_initialization?
        self.singleton_class < SafeInitialization
      end

      # For testing purposes, quite slow. Injects assert code to new method which will raise if class instance contains
      # any instance variables with CamelCase names and isn't {.safe_initialization?}.
      # @raise when offend found
      # @return [true]
      def self.ensure_safe_initialization_when_final_fields_are_present
        Object.class_eval do
          def self.new(*args, &block)
            object = super(*args, &block)
          ensure
            has_final_field = object.instance_variables.any? { |v| v.to_s =~ /^@[A-Z]/ }
            if has_final_field && !safe_initialization?
              raise "there was an instance of #{object.class} with final field but not marked with safe_initialization!"
            end
          end
        end
        true
      end

      # Creates methods for reading and writing to a instance variable with
      # volatile (Java) semantic as {.attr_volatile} does.
      # The instance variable should be accessed oly through generated methods.
      # This method generates following methods: `value`, `value=(new_value) #=> new_value`,
      # `swap_value(new_value) #=> old_value`,
      # `compare_and_set_value(expected, value) #=> true || false`, `update_value(&block)`.
      # @param [::Array<Symbol>] names of the instance variables to be volatile with CAS.
      # @return [::Array<Symbol>] names of defined method names.
      # @!macro attr_atomic
      #   @!method $1
      #     @return [Object] The $1.
      #   @!method $1=(new_$1)
      #     Set the $1.
      #     @return [Object] new_$1.
      #   @!method swap_$1(new_$1)
      #     Set the $1 to new_$1 and return the old $1.
      #     @return [Object] old $1
      #   @!method compare_and_set_$1(expected_$1, new_$1)
      #     Sets the $1 to new_$1 if the current $1 is expected_$1
      #     @return [true, false]
      #   @!method update_$1(&block)
      #     Updates the $1 using the block.
      #     @yield [Object] Calculate a new $1 using given (old) $1
      #     @yieldparam [Object] old $1
      #     @return [Object] new $1
      def self.attr_atomic(*names)
        @__atomic_fields__ ||= []
        @__atomic_fields__ += names
        safe_initialization!
        define_initialize_atomic_fields

        names.each do |name|
          ivar = :"@Atomic#{name.to_s.gsub(/(?:^|_)(.)/) { $1.upcase }}"
          class_eval <<-RUBY, __FILE__, __LINE__ + 1
            def #{name}
              #{ivar}.get
            end

            def #{name}=(value)
              #{ivar}.set value
            end

            def swap_#{name}(value)
              #{ivar}.swap value
            end

            def compare_and_set_#{name}(expected, value)
              #{ivar}.compare_and_set expected, value
            end

            def update_#{name}(&block)
              #{ivar}.update(&block)
            end
          RUBY
        end
        names.flat_map { |n| [n, :"#{n}=", :"swap_#{n}", :"compare_and_set_#{n}", :"update_#{n}"] }
      end

      # @param [true, false] inherited should inherited volatile with CAS fields be returned?
      # @return [::Array<Symbol>] Returns defined volatile with CAS fields on this class.
      def self.atomic_attributes(inherited = true)
        @__atomic_fields__ ||= []
        ((superclass.atomic_attributes if superclass.respond_to?(:atomic_attributes) && inherited) || []) + @__atomic_fields__
      end

      # @return [true, false] is the attribute with name atomic?
      def self.atomic_attribute?(name)
        atomic_attributes.include? name
      end

      private

      def self.define_initialize_atomic_fields
        assignments = @__atomic_fields__.map do |name|
          "@Atomic#{name.to_s.gsub(/(?:^|_)(.)/) { $1.upcase }} = Concurrent::AtomicReference.new(nil)"
        end.join("\n")

        class_eval <<-RUBY, __FILE__, __LINE__ + 1
          def __initialize_atomic_fields__
            super
            #{assignments}
          end
        RUBY
      end

      private_class_method :define_initialize_atomic_fields

      def __initialize_atomic_fields__
      end

    end
  end
end
