package com.incture.lch.adhoc.service;

import java.util.List;

import com.incture.lch.adhoc.dto.CarrierDetailsDto;
import com.incture.lch.adhoc.dto.ChargeRequestDto;
import com.incture.lch.adhoc.dto.PremiumFreightOrderDto;
import com.incture.lch.adhoc.dto.PremiumRequestDto;
import com.incture.lch.adhoc.entity.PremiumFreightChargeDetails;

public interface PremiumFreightOrdersService 
{
	public List<PremiumFreightOrderDto> getAllPremiumFreightOrders(PremiumRequestDto premiumRequestDto);

	public List<CarrierDetailsDto> getAllCarrierDetails();
	
	public List<String> getMode(String bpNumber);

	public List<PremiumFreightOrderDto> getChargeByCarrierAdmin(List<String> adhocOrderIds);
	
	public String setCharge(ChargeRequestDto dto);

	public String forwardToApprover(List<PremiumFreightChargeDetails> premiumFreightChargeDetail);
	
	public String RejectPremiumOrder (String adhocOrderId);


}
