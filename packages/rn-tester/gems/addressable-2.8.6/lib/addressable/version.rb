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


# Used to prevent the class/module from being loaded more than once
if !defined?(Addressable::VERSION)
  module Addressable
    module VERSION
      MAJOR = 2
      MINOR = 8
      TINY  = 6

      STRING = [MAJOR, MINOR, TINY].join('.')
    end
  end
end
