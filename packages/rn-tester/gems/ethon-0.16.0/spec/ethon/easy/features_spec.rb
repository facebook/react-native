# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Easy::Informations do

  describe "#supports_asynch_dns?" do
    it "returns boolean" do
      expect([true, false].include? Ethon::Easy.supports_asynch_dns?).to be_truthy
    end
  end

  describe "#supports_zlib?" do
    it "returns boolean" do
      expect([true, false].include? Ethon::Easy.supports_zlib?).to be_truthy
    end
  end

  describe "#supports_timeout_ms?" do
    it "returns boolean" do
      expect([true, false].include? Ethon::Easy.supports_timeout_ms?).to be_truthy
    end
  end

end
