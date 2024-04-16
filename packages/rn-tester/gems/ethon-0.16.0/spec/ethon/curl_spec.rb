# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Curl do
  describe ".init" do
    before { Ethon::Curl.send(:class_variable_set, :@@initialized, false) }

    context "when global_init fails" do
      it "raises global init error" do
        expect(Ethon::Curl).to receive(:global_init).and_return(1)
        expect{ Ethon::Curl.init }.to raise_error(Ethon::Errors::GlobalInit)
      end
    end

    context "when global_init works" do
      before { expect(Ethon::Curl).to receive(:global_init).and_return(0) }

      it "doesn't raises global init error" do
        expect{ Ethon::Curl.init }.to_not raise_error
      end

      it "logs" do
        expect(Ethon.logger).to receive(:debug)
        Ethon::Curl.init
      end
    end

    context "when global_cleanup is called" do
      before { expect(Ethon::Curl).to receive(:global_cleanup) }

      it "logs" do
        expect(Ethon.logger).to receive(:debug).twice
        Ethon::Curl.init
        Ethon::Curl.cleanup
      end
    end
  end
end
