package com.contractorcontrol.api.controller;

import com.contractorcontrol.api.entity.ProjectEntity;
import com.contractorcontrol.api.entity.VendorEntity;
import com.contractorcontrol.api.entity.VendorReviewEntity;
import com.contractorcontrol.api.repository.ProjectRepository;
import com.contractorcontrol.api.repository.VendorRepository;
import com.contractorcontrol.api.repository.VendorReviewRepository;
import com.contractorcontrol.api.security.CurrentUser;
import com.contractorcontrol.api.util.ApiConstants;
import com.contractorcontrol.api.util.ApiSerializers;
import com.contractorcontrol.api.util.ValidationUtils;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vendor-reviews")
public class VendorReviewController {

  private final VendorReviewRepository vendorReviewRepository;
  private final VendorRepository vendorRepository;
  private final ProjectRepository projectRepository;

  public VendorReviewController(
      VendorReviewRepository vendorReviewRepository,
      VendorRepository vendorRepository,
      ProjectRepository projectRepository) {
    this.vendorReviewRepository = vendorReviewRepository;
    this.vendorRepository = vendorRepository;
    this.projectRepository = projectRepository;
  }

  @GetMapping
  public List<Map<String, Object>> list(
      @RequestParam(required = false) String vendorId,
      @RequestParam(required = false) String projectId,
      @RequestParam(required = false) String recommendContinue) {
    Specification<VendorReviewEntity> specification = Specification.where(null);
    if (vendorId != null && !vendorId.isEmpty()) {
      specification = specification.and((root, query, cb) -> cb.equal(root.get("vendor").get("id"), vendorId));
    }
    if (projectId != null && !projectId.isEmpty()) {
      specification = specification.and((root, query, cb) -> cb.equal(root.get("project").get("id"), projectId));
    }
    if (recommendContinue != null && !recommendContinue.isEmpty()) {
      specification = specification.and((root, query, cb) -> cb.equal(root.get("recommendContinue"), recommendContinue));
    }
    return vendorReviewRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "createdAt"))
        .stream()
        .map(ApiSerializers::serializeVendorReview)
        .collect(Collectors.toList());
  }

  @GetMapping("/{id}")
  public Map<String, Object> detail(@PathVariable String id) {
    VendorReviewEntity review = vendorReviewRepository.findById(id)
        .orElseThrow(() -> new NoSuchElementException("评价记录不存在"));
    return ApiSerializers.serializeVendorReview(review);
  }

  @GetMapping("/stats/by-vendor/{vendorId}")
  public Map<String, Object> statsByVendor(@PathVariable String vendorId) {
    if (!vendorRepository.existsById(vendorId)) {
      throw new NoSuchElementException("服务商不存在");
    }
    Double avgScore = vendorReviewRepository.findAverageScoreByVendorId(vendorId);
    Long reviewCount = vendorReviewRepository.countByVendorId(vendorId);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("vendorId", vendorId);
    result.put("averageScore", avgScore == null ? null : Math.round(avgScore * 100.0) / 100.0);
    result.put("reviewCount", reviewCount == null ? 0 : reviewCount);
    return result;
  }

  @GetMapping("/stats/all")
  public List<Map<String, Object>> statsAll() {
    List<Object[]> rows = vendorReviewRepository.findAverageScoresGroupedByVendor();
    List<Map<String, Object>> result = new ArrayList<>();
    for (Object[] row : rows) {
      Map<String, Object> item = new LinkedHashMap<>();
      item.put("vendorId", row[0]);
      Double avg = (Double) row[1];
      item.put("averageScore", avg == null ? null : Math.round(avg * 100.0) / 100.0);
      item.put("reviewCount", row[2]);
      result.add(item);
    }
    return result;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> create(@RequestBody(required = false) Map<String, Object> body, Authentication authentication) {
    Map<String, Object> payload = body == null ? new HashMap<>() : body;
    return ApiSerializers.serializeVendorReview(saveReview(new VendorReviewEntity(), payload, true, authentication));
  }

  @PutMapping("/{id}")
  public Map<String, Object> update(@PathVariable String id, @RequestBody(required = false) Map<String, Object> body, Authentication authentication) {
    VendorReviewEntity review = vendorReviewRepository.findById(id)
        .orElseThrow(() -> new NoSuchElementException("评价记录不存在"));
    Map<String, Object> payload = body == null ? new HashMap<>() : body;
    return ApiSerializers.serializeVendorReview(saveReview(review, payload, false, authentication));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id) {
    if (!vendorReviewRepository.existsById(id)) {
      throw new NoSuchElementException("评价记录不存在");
    }
    vendorReviewRepository.deleteById(id);
  }

  private VendorReviewEntity saveReview(
      VendorReviewEntity review,
      Map<String, Object> payload,
      boolean create,
      Authentication authentication) {
    if (create) {
      review.setId(UUID.randomUUID().toString().replace("-", ""));
      review.setCreatedAt(Instant.now());
    }

    String vendorId = ValidationUtils.assertString(payload.get("vendorId"), "vendorId");
    String projectId = ValidationUtils.assertString(payload.get("projectId"), "projectId");

    VendorEntity vendor = vendorRepository.findById(vendorId)
        .orElseThrow(() -> new IllegalArgumentException("服务商不存在"));
    ProjectEntity project = projectRepository.findById(projectId)
        .orElseThrow(() -> new IllegalArgumentException("项目不存在"));

    review.setVendor(vendor);
    review.setProject(project);
    review.setScore(ValidationUtils.assertScore(payload.get("score"), "score"));
    review.setReviewContent(ValidationUtils.assertOptionalString(payload.get("reviewContent")));
    review.setIssueDescription(ValidationUtils.assertOptionalString(payload.get("issueDescription")));
    review.setRecommendContinue(
        ValidationUtils.assertEnum(payload.get("recommendContinue"), ApiConstants.RECOMMEND_CONTINUE_OPTIONS, "recommendContinue"));

    CurrentUser currentUser = (CurrentUser) authentication.getPrincipal();
    review.setReviewedBy(currentUser.getUser().getName());
    review.setReviewedAt(Instant.now());

    try {
      return vendorReviewRepository.save(review);
    } catch (DataIntegrityViolationException ex) {
      throw new IllegalArgumentException("该服务商在该项目下已有评价记录");
    }
  }
}
