package com.incture.lch.repository;

import java.util.List;

import com.incture.lch.dto.CarrierDetailsDto;
import com.incture.lch.dto.ChargeRequestDto;
import com.incture.lch.dto.PremiumFreightOrderDto;
import com.incture.lch.dto.PremiumRequestDto;
import com.incture.lch.entity.AdhocOrders;
import com.incture.lch.entity.PremiumFreightChargeDetails;

public interface PremiumFreightOrdersRepository 
{

	public PremiumFreightOrderDto exportPremiumFreightOrders(AdhocOrders adhocOrders);
		
	public List<PremiumFreightOrderDto> getAllPremiumFreightOrders(PremiumRequestDto premiumRequestDto);

	public List<CarrierDetailsDto> getAllCarrierDetails();
	
	public List<String> getMode(String bpNumber);

	public List<PremiumFreightOrderDto> setCarrierDetails(List<ChargeRequestDto> chargeRequestDto);
	
	public String setCharge(ChargeRequestDto dto);

	public String forwardToApprover(List<PremiumRequestDto> premiumRequestDtos);
	
	public String RejectPremiumOrder (String adhocOrderId);
	public String addCarrier(CarrierDetailsDto carrierdto);

}
