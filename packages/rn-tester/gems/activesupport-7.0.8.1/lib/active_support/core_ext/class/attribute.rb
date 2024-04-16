# frozen_string_literal: true

require "active_support/core_ext/module/redefine_method"

class Class
  # Declare a class-level attribute whose value is inheritable by subclasses.
  # Subclasses can change their own value and it will not impact parent class.
  #
  # ==== Options
  #
  # * <tt>:instance_reader</tt> - Sets the instance reader method (defaults to true).
  # * <tt>:instance_writer</tt> - Sets the instance writer method (defaults to true).
  # * <tt>:instance_accessor</tt> - Sets both instance methods (defaults to true).
  # * <tt>:instance_predicate</tt> - Sets a predicate method (defaults to true).
  # * <tt>:default</tt> - Sets a default value for the attribute (defaults to nil).
  #
  # ==== Examples
  #
  #   class Base
  #     class_attribute :setting
  #   end
  #
  #   class Subclass < Base
  #   end
  #
  #   Base.setting = true
  #   Subclass.setting            # => true
  #   Subclass.setting = false
  #   Subclass.setting            # => false
  #   Base.setting                # => true
  #
  # In the above case as long as Subclass does not assign a value to setting
  # by performing <tt>Subclass.setting = _something_</tt>, <tt>Subclass.setting</tt>
  # would read value assigned to parent class. Once Subclass assigns a value then
  # the value assigned by Subclass would be returned.
  #
  # This matches normal Ruby method inheritance: think of writing an attribute
  # on a subclass as overriding the reader method. However, you need to be aware
  # when using +class_attribute+ with mutable structures as +Array+ or +Hash+.
  # In such cases, you don't want to do changes in place. Instead use setters:
  #
  #   Base.setting = []
  #   Base.setting                # => []
  #   Subclass.setting            # => []
  #
  #   # Appending in child changes both parent and child because it is the same object:
  #   Subclass.setting << :foo
  #   Base.setting               # => [:foo]
  #   Subclass.setting           # => [:foo]
  #
  #   # Use setters to not propagate changes:
  #   Base.setting = []
  #   Subclass.setting += [:foo]
  #   Base.setting               # => []
  #   Subclass.setting           # => [:foo]
  #
  # For convenience, an instance predicate method is defined as well.
  # To skip it, pass <tt>instance_predicate: false</tt>.
  #
  #   Subclass.setting?       # => false
  #
  # Instances may overwrite the class value in the same way:
  #
  #   Base.setting = true
  #   object = Base.new
  #   object.setting          # => true
  #   object.setting = false
  #   object.setting          # => false
  #   Base.setting            # => true
  #
  # To opt out of the instance reader method, pass <tt>instance_reader: false</tt>.
  #
  #   object.setting          # => NoMethodError
  #   object.setting?         # => NoMethodError
  #
  # To opt out of the instance writer method, pass <tt>instance_writer: false</tt>.
  #
  #   object.setting = false  # => NoMethodError
  #
  # To opt out of both instance methods, pass <tt>instance_accessor: false</tt>.
  #
  # To set a default value for the attribute, pass <tt>default:</tt>, like so:
  #
  #   class_attribute :settings, default: {}
  def class_attribute(*attrs, instance_accessor: true,
    instance_reader: instance_accessor, instance_writer: instance_accessor, instance_predicate: true, default: nil)

    class_methods, methods = [], []
    attrs.each do |name|
      unless name.is_a?(Symbol) || name.is_a?(String)
        raise TypeError, "#{name.inspect} is not a symbol nor a string"
      end

      class_methods << <<~RUBY # In case the method exists and is not public
        silence_redefinition_of_method def #{name}
        end
      RUBY

      methods << <<~RUBY if instance_reader
        silence_redefinition_of_method def #{name}
          defined?(@#{name}) ? @#{name} : self.class.#{name}
        end
      RUBY

      class_methods << <<~RUBY
        silence_redefinition_of_method def #{name}=(value)
          redefine_method(:#{name}) { value } if singleton_class?
          redefine_singleton_method(:#{name}) { value }
          value
        end
      RUBY

      methods << <<~RUBY if instance_writer
        silence_redefinition_of_method(:#{name}=)
        attr_writer :#{name}
      RUBY

      if instance_predicate
        class_methods << "silence_redefinition_of_method def #{name}?; !!self.#{name}; end"
        if instance_reader
          methods << "silence_redefinition_of_method def #{name}?; !!self.#{name}; end"
        end
      end
    end

    location = caller_locations(1, 1).first
    class_eval(["class << self", *class_methods, "end", *methods].join(";").tr("\n", ";"), location.path, location.lineno)

    attrs.each { |name| public_send("#{name}=", default) }
  end
end
