# frozen_string_literal: true

require "test_helper"

class ErrorsTest < Minitest::Test

  # Inherits from StandardError
  def test_error_inheritance
    assert_kind_of  StandardError,
                    PublicSuffix::Error.new
  end

  # Inherits from PublicSuffix::Error
  def test_domain_invalid_inheritance
    assert_kind_of  PublicSuffix::Error,
                    PublicSuffix::DomainInvalid.new
  end

  # Inherits from PublicSuffix::DomainInvalid
  def test_domain_not_allowed_inheritance
    assert_kind_of  PublicSuffix::DomainInvalid,
                    PublicSuffix::DomainNotAllowed.new
  end

end
