require 'concurrent/utility/native_extension_loader' # load native parts first
require 'concurrent/utility/engine'
require 'concurrent/synchronization/full_memory_barrier'

module Concurrent
  module Synchronization

    # Volatile adds the attr_volatile class method when included.
    #
    # @example
    #   class Foo
    #     include Concurrent::Synchronization::Volatile
    #
    #     attr_volatile :bar
    #
    #     def initialize
    #       self.bar = 1
    #     end
    #   end
    #
    #  foo = Foo.new
    #  foo.bar
    #  => 1
    #  foo.bar = 2
    #  => 2
    #
    # @!visibility private
    module Volatile
      def self.included(base)
        base.extend(ClassMethods)
      end

      def full_memory_barrier
        Synchronization.full_memory_barrier
      end

      module ClassMethods
        if Concurrent.on_cruby?
          def attr_volatile(*names)
            names.each do |name|
              ivar = :"@volatile_#{name}"
              class_eval <<-RUBY, __FILE__, __LINE__ + 1
                def #{name}
                  #{ivar}
                end

                def #{name}=(value)
                  #{ivar} = value
                end
              RUBY
            end
            names.map { |n| [n, :"#{n}="] }.flatten
          end

        elsif Concurrent.on_jruby?
          def attr_volatile(*names)
            names.each do |name|
              ivar = :"@volatile_#{name}"

              class_eval <<-RUBY, __FILE__, __LINE__ + 1
                def #{name}
                  ::Concurrent::Synchronization::JRubyAttrVolatile.instance_variable_get_volatile(self, :#{ivar})
                end

                def #{name}=(value)
                  ::Concurrent::Synchronization::JRubyAttrVolatile.instance_variable_set_volatile(self, :#{ivar}, value)
                end
              RUBY

            end
            names.map { |n| [n, :"#{n}="] }.flatten
          end

        else
          warn 'Possibly unsupported Ruby implementation' unless Concurrent.on_truffleruby?

          def attr_volatile(*names)
            names.each do |name|
              ivar = :"@volatile_#{name}"

              class_eval <<-RUBY, __FILE__, __LINE__ + 1
                def #{name}
                  ::Concurrent::Synchronization.full_memory_barrier
                  #{ivar}
                end

                def #{name}=(value)
                  #{ivar} = value
                  ::Concurrent::Synchronization.full_memory_barrier
                end
              RUBY
            end

            names.map { |n| [n, :"#{n}="] }.flatten
          end
        end
      end

    end
  end
end
