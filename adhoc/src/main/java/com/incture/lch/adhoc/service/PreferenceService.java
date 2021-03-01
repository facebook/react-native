package com.incture.lch.adhoc.service;

import java.util.List;

import com.incture.lch.adhoc.dto.PreferenceDto;


public interface PreferenceService
{
	public List<PreferenceDto> getPreference(String userId);
 

   public String setPreference(List<PreferenceDto> preferenceDto,String userId) ;

}
