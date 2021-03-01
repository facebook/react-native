package com.incture.lch.adhoc.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.incture.lch.adhoc.dto.PreferenceDto;
import com.incture.lch.adhoc.service.PreferenceService;

@RestController
@RequestMapping(value = "/preference", produces = "application/json")

public class PreferenceController {
	@Autowired
	private PreferenceService preferenceService;

	@GetMapping("/getPreference")
	public List<PreferenceDto> getPreference( @RequestParam String userId) 
	{	

		return preferenceService.getPreference(userId);

	}

	/*
	 * public List<PreferenceDto> getPreference(@RequestBody JSONObject userId)
	 * { //System.out.println(userId.toString());
	 * 
	 * //System.out.println(user.get("userId"));
	 * 
	 * String user=(String) userId.get("userId");
	 * 
	 * return preferenceService.getPreference(user);
	 * 
	 * }
	 */
	@PostMapping("/setPreference")

	public String setPreference(@RequestBody List<PreferenceDto> preferenceDto, @RequestParam String userId) {

		return preferenceService.setPreference(preferenceDto, userId);
	}
}
