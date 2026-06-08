package com.contractorcontrol.api.controller;

import com.contractorcontrol.api.repository.ComplianceItemRepository;
import com.contractorcontrol.api.util.ApiSerializers;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

  private final ComplianceItemRepository complianceItemRepository;

  public AlertController(ComplianceItemRepository complianceItemRepository) {
    this.complianceItemRepository = complianceItemRepository;
  }

  @GetMapping("/expiring")
  public Map<String, Object> expiring() {
    Instant now = Instant.now();
    Instant within7 = now.plus(7, ChronoUnit.DAYS);
    Instant within30 = now.plus(30, ChronoUnit.DAYS);
    Sort sort = Sort.by(Sort.Direction.ASC, "expiryDate");
    Map<String, Object> data = new LinkedHashMap<String, Object>();
    data.put("within7Days", complianceItemRepository.findByExpiryDateBetween(now, within7, sort).stream().map(ApiSerializers::serializeComplianceItem).collect(Collectors.toList()));
    data.put("within30Days", complianceItemRepository.findByExpiryDateBetween(now, within30, sort).stream().map(ApiSerializers::serializeComplianceItem).collect(Collectors.toList()));
    return data;
  }
}
