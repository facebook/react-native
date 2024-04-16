# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Easy::Informations do
  let(:easy) { Ethon::Easy.new }

  before do
    easy.url = "http://localhost:3001"
    easy.perform
  end

  describe "#httpauth_avail" do
    it "returns" do
      expect(easy.httpauth_avail).to be
    end
  end

  describe "#total_time" do
    it "returns float" do
      expect(easy.total_time).to be_a(Float)
    end
  end

  describe "#starttransfer_time" do
    it "returns float" do
      expect(easy.starttransfer_time).to be_a(Float)
    end
  end

  describe "#appconnect_time" do
    it "returns float" do
      expect(easy.appconnect_time).to be_a(Float)
    end
  end

  describe "#pretransfer_time" do
    it "returns float" do
      expect(easy.pretransfer_time).to be_a(Float)
    end
  end

  describe "#connect_time" do
    it "returns float" do
      expect(easy.connect_time).to be_a(Float)
    end
  end

  describe "#namelookup_time" do
    it "returns float" do
      expect(easy.namelookup_time).to be_a(Float)
    end
  end

  describe "#redirect_time" do
    it "returns float" do
      expect(easy.redirect_time).to be_a(Float)
    end
  end

  describe "#effective_url" do
    it "returns url" do
      expect(easy.effective_url).to match(/^http:\/\/localhost:3001\/?/)
    end
  end

  describe "#primary_ip" do
    it "returns localhost" do
      expect(easy.primary_ip).to match(/::1|127\.0\.0\.1/)
    end
  end

  describe "#response_code" do
    it "returns 200" do
      expect(easy.response_code).to eq(200)
    end
  end

  describe "#redirect_count" do
    it "returns 0" do
      expect(easy.redirect_count).to eq(0)
    end
  end

  describe "#redirect_url" do
    it "returns nil as there is no redirect" do
      expect(easy.redirect_url).to be(nil)
    end
  end

  describe "#request_size" do
    it "returns 53" do
      expect(easy.request_size).to eq(53)
    end
  end

  describe "#supports_zlib?" do
    it "returns true" do
      expect(Kernel).to receive(:warn)
      expect(easy.supports_zlib?).to be_truthy
    end
  end

  describe "#size_upload" do
    it "returns float" do
      expect(easy.size_upload).to be_a(Float)
    end
  end

  describe "#size_download" do
    it "returns float" do
      expect(easy.size_download).to be_a(Float)
    end
  end

  describe "#speed_upload" do
    it "returns float" do
      expect(easy.speed_upload).to be_a(Float)
    end
  end

  describe "#speed_download" do
    it "returns float" do
      expect(easy.speed_download).to be_a(Float)
    end
  end
end
