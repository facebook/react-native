# frozen_string_literal: true
require 'ethon/errors/ethon_error'
require 'ethon/errors/global_init'
require 'ethon/errors/multi_timeout'
require 'ethon/errors/multi_fdset'
require 'ethon/errors/multi_add'
require 'ethon/errors/multi_remove'
require 'ethon/errors/select'
require 'ethon/errors/invalid_option'
require 'ethon/errors/invalid_value'

module Ethon

  # This namespace contains all errors raised by ethon.
  module Errors
  end
end
