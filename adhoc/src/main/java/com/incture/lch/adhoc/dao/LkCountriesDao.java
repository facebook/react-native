package com.incture.lch.adhoc.dao;

import org.springframework.stereotype.Repository;

import com.incture.lch.adhoc.dto.LkCountriesDto;
import com.incture.lch.adhoc.entity.LkCountries;

@Repository
public class LkCountriesDao {

	public LkCountries importCountries(LkCountriesDto dto) {
		LkCountries lkCouDo = new LkCountries();
		lkCouDo.setCountryId(dto.getCountryId());
		lkCouDo.setCountryName(dto.getCountryName());
		return lkCouDo;

	}

	public LkCountriesDto exportCountries(LkCountries lkCoudo) {
		LkCountriesDto lkCouDto = new LkCountriesDto();
		lkCouDto.setCountryId(lkCoudo.getCountryId());
		lkCouDto.setCountryName(lkCoudo.getCountryName());
		return lkCouDto;

	}

}
