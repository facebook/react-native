package com.incture.lch.dto;

import java.util.List;

public class PreferenceResponseDto
{
	private String userId;
	
	private List<PreferenceDto> preferenceDTOs;

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public List<PreferenceDto> getPreferenceDTOs() {
		return preferenceDTOs;
	}

	public void setPreferenceDTOs(List<PreferenceDto> preferenceDTOs) {
		this.preferenceDTOs = preferenceDTOs;
	}
	
	

}
