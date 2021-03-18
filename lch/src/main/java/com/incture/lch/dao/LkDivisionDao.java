package com.incture.lch.dao;

import org.springframework.stereotype.Repository;

import com.incture.lch.dto.LkDivisionsDto;
import com.incture.lch.entity.LkDivisions;

@Repository
public class LkDivisionDao {


	public LkDivisions importDivisions(LkDivisionsDto dto) {
		LkDivisions lkDivDo = new LkDivisions();
		lkDivDo.setDivisionName(dto.getDivisionName());
		lkDivDo.setDunsNumber(dto.getDunsNumber());
		return lkDivDo;

	}

	public LkDivisionsDto exportDivisions(LkDivisions lkDivdo) {
		LkDivisionsDto lkDivDto = new LkDivisionsDto();
		lkDivDto.setDivisionName(lkDivdo.getDivisionName());
		lkDivDto.setDunsNumber(lkDivdo.getDunsNumber());
		return lkDivDto;

	}

}
