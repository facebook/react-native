package com.incture.lch.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONException;
import org.json.simple.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.incture.lch.dto.PreferenceDto;
import com.incture.lch.dto.PreferenceResponseDto;
import com.incture.lch.service.PreferenceService;

@RestController
@RequestMapping(value = "/preference", produces = "application/json")

public class PreferenceController {
	@Autowired
	private PreferenceService preferenceService;

	// @GetMapping("/getPreference")
	@RequestMapping(value = "/getPreference", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public List<PreferenceDto> getPreference(@RequestBody JSONObject user) throws JSONException {

		System.out.println(user);
		String u = (String) user.get("userId");
		return preferenceService.getPreference(u);

	}
	  
	@RequestMapping(value = "/setPreference", method = RequestMethod.POST, consumes = { "application/json" })
	public String setPreference(@RequestBody PreferenceResponseDto preferenceResponseDto) {

		List<PreferenceDto> preferenceDto = new ArrayList<>();
		
		preferenceDto = preferenceResponseDto.getPreferenceDTOs();
		String userId = preferenceResponseDto.getUserId();
		System.out.println(preferenceDto.toString());
		System.out.println(userId);
		return preferenceService.setPreference(preferenceResponseDto.getPreferenceDTOs(), userId);
	}
	
}
