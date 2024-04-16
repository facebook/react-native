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

# Have to use RubyGems to load the idn gem.
require "rubygems"

require "addressable/idna"

shared_examples_for "converting from unicode to ASCII" do
  it "should convert 'www.google.com' correctly" do
    expect(Addressable::IDNA.to_ascii("www.google.com")).to eq("www.google.com")
  end

  long = 'AcinusFallumTrompetumNullunCreditumVisumEstAtCuadLongumEtCefallum.com'
  it "should convert '#{long}' correctly" do
    expect(Addressable::IDNA.to_ascii(long)).to eq(long)
  end

  it "should convert 'www.詹姆斯.com' correctly" do
    expect(Addressable::IDNA.to_ascii(
      "www.詹姆斯.com"
    )).to eq("www.xn--8ws00zhy3a.com")
  end

  it "also accepts unicode strings encoded as ascii-8bit" do
    expect(Addressable::IDNA.to_ascii(
      "www.詹姆斯.com".b
    )).to eq("www.xn--8ws00zhy3a.com")
  end

  it "should convert 'www.Iñtërnâtiônàlizætiøn.com' correctly" do
    "www.Iñtërnâtiônàlizætiøn.com"
    expect(Addressable::IDNA.to_ascii(
      "www.I\xC3\xB1t\xC3\xABrn\xC3\xA2ti\xC3\xB4" +
      "n\xC3\xA0liz\xC3\xA6ti\xC3\xB8n.com"
    )).to eq("www.xn--itrntinliztin-vdb0a5exd8ewcye.com")
  end

  it "should convert 'www.Iñtërnâtiônàlizætiøn.com' correctly" do
    expect(Addressable::IDNA.to_ascii(
      "www.In\xCC\x83te\xCC\x88rna\xCC\x82tio\xCC\x82n" +
      "a\xCC\x80liz\xC3\xA6ti\xC3\xB8n.com"
    )).to eq("www.xn--itrntinliztin-vdb0a5exd8ewcye.com")
  end

  it "should convert " +
      "'www.ほんとうにながいわけのわからないどめいんめいのらべるまだながくしないとたりない.w3.mag.keio.ac.jp' " +
      "correctly" do
    expect(Addressable::IDNA.to_ascii(
      "www.\343\201\273\343\202\223\343\201\250\343\201\206\343\201\253\343" +
      "\201\252\343\201\214\343\201\204\343\202\217\343\201\221\343\201\256" +
      "\343\202\217\343\201\213\343\202\211\343\201\252\343\201\204\343\201" +
      "\251\343\202\201\343\201\204\343\202\223\343\202\201\343\201\204\343" +
      "\201\256\343\202\211\343\201\271\343\202\213\343\201\276\343\201\240" +
      "\343\201\252\343\201\214\343\201\217\343\201\227\343\201\252\343\201" +
      "\204\343\201\250\343\201\237\343\202\212\343\201\252\343\201\204." +
      "w3.mag.keio.ac.jp"
    )).to eq(
      "www.xn--n8jaaaaai5bhf7as8fsfk3jnknefdde3" +
      "fg11amb5gzdb4wi9bya3kc6lra.w3.mag.keio.ac.jp"
    )
  end

  it "should convert " +
      "'www.ほんとうにながいわけのわからないどめいんめいのらべるまだながくしないとたりない.w3.mag.keio.ac.jp' " +
      "correctly" do
    expect(Addressable::IDNA.to_ascii(
      "www.\343\201\273\343\202\223\343\201\250\343\201\206\343\201\253\343" +
      "\201\252\343\201\213\343\202\231\343\201\204\343\202\217\343\201\221" +
      "\343\201\256\343\202\217\343\201\213\343\202\211\343\201\252\343\201" +
      "\204\343\201\250\343\202\231\343\202\201\343\201\204\343\202\223\343" +
      "\202\201\343\201\204\343\201\256\343\202\211\343\201\270\343\202\231" +
      "\343\202\213\343\201\276\343\201\237\343\202\231\343\201\252\343\201" +
      "\213\343\202\231\343\201\217\343\201\227\343\201\252\343\201\204\343" +
      "\201\250\343\201\237\343\202\212\343\201\252\343\201\204." +
      "w3.mag.keio.ac.jp"
    )).to eq(
      "www.xn--n8jaaaaai5bhf7as8fsfk3jnknefdde3" +
      "fg11amb5gzdb4wi9bya3kc6lra.w3.mag.keio.ac.jp"
    )
  end

  it "should convert '点心和烤鸭.w3.mag.keio.ac.jp' correctly" do
    expect(Addressable::IDNA.to_ascii(
      "点心和烤鸭.w3.mag.keio.ac.jp"
    )).to eq("xn--0trv4xfvn8el34t.w3.mag.keio.ac.jp")
  end

  it "should convert '가각갂갃간갅갆갇갈갉힢힣.com' correctly" do
    expect(Addressable::IDNA.to_ascii(
      "가각갂갃간갅갆갇갈갉힢힣.com"
    )).to eq("xn--o39acdefghijk5883jma.com")
  end

  it "should convert " +
      "'\347\242\274\346\250\231\346\272\226\350" +
      "\220\254\345\234\213\347\242\274.com' correctly" do
    expect(Addressable::IDNA.to_ascii(
      "\347\242\274\346\250\231\346\272\226\350" +
      "\220\254\345\234\213\347\242\274.com"
    )).to eq("xn--9cs565brid46mda086o.com")
  end

  it "should convert 'ﾘ宠퐱〹.com' correctly" do
    expect(Addressable::IDNA.to_ascii(
      "\357\276\230\345\256\240\355\220\261\343\200\271.com"
    )).to eq("xn--eek174hoxfpr4k.com")
  end

  it "should convert 'リ宠퐱卄.com' correctly" do
    expect(Addressable::IDNA.to_ascii(
      "\343\203\252\345\256\240\355\220\261\345\215\204.com"
    )).to eq("xn--eek174hoxfpr4k.com")
  end

  it "should convert 'ᆵ' correctly" do
    expect(Addressable::IDNA.to_ascii(
      "\341\206\265"
    )).to eq("xn--4ud")
  end

  it "should convert 'ﾯ' correctly" do
    expect(Addressable::IDNA.to_ascii(
      "\357\276\257"
    )).to eq("xn--4ud")
  end

  it "should convert '🌹🌹🌹.ws' correctly" do
    expect(Addressable::IDNA.to_ascii(
      "\360\237\214\271\360\237\214\271\360\237\214\271.ws"
    )).to eq("xn--2h8haa.ws")
  end

  it "should handle two adjacent '.'s correctly" do
    expect(Addressable::IDNA.to_ascii(
      "example..host"
    )).to eq("example..host")
  end
