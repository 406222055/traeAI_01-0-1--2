import { useEffect, useState } from 'react';
import { Button, Card, Descriptions, Drawer, Form, Input, Rate, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { Vendor, VendorReview, VendorReviewStats } from '../../shared';
import { VENDOR_STATUSES } from '../../shared';
import { createVendor, fetchVendors, updateVendor } from '../../services/vendors';
import { fetchAllVendorReviewStats, fetchVendorReviews } from '../../services/vendorReviews';

export function VendorsPage() {
  const [items, setItems] = useState<Vendor[]>([]);
  const [statsMap, setStatsMap] = useState<Map<string, VendorReviewStats>>(new Map());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);
  const [detailReviews, setDetailReviews] = useState<VendorReview[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      const [vendors, allStats] = await Promise.all([fetchVendors(), fetchAllVendorReviewStats()]);
      setItems(vendors);
      const map = new Map<string, VendorReviewStats>();
      for (const stat of allStats) {
        map.set(stat.vendorId, stat);
      }
      setStatsMap(map);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载服务商失败');
    }
  };

  const loadDetail = async (vendor: Vendor) => {
    try {
      setDetailVendor(vendor);
      const reviews = await fetchVendorReviews({ vendorId: vendor.id });
      setDetailReviews(reviews);
      setDetailOpen(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载评价记录失败');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const getScoreColor = (avg: number | null) => {
    if (avg == null) return 'default';
    if (avg >= 4) return 'green';
    if (avg >= 3) return 'blue';
    return 'orange';
  };

  return (
    <Card
      title="服务商管理"
      extra={
        <Button
          type="primary"
          onClick={() => {
            setEditing(null);
            form.resetFields();
            form.setFieldsValue({ status: 'active' });
            setOpen(true);
          }}
        >
          新增服务商
        </Button>
      }
    >
      <Table
        rowKey="id"
        dataSource={items}
        columns={[
          { title: '名称', dataIndex: 'name' },
          { title: '统一社会信用代码', dataIndex: 'creditCode' },
          { title: '服务类别', dataIndex: 'serviceType' },
          { title: '联系人', dataIndex: 'contactName' },
          { title: '联系电话', dataIndex: 'contactPhone' },
          { title: '状态', dataIndex: 'status', render: (value: string) => <Tag color={value === 'active' ? 'green' : 'default'}>{value}</Tag> },
          {
            title: '平均分',
            dataIndex: 'id',
            render: (id: string) => {
              const stat = statsMap.get(id);
              if (!stat || stat.averageScore == null) {
                return <Tag color="default">暂无评价</Tag>;
              }
              return (
                <Tag color={getScoreColor(stat.averageScore)}>
                  {stat.averageScore.toFixed(2)} 分 ({stat.reviewCount}条)
                </Tag>
              );
            },
          },
          { title: '备注', dataIndex: 'remark', render: (value: string | null) => value || '-' },
          {
            title: '操作',
            render: (_, record) => (
              <Space>
                <Button onClick={() => void loadDetail(record)}>查看评价</Button>
                <Button
                  onClick={() => {
                    setEditing(record);
                    form.setFieldsValue(record);
                    setOpen(true);
                  }}
                >
                  编辑
                </Button>
              </Space>
            ),
          },
        ]}
      />
      <Drawer
        title={editing ? '编辑服务商' : '新增服务商'}
        open={open}
        onClose={() => setOpen(false)}
        width={480}
      >
        <Typography.Paragraph type="secondary">支持新增、编辑和详情级信息展示。</Typography.Paragraph>
        <Form
          layout="vertical"
          form={form}
          onFinish={async (values) => {
            try {
              if (editing) {
                await updateVendor(editing.id, values);
                message.success('服务商已更新');
              } else {
                await createVendor(values);
                message.success('服务商已创建');
              }
              setOpen(false);
              form.resetFields();
              await load();
            } catch (error) {
              message.error(error instanceof Error ? error.message : '保存服务商失败');
            }
          }}
        >
          <Form.Item label="名称" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="统一社会信用代码" name="creditCode" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="服务类别" name="serviceType" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="联系人" name="contactName" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="联系电话" name="contactPhone" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true }]}>
            <Select options={VENDOR_STATUSES.map((value) => ({ label: value, value }))} />
          </Form.Item>
          <Form.Item label="备注" name="remark"><Input.TextArea rows={4} /></Form.Item>
          <Button type="primary" htmlType="submit" block>保存</Button>
        </Form>
      </Drawer>
      <Drawer
        title={detailVendor ? `${detailVendor.name} - 评价详情` : '评价详情'}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={720}
      >
        {detailVendor && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="服务商名称">{detailVendor.name}</Descriptions.Item>
              <Descriptions.Item label="统一社会信用代码">{detailVendor.creditCode}</Descriptions.Item>
              <Descriptions.Item label="服务类别">{detailVendor.serviceType}</Descriptions.Item>
              <Descriptions.Item label="联系人/电话">
                {detailVendor.contactName} / {detailVendor.contactPhone}
              </Descriptions.Item>
              <Descriptions.Item label="平均分" span={2}>
                {statsMap.get(detailVendor.id)?.averageScore != null
                  ? `${statsMap.get(detailVendor.id)!.averageScore!.toFixed(2)} 分 (共 ${statsMap.get(detailVendor.id)!.reviewCount} 条评价)`
                  : '暂无评价'}
              </Descriptions.Item>
            </Descriptions>
            <Typography.Title level={5}>历史评价记录</Typography.Title>
            <Table
              rowKey="id"
              dataSource={detailReviews}
              pagination={false}
              size="small"
              columns={[
                { title: '项目', dataIndex: ['project', 'name'] },
                { title: '评分', dataIndex: 'score', render: (v: number) => <Rate disabled value={v} /> },
                { title: '评价内容', dataIndex: 'reviewContent', render: (v: string | null) => v || '-' },
                { title: '问题说明', dataIndex: 'issueDescription', render: (v: string | null) => v || '-' },
                {
                  title: '建议合作',
                  dataIndex: 'recommendContinue',
                  render: (v: string) => {
                    const map: Record<string, { label: string; color: string }> = {
                      yes: { label: '建议', color: 'green' },
                      neutral: { label: '中立', color: 'blue' },
                      no: { label: '不建议', color: 'red' },
                    };
                    const info = map[v] || { label: v, color: 'default' };
                    return <Tag color={info.color}>{info.label}</Tag>;
                  },
                },
                { title: '评价人', dataIndex: 'reviewedBy' },
                { title: '评价时间', dataIndex: 'reviewedAt' },
              ]}
            />
          </>
        )}
      </Drawer>
    </Card>
  );
}
