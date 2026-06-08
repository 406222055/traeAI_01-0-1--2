import { useEffect, useState } from 'react';
import { Button, Card, Drawer, Form, Input, Popconfirm, Rate, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { VendorReview, Project, Vendor } from '../../shared';
import { RECOMMEND_CONTINUE_OPTIONS } from '../../shared';
import { createVendorReview, deleteVendorReview, fetchVendorReviews, updateVendorReview } from '../../services/vendorReviews';
import { fetchVendors } from '../../services/vendors';
import { fetchProjects } from '../../services/projects';

const RECOMMEND_LABELS: Record<string, { label: string; color: string }> = {
  yes: { label: '建议继续合作', color: 'green' },
  neutral: { label: '中立', color: 'blue' },
  no: { label: '不建议继续合作', color: 'red' },
};

export function VendorReviewsPage() {
  const [items, setItems] = useState<VendorReview[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VendorReview | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      const [reviews, vendorList, projectList] = await Promise.all([
        fetchVendorReviews(),
        fetchVendors(),
        fetchProjects(),
      ]);
      setItems(reviews);
      setVendors(vendorList);
      setProjects(projectList);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载评价记录失败');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <Card
      title="服务商评价管理"
      extra={
        <Button
          type="primary"
          onClick={() => {
            setEditing(null);
            form.resetFields();
            form.setFieldsValue({ score: 3, recommendContinue: 'neutral' });
            setOpen(true);
          }}
        >
          新增评价
        </Button>
      }
    >
      <Table
        rowKey="id"
        dataSource={items}
        columns={[
          { title: '服务商', dataIndex: ['vendor', 'name'] },
          { title: '项目', dataIndex: ['project', 'name'] },
          {
            title: '评分',
            dataIndex: 'score',
            render: (value: number) => <Rate disabled value={value} allowHalf={false} />,
          },
          { title: '评价内容', dataIndex: 'reviewContent', render: (v: string | null) => v || '-' },
          { title: '问题说明', dataIndex: 'issueDescription', render: (v: string | null) => v || '-' },
          {
            title: '建议继续合作',
            dataIndex: 'recommendContinue',
            render: (value: string) => {
              const info = RECOMMEND_LABELS[value] || { label: value, color: 'default' };
              return <Tag color={info.color}>{info.label}</Tag>;
            },
          },
          { title: '评价人', dataIndex: 'reviewedBy' },
          { title: '评价时间', dataIndex: 'reviewedAt' },
          {
            title: '操作',
            render: (_, record) => (
              <Space>
                <Button
                  onClick={() => {
                    setEditing(record);
                    form.setFieldsValue({
                      vendorId: record.vendorId,
                      projectId: record.projectId,
                      score: record.score,
                      reviewContent: record.reviewContent ?? undefined,
                      issueDescription: record.issueDescription ?? undefined,
                      recommendContinue: record.recommendContinue,
                    });
                    setOpen(true);
                  }}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确认删除该评价记录?"
                  onConfirm={async () => {
                    try {
                      await deleteVendorReview(record.id);
                      message.success('评价记录已删除');
                      await load();
                    } catch (error) {
                      message.error(error instanceof Error ? error.message : '删除失败');
                    }
                  }}
                >
                  <Button danger>删除</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Drawer
        title={editing ? '编辑服务商评价' : '新增服务商评价'}
        open={open}
        onClose={() => setOpen(false)}
        width={520}
      >
        <Typography.Paragraph type="secondary">按服务商和项目维度进行评价打分，为后续准入提供参考依据。</Typography.Paragraph>
        <Form
          layout="vertical"
          form={form}
          onFinish={async (values) => {
            try {
              if (editing) {
                await updateVendorReview(editing.id, values);
                message.success('评价已更新');
              } else {
                await createVendorReview(values);
                message.success('评价已创建');
              }
              setOpen(false);
              form.resetFields();
              await load();
            } catch (error) {
              message.error(error instanceof Error ? error.message : '保存评价失败');
            }
          }}
        >
          <Form.Item label="服务商" name="vendorId" rules={[{ required: true, message: '请选择服务商' }]}>
            <Select
              showSearch
              placeholder="请选择服务商"
              optionFilterProp="label"
              options={vendors.map((v) => ({ label: v.name, value: v.id }))}
              disabled={Boolean(editing)}
            />
          </Form.Item>
          <Form.Item label="项目" name="projectId" rules={[{ required: true, message: '请选择项目' }]}>
            <Select
              showSearch
              placeholder="请选择项目"
              optionFilterProp="label"
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
              disabled={Boolean(editing)}
            />
          </Form.Item>
          <Form.Item label="评分" name="score" rules={[{ required: true, message: '请打分' }]}>
            <Rate />
          </Form.Item>
          <Form.Item label="评价内容" name="reviewContent">
            <Input.TextArea rows={4} placeholder="描述服务商的整体表现、优点等" />
          </Form.Item>
          <Form.Item label="问题说明" name="issueDescription">
            <Input.TextArea rows={4} placeholder="说明合作中存在的问题、待改进事项等" />
          </Form.Item>
          <Form.Item label="是否建议继续合作" name="recommendContinue" rules={[{ required: true, message: '请选择' }]}>
            <Select
              options={RECOMMEND_CONTINUE_OPTIONS.map((value) => ({
                label: RECOMMEND_LABELS[value].label,
                value,
              }))}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>保存</Button>
        </Form>
      </Drawer>
    </Card>
  );
}
