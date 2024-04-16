# frozen_string_literal: true

# = Public Suffix
#
# Domain name parser based on the Public Suffix List.
#
# Copyright (c) 2009-2022 Simone Carletti <weppos@weppos.net>

module PublicSuffix

  class Error < StandardError
  end

  # Raised when trying to parse an invalid name.
  # A name is considered invalid when no rule is found in the definition list.
  #
  # @example
  #
  #   PublicSuffix.parse("nic.test")
  #   # => PublicSuffix::DomainInvalid
  #
  #   PublicSuffix.parse("http://www.nic.it")
  #   # => PublicSuffix::DomainInvalid
  #
  class DomainInvalid < Error
  end

  # Raised when trying to parse a name that matches a suffix.
  #
  # @example
  #
  #   PublicSuffix.parse("nic.do")
  #   # => PublicSuffix::DomainNotAllowed
  #
  #   PublicSuffix.parse("www.nic.do")
  #   # => PublicSuffix::Domain
  #
  class DomainNotAllowed < DomainInvalid
  end

end
