package com.incture.lch.service;

import java.util.List;

import com.incture.lch.dto.PreferenceDto;


public interface PreferenceService
{
	public List<PreferenceDto> getPreference(String userId);
 

   public String setPreference(List<PreferenceDto> preferenceDto,String userId) ;

}
