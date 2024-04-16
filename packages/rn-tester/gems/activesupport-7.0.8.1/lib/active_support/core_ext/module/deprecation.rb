# frozen_string_literal: true

class Module
  #   deprecate :foo
  #   deprecate bar: 'message'
  #   deprecate :foo, :bar, baz: 'warning!', qux: 'gone!'
  #
  # You can also use custom deprecator instance:
  #
  #   deprecate :foo, deprecator: MyLib::Deprecator.new
  #   deprecate :foo, bar: "warning!", deprecator: MyLib::Deprecator.new
  #
  # \Custom deprecators must respond to <tt>deprecation_warning(deprecated_method_name, message, caller_backtrace)</tt>
  # method where you can implement your custom warning behavior.
  #
  #   class MyLib::Deprecator
  #     def deprecation_warning(deprecated_method_name, message, caller_backtrace = nil)
  #       message = "#{deprecated_method_name} is deprecated and will be removed from MyLibrary | #{message}"
  #       Kernel.warn message
  #     end
  #   end
  def deprecate(*method_names)
    ActiveSupport::Deprecation.deprecate_methods(self, *method_names)
  end
end
