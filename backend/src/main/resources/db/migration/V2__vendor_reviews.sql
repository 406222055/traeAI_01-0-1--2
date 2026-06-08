create table if not exists vendor_reviews (
  id varchar(64) primary key,
  vendor_id varchar(64) not null,
  project_id varchar(64) not null,
  score integer not null,
  review_content varchar(1000),
  issue_description varchar(1000),
  recommend_continue varchar(50) not null,
  reviewed_by varchar(100) not null,
  reviewed_at bigint not null,
  created_at bigint not null,
  constraint fk_vendor_reviews_vendor foreign key (vendor_id) references vendors(id),
  constraint fk_vendor_reviews_project foreign key (project_id) references projects(id),
  constraint uk_vendor_reviews_vendor_project unique (vendor_id, project_id)
);

create index if not exists idx_vendor_reviews_vendor_id on vendor_reviews(vendor_id);
create index if not exists idx_vendor_reviews_project_id on vendor_reviews(project_id);
create index if not exists idx_vendor_reviews_created_at on vendor_reviews(created_at);
