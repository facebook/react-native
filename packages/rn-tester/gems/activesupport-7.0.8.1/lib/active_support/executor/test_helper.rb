# frozen_string_literal: true

module ActiveSupport::Executor::TestHelper # :nodoc:
  def run(...)
    Rails.application.executor.perform { super }
  end
end
