# frozen_string_literal: true

module ActiveSupport::CurrentAttributes::TestHelper # :nodoc:
  def before_setup
    ActiveSupport::CurrentAttributes.reset_all
    super
  end

  def after_teardown
    super
    ActiveSupport::CurrentAttributes.reset_all
  end
end
