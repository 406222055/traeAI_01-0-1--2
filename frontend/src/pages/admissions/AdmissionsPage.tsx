import { useEffect, useState } from 'react';
import { Button, Card, Drawer, Form, Input, Modal, Rate, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { Admission, Project, Vendor, VendorReviewStats } from '../../shared';
import { createAdmission, fetchAdmissions, reviewAdmission } from '../../services/admissions';
import { fetchProjects } from '../../services/projects';
import { fetchVendors } from '../../services/vendors';
import { fetchAllVendorReviewStats } from '../../services/vendorReviews';

export function AdmissionsPage() {
  const [items, setItems] = useState<Admission[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statsMap, setStatsMap] = useState<Map<string, VendorReviewStats>>(new Map());
  const [open, setOpen] = useState(false);
  const [reviewing, setReviewing] = useState<Admission | null>(null);
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const load = async () => {
    try {
      const [admissions, vendorList, projectList, allStats] = await Promise.all([
        fetchAdmissions(),
        fetchVendors(),
        fetchProjects(),
        fetchAllVendorReviewStats(),
      ]);
      setItems(admissions);
      setVendors(vendorList);
      setProjects(projectList);
      const map = new Map<string, VendorReviewStats>();
      for (const stat of allStats) {
        map.set(stat.vendorId, stat);
      }
      setStatsMap(map);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载准入申请失败');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const vendorOptions = vendors.map((item) => {
    const stat = statsMap.get(item.id);
    let label = item.name;
    if (stat?.averageScore != null) {
      label += ` (平均分: ${stat.averageScore.toFixed(2)} / ${stat.reviewCount}条评价)`;
    } else {
      label += ' (暂无评价)';
    }
    return { label, value: item.id };
  });

  const getScoreTag = (vendorId: string) => {
    const stat = statsMap.get(vendorId);
    if (!stat || stat.averageScore == null) {
      return <Tag color="default">暂无评价</Tag>;
    }
    const color = stat.averageScore >= 4 ? 'green' : stat.averageScore >= 3 ? 'blue' : 'orange';
    return (
      <Space>
        <Rate disabled value={Math.round(stat.averageScore)} />
        <Tag color={color}>
          {stat.averageScore.toFixed(2)} ({stat.reviewCount}条)
        </Tag>
      </Space>
    );
  };

  return (
    <Card
      title="准入申请与审核"
      extra={
        <Button
          type="primary"
          onClick={() => {
            form.resetFields();
            setOpen(true);
          }}
        >
          发起准入申请
        </Button>
      }
    >
      <Table
        rowKey="id"
        dataSource={items}
        columns={[
          { title: '服务商', dataIndex: ['vendor', 'name'] },
          { title: '服务商评价', dataIndex: ['vendor', 'id'], render: (id: string) => getScoreTag(id) },
          { title: '项目', dataIndex: ['project', 'name'] },
          { title: '申请日期', dataIndex: 'applyDate' },
          { title: '计划进场日期', dataIndex: 'plannedEntryDate' },
          { title: '工作范围', dataIndex: 'scopeOfWork' },
          { title: '状态', dataIndex: 'status', render: (value: string) => <Tag color={value === 'approved' ? 'green' : value === 'rejected' ? 'red' : 'gold'}>{value}</Tag> },
          { title: '审核意见', dataIndex: 'reviewComment', render: (value: string | null) => value || '-' },
          {
            title: '操作',
            render: (_, record) => (
              <Space>
                <Button
                  disabled={record.status !== 'pending'}
                  onClick={() => {
                    setReviewing(record);
                    reviewForm.resetFields();
                  }}
                >
                  审核
                </Button>
              </Space>
            ),
          },
        ]}
      />
      <Drawer title="发起准入申请" open={open} onClose={() => setOpen(false)} width={520}>
        <Typography.Paragraph type="secondary">请选择服务商和项目，系统将自动展示服务商的历史评价供您参考。</Typography.Paragraph>
        <Form
          layout="vertical"
          form={form}
          onFinish={async (values) => {
            try {
              await createAdmission(values);
              message.success('准入申请已创建');
              setOpen(false);
              form.resetFields();
              await load();
            } catch (error) {
              message.error(error instanceof Error ? error.message : '创建准入申请失败');
            }
          }}
        >
          <Form.Item label="服务商" name="vendorId" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={vendorOptions} />
          </Form.Item>
          <Form.Item label="项目" name="projectId" rules={[{ required: true }]}>
            <Select options={projects.map((item) => ({ label: item.name, value: item.id }))} />
          </Form.Item>
          <Form.Item label="申请日期" name="applyDate" rules={[{ required: true }]}><Input placeholder="2026-06-06" /></Form.Item>
          <Form.Item label="计划进场日期" name="plannedEntryDate" rules={[{ required: true }]}><Input placeholder="2026-06-10" /></Form.Item>
          <Form.Item label="工作范围" name="scopeOfWork" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
          <Button type="primary" htmlType="submit" block>提交申请</Button>
        </Form>
      </Drawer>
      <Modal
        title="审核准入申请"
        open={Boolean(reviewing)}
        onCancel={() => setReviewing(null)}
        footer={null}
        width={560}
      >
        {reviewing && (
          <div style={{ marginBottom: 16 }}>
            <Card size="small" title="参考信息" type="inner">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><strong>服务商：</strong>{reviewing.vendor?.name}</div>
                <div><strong>历史评价：</strong>{getScoreTag(reviewing.vendorId)}</div>
                <div><strong>项目：</strong>{reviewing.project?.name}</div>
                <div><strong>工作范围：</strong>{reviewing.scopeOfWork}</div>
              </Space>
            </Card>
          </div>
        )}
        <Form
          layout="vertical"
          form={reviewForm}
          onFinish={async (values) => {
            if (!reviewing) {
              return;
            }

            try {
              await reviewAdmission(reviewing.id, values);
              message.success('审核完成');
              setReviewing(null);
              reviewForm.resetFields();
              await load();
            } catch (error) {
              message.error(error instanceof Error ? error.message : '审核失败');
            }
          }}
        >
          <Form.Item label="审核结果" name="status" rules={[{ required: true }]}>
            <Select options={[{ label: 'approved', value: 'approved' }, { label: 'rejected', value: 'rejected' }]} />
          </Form.Item>
          <Form.Item label="审核意见" name="reviewComment"><Input.TextArea rows={4} /></Form.Item>
          <Button type="primary" htmlType="submit" block>提交审核</Button>
        </Form>
      </Modal>
    </Card>
  );
}
