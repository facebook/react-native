# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Libc do
  describe "#getdtablesize", :if => !Ethon::Curl.windows? do
    it "returns an integer" do
      expect(Ethon::Libc.getdtablesize).to be_a(Integer)
    end

    it "returns bigger zero", :if => !Ethon::Curl.windows? do
      expect(Ethon::Libc.getdtablesize).to_not be_zero
    end
  end
end
