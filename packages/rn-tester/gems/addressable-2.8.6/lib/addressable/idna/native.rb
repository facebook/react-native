# frozen_string_literal: true

#--
# Copyright (C) Bob Aman
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
#++


require "idn"

module Addressable
  module IDNA
    def self.punycode_encode(value)
      IDN::Punycode.encode(value.to_s)
    end

     def self.punycode_decode(value)
       IDN::Punycode.decode(value.to_s)
     end

    class << self
      # @deprecated Use {String#unicode_normalize(:nfkc)} instead
      def unicode_normalize_kc(value)
        value.to_s.unicode_normalize(:nfkc)
      end

      extend Gem::Deprecate
      deprecate :unicode_normalize_kc, "String#unicode_normalize(:nfkc)", 2023, 4
    end

    def self.to_ascii(value)
      value.to_s.split('.', -1).map do |segment|
        if segment.size > 0 && segment.size < 64
          IDN::Idna.toASCII(segment, IDN::Idna::ALLOW_UNASSIGNED)
        elsif segment.size >= 64
          segment
        else
          ''
        end
      end.join('.')
    end

    def self.to_unicode(value)
      value.to_s.split('.', -1).map do |segment|
        if segment.size > 0 && segment.size < 64
          IDN::Idna.toUnicode(segment, IDN::Idna::ALLOW_UNASSIGNED)
        elsif segment.size >= 64
          segment
        else
          ''
        end
      end.join('.')
    end
  end
end
