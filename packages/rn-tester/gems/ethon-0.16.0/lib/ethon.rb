# frozen_string_literal: true
require 'logger'
require 'ffi'
require 'thread'
begin
  require 'mime/types/columnar'
rescue LoadError
  begin
    require 'mime/types'
  rescue LoadError
  end
end
require 'tempfile'

require 'ethon/libc'
require 'ethon/curl'
require 'ethon/easy'
require 'ethon/errors'
require 'ethon/loggable'
require 'ethon/multi'
require 'ethon/version'

# Ethon is a very simple libcurl.
# It provides direct access to libcurl functionality
# as well as some helpers for doing http requests.
#
# Ethon was extracted from Typhoeus. If you want to
# see how others use Ethon look at the Typhoeus code.
#
# @see https://www.github.com/typhoeus/typhoeus Typhoeus
#
# @note Please update to the latest libcurl version in order
#   to benefit from all features and bugfixes.
#   http://curl.haxx.se/download.html
module Ethon
end
