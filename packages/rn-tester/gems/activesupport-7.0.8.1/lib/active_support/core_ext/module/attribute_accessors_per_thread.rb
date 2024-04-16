# frozen_string_literal: true

# == Attribute Accessors per Thread
#
# Extends the module object with class/module and instance accessors for
# class/module attributes, just like the native attr* accessors for instance
# attributes, but does so on a per-thread basis.
#
# So the values are scoped within the Thread.current space under the class name
# of the module.
#
# Note that it can also be scoped per-fiber if +Rails.application.config.active_support.isolation_level+
# is set to +:fiber+.
class Module
  # Defines a per-thread class attribute and creates class and instance reader methods.
  # The underlying per-thread class variable is set to +nil+, if it is not previously defined.
  #
  #   module Current
  #     thread_mattr_reader :user
  #   end
  #
  #   Current.user = "DHH"
  #   Current.user # => "DHH"
  #   Thread.new { Current.user }.value # => nil
  #
  # The attribute name must be a valid method name in Ruby.
  #
  #   module Foo
  #     thread_mattr_reader :"1_Badname"
  #   end
  #   # => NameError: invalid attribute name: 1_Badname
  #
  # To omit the instance reader method, pass
  # <tt>instance_reader: false</tt> or <tt>instance_accessor: false</tt>.
  #
  #   class Current
  #     thread_mattr_reader :user, instance_reader: false
  #   end
  #
  #   Current.new.user # => NoMethodError
  def thread_mattr_reader(*syms, instance_reader: true, instance_accessor: true, default: nil) # :nodoc:
    syms.each do |sym|
      raise NameError.new("invalid attribute name: #{sym}") unless /^[_A-Za-z]\w*$/.match?(sym)

      # The following generated method concatenates `name` because we want it
      # to work with inheritance via polymorphism.
      class_eval(<<-EOS, __FILE__, __LINE__ + 1)
        def self.#{sym}
          @__thread_mattr_#{sym} ||= "attr_\#{name}_#{sym}"
          ::ActiveSupport::IsolatedExecutionState[@__thread_mattr_#{sym}]
        end
      EOS

      if instance_reader && instance_accessor
        class_eval(<<-EOS, __FILE__, __LINE__ + 1)
          def #{sym}
            self.class.#{sym}
          end
        EOS
      end

      ::ActiveSupport::IsolatedExecutionState["attr_#{name}_#{sym}"] = default unless default.nil?
    end
  end
  alias :thread_cattr_reader :thread_mattr_reader

  # Defines a per-thread class attribute and creates a class and instance writer methods to
  # allow assignment to the attribute.
  #
  #   module Current
  #     thread_mattr_writer :user
  #   end
  #
  #   Current.user = "DHH"
  #   Thread.current[:attr_Current_user] # => "DHH"
  #
  # To omit the instance writer method, pass
  # <tt>instance_writer: false</tt> or <tt>instance_accessor: false</tt>.
  #
  #   class Current
  #     thread_mattr_writer :user, instance_writer: false
  #   end
  #
  #   Current.new.user = "DHH" # => NoMethodError
  def thread_mattr_writer(*syms, instance_writer: true, instance_accessor: true, default: nil) # :nodoc:
    syms.each do |sym|
      raise NameError.new("invalid attribute name: #{sym}") unless /^[_A-Za-z]\w*$/.match?(sym)

      # The following generated method concatenates `name` because we want it
      # to work with inheritance via polymorphism.
      class_eval(<<-EOS, __FILE__, __LINE__ + 1)
        def self.#{sym}=(obj)
          @__thread_mattr_#{sym} ||= "attr_\#{name}_#{sym}"
          ::ActiveSupport::IsolatedExecutionState[@__thread_mattr_#{sym}] = obj
        end
      EOS

      if instance_writer && instance_accessor
        class_eval(<<-EOS, __FILE__, __LINE__ + 1)
          def #{sym}=(obj)
            self.class.#{sym} = obj
          end
        EOS
      end

      public_send("#{sym}=", default) unless default.nil?
    end
  end
  alias :thread_cattr_writer :thread_mattr_writer

  # Defines both class and instance accessors for class attributes.
  #
  #   class Account
  #     thread_mattr_accessor :user
  #   end
  #
  #   Account.user = "DHH"
  #   Account.user     # => "DHH"
  #   Account.new.user # => "DHH"
  #
  # Unlike +mattr_accessor+, values are *not* shared with subclasses or parent classes.
  # If a subclass changes the value, the parent class' value is not changed.
  # If the parent class changes the value, the value of subclasses is not changed.
  #
  #   class Customer < Account
  #   end
  #
  #   Account.user   # => "DHH"
  #   Customer.user  # => nil
  #   Customer.user  = "Rafael"
  #   Customer.user  # => "Rafael"
  #   Account.user   # => "DHH"
  #
  # To omit the instance writer method, pass <tt>instance_writer: false</tt>.
  # To omit the instance reader method, pass <tt>instance_reader: false</tt>.
  #
  #   class Current
  #     thread_mattr_accessor :user, instance_writer: false, instance_reader: false
  #   end
  #
  #   Current.new.user = "DHH"  # => NoMethodError
  #   Current.new.user          # => NoMethodError
  #
  # Or pass <tt>instance_accessor: false</tt>, to omit both instance methods.
  #
  #   class Current
  #     thread_mattr_accessor :user, instance_accessor: false
  #   end
  #
  #   Current.new.user = "DHH"  # => NoMethodError
  #   Current.new.user          # => NoMethodError
  def thread_mattr_accessor(*syms, instance_reader: true, instance_writer: true, instance_accessor: true, default: nil)
    thread_mattr_reader(*syms, instance_reader: instance_reader, instance_accessor: instance_accessor, default: default)
    thread_mattr_writer(*syms, instance_writer: instance_writer, instance_accessor: instance_accessor)
  end
  alias :thread_cattr_accessor :thread_mattr_accessor
end
