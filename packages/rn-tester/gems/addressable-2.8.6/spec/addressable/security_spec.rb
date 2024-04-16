# frozen_string_literal: true

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


require "spec_helper"

require "addressable/uri"

describe Addressable::URI, "when created with a URI known to cause crashes " +
    "in certain browsers" do
  it "should parse correctly" do
    uri = Addressable::URI.parse('%%30%30')
    expect(uri.path).to eq('%%30%30')
    expect(uri.normalize.path).to eq('%2500')
  end

  it "should parse correctly as a full URI" do
    uri = Addressable::URI.parse('http://www.example.com/%%30%30')
    expect(uri.path).to eq('/%%30%30')
    expect(uri.normalize.path).to eq('/%2500')
  end
end

describe Addressable::URI, "when created with a URI known to cause crashes " +
    "in certain browsers" do
  it "should parse correctly" do
    uri = Addressable::URI.parse('لُصّبُلُلصّبُررً ॣ ॣh ॣ ॣ 冗')
    expect(uri.path).to eq('لُصّبُلُلصّبُررً ॣ ॣh ॣ ॣ 冗')
    expect(uri.normalize.path).to eq(
      '%D9%84%D9%8F%D8%B5%D9%91%D8%A8%D9%8F%D9%84%D9%8F%D9%84%D8%B5%D9%91' +
      '%D8%A8%D9%8F%D8%B1%D8%B1%D9%8B%20%E0%A5%A3%20%E0%A5%A3h%20%E0%A5' +
      '%A3%20%E0%A5%A3%20%E5%86%97'
    )
  end

  it "should parse correctly as a full URI" do
    uri = Addressable::URI.parse('http://www.example.com/لُصّبُلُلصّبُررً ॣ ॣh ॣ ॣ 冗')
    expect(uri.path).to eq('/لُصّبُلُلصّبُررً ॣ ॣh ॣ ॣ 冗')
    expect(uri.normalize.path).to eq(
      '/%D9%84%D9%8F%D8%B5%D9%91%D8%A8%D9%8F%D9%84%D9%8F%D9%84%D8%B5%D9%91' +
      '%D8%A8%D9%8F%D8%B1%D8%B1%D9%8B%20%E0%A5%A3%20%E0%A5%A3h%20%E0%A5' +
      '%A3%20%E0%A5%A3%20%E5%86%97'
    )
  end
end
