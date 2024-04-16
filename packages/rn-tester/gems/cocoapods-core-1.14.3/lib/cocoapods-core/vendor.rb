module Pod
  # Namespaces the vendored modules.
  #
  module Vendor
    # Namespaces the classes of RubyGems used by CocoaPods.
    #
    # CocoaPods needs to vendor RubyGems because OS X ships with `v1.3.6` which
    # has a couple of bugs related to the comparison of pre-release versions.
    #
    # E.g. https://github.com/CocoaPods/CocoaPods/issues/398
    #
    # The following classes are copied from RubyGems `v2.6.3`. The changes
    # performed to the source files are the following:
    #
    # - Namespaced in `Pod::Vendor`
    # - commented all the `require` calls
    # - replaced `::Gem` with `Pod::Vendor::Gem`
    #
    module Gem
      require 'cocoapods-core/vendor/version'
      require 'cocoapods-core/vendor/requirement'

      #-----------------------------------------------------------------------#
      # RubyGems License                                                      #
      # https://github.com/rubygems/rubygems/blob/master/MIT.txt              #
      #-----------------------------------------------------------------------#

      # Copyright (c) Chad Fowler, Rich Kilmer, Jim Weirich and others.
      #
      # Permission is hereby granted, free of charge, to any person obtaining
      # a copy of this software and associated documentation files (the
      # 'Software'), to deal in the Software without restriction, including
      # without limitation the rights to use, copy, modify, merge, publish,
      # distribute, sublicense, and/or sell copies of the Software, and to
      # permit persons to whom the Software is furnished to do so, subject to
      # the following conditions:
      #
      # The above copyright notice and this permission notice shall be
      # included in all copies or substantial portions of the Software.
      #
      # THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
      # EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      # MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
      # IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
      # CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
      # TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
      # SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    end
  end
end
