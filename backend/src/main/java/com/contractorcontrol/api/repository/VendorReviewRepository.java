package com.contractorcontrol.api.repository;

import com.contractorcontrol.api.entity.VendorReviewEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VendorReviewRepository extends JpaRepository<VendorReviewEntity, String>, JpaSpecificationExecutor<VendorReviewEntity> {

  List<VendorReviewEntity> findByVendorId(String vendorId);

  List<VendorReviewEntity> findByProjectId(String projectId);

  Optional<VendorReviewEntity> findByVendorIdAndProjectId(String vendorId, String projectId);

  @Query("SELECT AVG(r.score) FROM VendorReviewEntity r WHERE r.vendor.id = :vendorId")
  Double findAverageScoreByVendorId(@Param("vendorId") String vendorId);

  @Query("SELECT COUNT(r) FROM VendorReviewEntity r WHERE r.vendor.id = :vendorId")
  Long countByVendorId(@Param("vendorId") String vendorId);

  @Query("SELECT r.vendor.id as vendorId, AVG(r.score) as avgScore, COUNT(r) as reviewCount "
      + "FROM VendorReviewEntity r GROUP BY r.vendor.id")
  List<Object[]> findAverageScoresGroupedByVendor();
}
