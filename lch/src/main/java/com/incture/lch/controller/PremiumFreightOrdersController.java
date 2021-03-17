package com.incture.lch.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.json.simple.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.incture.lch.dao.PremiumFreightApprovalRuleDao;
import com.incture.lch.dto.CarrierDetailsDto;
import com.incture.lch.dto.ChargeRequestDto;
import com.incture.lch.dto.PremiumFreightApprovalRuleDTO;
import com.incture.lch.dto.PremiumFreightOrderDto;
import com.incture.lch.dto.PremiumRequestDto;
import com.incture.lch.entity.PremiumFreightChargeDetails;
import com.incture.lch.service.PremiumFreightOrdersService;

@RestController
@CrossOrigin
@RequestMapping(value = "/premiumOrders", produces = "application/json")
public class PremiumFreightOrdersController 
{
	@Autowired
	private PremiumFreightOrdersService premiumFreightOrdersService;
	
	@Autowired
	private PremiumFreightApprovalRuleDao premiumFreightApprovalRuleDao;
	
	@RequestMapping(value = "/getAllPremiumOrders", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public List<PremiumFreightOrderDto> getAllPremiumFreightOrders(@RequestBody PremiumRequestDto premiumRequestDto) {
		return premiumFreightOrdersService.getAllPremiumFreightOrders(premiumRequestDto);
	}

	@RequestMapping(value = "/getAllCarrierDetails", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public List<CarrierDetailsDto> getAllCarrierDetails() {
		return premiumFreightOrdersService.getAllCarrierDetails();
	}

	
	/*public List<String> getModes(@RequestBody JSONObject bpNumber) 
	{
		String bpNo = (String) bpNumber.get("bpNumber");
		System.out.println(bpNo);
		return premiumFreightOrdersService.getMode(bpNo);
	}*/
	@RequestMapping(value = "/getMode", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public List<HashMap<String,String>>getMode(@RequestBody  JSONObject bpNumber)
	{
		//int i=0;
		String bpNo = (String) bpNumber.get("bpNumber");
		List<String> mode = premiumFreightOrdersService.getMode(bpNo);
	
	
		List<HashMap<String,String>> listMode= new ArrayList<HashMap<String,String>>();
		//modes.put("mode", mode);
		for(String s:mode)
		{
			HashMap<String,String> modes= new HashMap<String,String>();
			
			modes.put("mode",s);
			
			listMode.add(modes);
		}
		return listMode;
	}

	

	@RequestMapping(value = "/setCarrierDetails", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public List<PremiumFreightOrderDto> setCarrierDetails(@RequestBody List<ChargeRequestDto> chargeRequestDto) {
		/*@SuppressWarnings("unchecked")
		List<String> adhocOrderIds = (List<String>) orderIdList.get("adhocOrderIds");*/
		return premiumFreightOrdersService.setCarrierDetails(chargeRequestDto);
	}
	@RequestMapping(value = "/setCharge", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public String setCharge(@RequestBody ChargeRequestDto dto) {
		return premiumFreightOrdersService.setCharge(dto);
	}

	
	@RequestMapping(value = "/forwardToApprover", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public String forwardToApprover(@RequestBody List<PremiumRequestDto> premiumRequestDtos) {
		return premiumFreightOrdersService.forwardToApprover(premiumRequestDtos);
	}

	
	@RequestMapping(value = "/rejectPremiumOrder", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public String RejectPremiumOrder(@RequestBody JSONObject  adhocOrderId) {
		String adid= (String) adhocOrderId.get("adhocOrderId");
		return premiumFreightOrdersService.RejectPremiumOrder(adid);
	}

	@RequestMapping(value = "/getAllPremiumApprovalList", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public List<PremiumFreightApprovalRuleDTO> getAllPremiumApprovalList() 
	{
	return premiumFreightApprovalRuleDao.getAllPremiumApprovalList();
	}
	
	@RequestMapping(value = "/saveApproval", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody	
	public Boolean saveApproval(List<PremiumFreightApprovalRuleDTO> ruleList) 
	{
		return premiumFreightApprovalRuleDao.saveApproval(ruleList);
	}

	@RequestMapping(value="/addCarrier", method = RequestMethod.POST)
	public String addCarrier(CarrierDetailsDto carrierdto)
	{
		return premiumFreightOrdersService.addCarrier(carrierdto);
	}

}
