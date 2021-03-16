package com.incture.lch.controller;

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

	@RequestMapping(value = "/getMode", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public List<String> getMode(@RequestBody JSONObject bpNumber) 
	{
		String bpNo = (String) bpNumber.get("bpNumber");
		System.out.println(bpNo);
		return premiumFreightOrdersService.getMode(bpNo);
	}

	/*@RequestMapping(value = "/getChargeByCarrierAdmin", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public List<PremiumFreightOrderDto> getChargeByCarrierAdmin(@RequestBody JSONObject orderIdList) {
		@SuppressWarnings("unchecked")
		List<String> adhocOrderIds = (List<String>) orderIdList.get("adhocOrderIds");
		return premiumFreightOrdersService.getChargeByCarrierAdmin(adhocOrderIds);
	}*/
	

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
	public String forwardToApprover(@RequestBody List<PremiumFreightChargeDetails> premiumFreightChargeDetail) {
		return premiumFreightOrdersService.forwardToApprover(premiumFreightChargeDetail);
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


}
