package com.contractorcontrol.api.entity;

import com.contractorcontrol.api.util.InstantLongConverter;
import java.time.Instant;
import javax.persistence.Column;
import javax.persistence.Convert;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

@Entity
@Table(name = "vendor_reviews", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"vendor_id", "project_id"})
})
public class VendorReviewEntity {

  @Id
  private String id;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "vendor_id", nullable = false)
  private VendorEntity vendor;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "project_id", nullable = false)
  private ProjectEntity project;

  @Column(nullable = false)
  private Integer score;

  @Column(name = "review_content")
  private String reviewContent;

  @Column(name = "issue_description")
  private String issueDescription;

  @Column(name = "recommend_continue", nullable = false)
  private String recommendContinue;

  @Column(name = "reviewed_by", nullable = false)
  private String reviewedBy;

  @Convert(converter = InstantLongConverter.class)
  @Column(name = "reviewed_at", nullable = false)
  private Instant reviewedAt;

  @Convert(converter = InstantLongConverter.class)
  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public VendorEntity getVendor() {
    return vendor;
  }

  public void setVendor(VendorEntity vendor) {
    this.vendor = vendor;
  }

  public ProjectEntity getProject() {
    return project;
  }

  public void setProject(ProjectEntity project) {
    this.project = project;
  }

  public Integer getScore() {
    return score;
  }

  public void setScore(Integer score) {
    this.score = score;
  }

  public String getReviewContent() {
    return reviewContent;
  }

  public void setReviewContent(String reviewContent) {
    this.reviewContent = reviewContent;
  }

  public String getIssueDescription() {
    return issueDescription;
  }

  public void setIssueDescription(String issueDescription) {
    this.issueDescription = issueDescription;
  }

  public String getRecommendContinue() {
    return recommendContinue;
  }

  public void setRecommendContinue(String recommendContinue) {
    this.recommendContinue = recommendContinue;
  }

  public String getReviewedBy() {
    return reviewedBy;
  }

  public void setReviewedBy(String reviewedBy) {
    this.reviewedBy = reviewedBy;
  }

  public Instant getReviewedAt() {
    return reviewedAt;
  }

  public void setReviewedAt(Instant reviewedAt) {
    this.reviewedAt = reviewedAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
