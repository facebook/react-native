# frozen_string_literal: true

require "active_support/string_inquirer"
require "active_support/environment_inquirer"

class String
  # Wraps the current string in the ActiveSupport::StringInquirer class,
  # which gives you a prettier way to test for equality.
  #
  #   env = 'production'.inquiry
  #   env.production?  # => true
  #   env.development? # => false
  def inquiry
    ActiveSupport::StringInquirer.new(self)
  end
end
