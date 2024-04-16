# frozen_string_literal: true

module ActiveSupport::ExecutionContext::TestHelper # :nodoc:
  def before_setup
    ActiveSupport::ExecutionContext.clear
    super
  end

  def after_teardown
    super
    ActiveSupport::ExecutionContext.clear
  end
end