end

shared_examples_for "converting from ASCII to unicode" do
  long = 'AcinusFallumTrompetumNullunCreditumVisumEstAtCuadLongumEtCefallum.com'
  it "should convert '#{long}' correctly" do
    expect(Addressable::IDNA.to_unicode(long)).to eq(long)
  end

  it "should return the identity conversion when punycode decode fails" do
    expect(Addressable::IDNA.to_unicode("xn--zckp1cyg1.sblo.jp")).to eq(
      "xn--zckp1cyg1.sblo.jp")
  end

  it "should return the identity conversion when the ACE prefix has no suffix" do
    expect(Addressable::IDNA.to_unicode("xn--...-")).to eq("xn--...-")
  end

  it "should convert 'www.google.com' correctly" do
    expect(Addressable::IDNA.to_unicode("www.google.com")).to eq(
      "www.google.com")
  end

  it "should convert 'www.詹姆斯.com' correctly" do
    expect(Addressable::IDNA.to_unicode(
      "www.xn--8ws00zhy3a.com"
    )).to eq("www.詹姆斯.com")
  end

  it "should convert '詹姆斯.com' correctly" do
    expect(Addressable::IDNA.to_unicode(
      "xn--8ws00zhy3a.com"
    )).to eq("詹姆斯.com")
  end

  it "should convert 'www.iñtërnâtiônàlizætiøn.com' correctly" do
    expect(Addressable::IDNA.to_unicode(
      "www.xn--itrntinliztin-vdb0a5exd8ewcye.com"
    )).to eq("www.iñtërnâtiônàlizætiøn.com")
  end

  it "should convert 'iñtërnâtiônàlizætiøn.com' correctly" do
    expect(Addressable::IDNA.to_unicode(
      "xn--itrntinliztin-vdb0a5exd8ewcye.com"
    )).to eq("iñtërnâtiônàlizætiøn.com")
  end

  it "should convert " +
      "'www.ほんとうにながいわけのわからないどめいんめいのらべるまだながくしないとたりない.w3.mag.keio.ac.jp' " +
      "correctly" do
    expect(Addressable::IDNA.to_unicode(
      "www.xn--n8jaaaaai5bhf7as8fsfk3jnknefdde3" +
      "fg11amb5gzdb4wi9bya3kc6lra.w3.mag.keio.ac.jp"
    )).to eq(
      "www.ほんとうにながいわけのわからないどめいんめいのらべるまだながくしないとたりない.w3.mag.keio.ac.jp"
    )
  end

  it "should convert '点心和烤鸭.w3.mag.keio.ac.jp' correctly" do
    expect(Addressable::IDNA.to_unicode(
      "xn--0trv4xfvn8el34t.w3.mag.keio.ac.jp"
    )).to eq("点心和烤鸭.w3.mag.keio.ac.jp")
  end

  it "should convert '가각갂갃간갅갆갇갈갉힢힣.com' correctly" do
    expect(Addressable::IDNA.to_unicode(
      "xn--o39acdefghijk5883jma.com"
    )).to eq("가각갂갃간갅갆갇갈갉힢힣.com")
  end

  it "should convert " +
      "'\347\242\274\346\250\231\346\272\226\350" +
      "\220\254\345\234\213\347\242\274.com' correctly" do
    expect(Addressable::IDNA.to_unicode(
      "xn--9cs565brid46mda086o.com"
    )).to eq(
      "\347\242\274\346\250\231\346\272\226\350" +
      "\220\254\345\234\213\347\242\274.com"
    )
  end

  it "should convert 'リ宠퐱卄.com' correctly" do
    expect(Addressable::IDNA.to_unicode(
      "xn--eek174hoxfpr4k.com"
    )).to eq("\343\203\252\345\256\240\355\220\261\345\215\204.com")
  end

  it "should convert 'ﾯ' correctly" do
    expect(Addressable::IDNA.to_unicode(
      "xn--4ud"
    )).to eq("\341\206\265")
  end

  it "should convert '🌹🌹🌹.ws' correctly" do
    expect(Addressable::IDNA.to_unicode(
      "xn--2h8haa.ws"
    )).to eq("\360\237\214\271\360\237\214\271\360\237\214\271.ws")
  end

  it "should handle two adjacent '.'s correctly" do
    expect(Addressable::IDNA.to_unicode(
      "example..host"
    )).to eq("example..host")
  end
end

describe Addressable::IDNA, "when using the pure-Ruby implementation" do
  before do
    Addressable.send(:remove_const, :IDNA)
    load "addressable/idna/pure.rb"
  end

  it_should_behave_like "converting from unicode to ASCII"
  it_should_behave_like "converting from ASCII to unicode"

  begin
    require "fiber"

    it "should not blow up inside fibers" do
      f = Fiber.new do
        Addressable.send(:remove_const, :IDNA)
        load "addressable/idna/pure.rb"
      end
      f.resume
    end
  rescue LoadError
    # Fibers aren't supported in this version of Ruby, skip this test.
    warn('Fibers unsupported.')
  end
end

begin
  require "idn"

  describe Addressable::IDNA, "when using the native-code implementation" do
    before do
      Addressable.send(:remove_const, :IDNA)
      load "addressable/idna/native.rb"
    end

    it_should_behave_like "converting from unicode to ASCII"
    it_should_behave_like "converting from ASCII to unicode"
  end
rescue LoadError => error
  raise error if ENV["CI"] && TestHelper.native_supported?

  # Cannot test the native implementation without libidn support.
  warn('Could not load native IDN implementation.')
end
