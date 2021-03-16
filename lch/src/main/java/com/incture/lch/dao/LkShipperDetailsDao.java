package com.incture.lch.dao;

import org.springframework.stereotype.Repository;

import com.incture.lch.dto.LkShipperDetailsDto;
import com.incture.lch.entity.LkShipperDetails;

@Repository
public class LkShipperDetailsDao{

	public LkShipperDetails importShipperDetails(LkShipperDetailsDto dto) {
		LkShipperDetails shipDetDo = new LkShipperDetails();
		shipDetDo.setOnetimeLoc(true);
		shipDetDo.setShipperCity(dto.getShipperCity());
		shipDetDo.setShipperCountry(dto.getShipperCountry());
		shipDetDo.setShipperState(dto.getShipperState());
		shipDetDo.setShipperName(dto.getShipperName());
		shipDetDo.setShipperZip(dto.getShipperZip());
		shipDetDo.setShipperContact(dto.getShipperContact());
		shipDetDo.setBpNumber(dto.getBpNumber());
		shipDetDo.setOnetimeLocId(dto.getOnetimeLocId());
		return shipDetDo;

	}

	public LkShipperDetailsDto exportShipperDetails(LkShipperDetails shipDo) {
		LkShipperDetailsDto shipDetDto = new LkShipperDetailsDto();
		shipDetDto.setOnetimeLoc(true);
		shipDetDto.setShipperCity(shipDo.getShipperCity());
		shipDetDto.setShipperCountry(shipDo.getShipperCountry());
		shipDetDto.setShipperState(shipDo.getShipperState());
		shipDetDto.setShipperName(shipDo.getShipperName());
		shipDetDto.setShipperZip(shipDo.getShipperZip());
		shipDetDto.setShipperContact(shipDo.getShipperContact());
		shipDetDto.setBpNumber(shipDo.getBpNumber());
		shipDetDto.setOnetimeLocId(shipDo.getOnetimeLocId());
		return shipDetDto;

	}
}
