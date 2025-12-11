import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, message, Checkbox } from 'antd';
import dayjs from 'dayjs';
import api from '../services/api';
import type { SoftwareAsset } from '../types';

interface AssetFormModalProps {
  visible: boolean;
  asset: SoftwareAsset | null;
  onClose: () => void;
}

export default function AssetFormModal({ visible, asset, onClose }: AssetFormModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      fetchDepartments();
      if (asset) {
        form.setFieldsValue({
          ...asset,
          expireDate: dayjs(asset.expireDate),
          // Convert comma-separated string to array for Checkbox.Group
          notificationChannels: asset.notificationChannels
            ? asset.notificationChannels.split(',').map((c: string) => c.trim())
            : ['EMAIL'],
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, asset]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách phòng ban');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        expireDate: values.expireDate.toISOString(),
        // Convert notificationChannels array to comma-separated string
        notificationChannels: Array.isArray(values.notificationChannels)
          ? values.notificationChannels.join(',')
          : values.notificationChannels || 'EMAIL',
      };

      if (asset) {
        await api.put(`/software-assets/${asset.id}`, data);
        message.success('Cập nhật phần mềm thành công');
      } else {
        await api.post('/software-assets', data);
        message.success('Thêm phần mềm thành công');
      }
      onClose();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={asset ? 'Sửa thông tin phần mềm' : 'Thêm phần mềm mới'}
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="name"
          label="Tên phần mềm"
          rules={[{ required: true, message: 'Vui lòng nhập tên phần mềm' }]}
        >
          <Input placeholder="Tên phần mềm" />
        </Form.Item>

        <Form.Item name="version" label="Phiên bản">
          <Input placeholder="v1.0.0" />
        </Form.Item>

        <Form.Item name="vendorName" label="Nhà cung cấp">
          <Input placeholder="Tên nhà cung cấp" />
        </Form.Item>

        <Form.Item name="licenseKey" label="License Key">
          <Input.TextArea placeholder="License key hoặc serial number" rows={2} />
        </Form.Item>

        <Form.Item name="licenseType" label="Loại License">
          <Select placeholder="Chọn loại license">
            <Select.Option value="Perpetual">Perpetual</Select.Option>
            <Select.Option value="Subscription">Subscription</Select.Option>
            <Select.Option value="Trial">Trial</Select.Option>
            <Select.Option value="OEM">OEM</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="departmentId"
          label="Phòng ban"
          rules={[{ required: true, message: 'Vui lòng chọn phòng ban' }]}
        >
          <Select placeholder="Chọn phòng ban">
            {departments.map((dept) => (
              <Select.Option key={dept.id} value={dept.id}>
                {dept.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="assignedTo" label="Người/Bộ phận sử dụng">
          <Input placeholder="Tên người hoặc bộ phận" />
        </Form.Item>

        <Form.Item
          name="expireDate"
          label="Ngày hết hạn"
          rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item name="costYear" label="Chi phí/năm (VNĐ)">
          <InputNumber
            style={{ width: '100%' }}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item name="status" label="Trạng thái">
          <Select placeholder="Chọn trạng thái">
            <Select.Option value="ACTIVE">Active</Select.Option>
            <Select.Option value="EXPIRED">Expired</Select.Option>
            <Select.Option value="PENDING_RENEWAL">Pending Renewal</Select.Option>
            <Select.Option value="CANCELLED">Cancelled</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Cấu hình thông báo">
          <Form.Item name="notificationEnabled" valuePropName="checked" noStyle initialValue={true}>
            <Checkbox>Bật thông báo</Checkbox>
          </Form.Item>
        </Form.Item>

        <Form.Item name="notificationFrequency" label="Tần suất thông báo" initialValue="MILESTONES">
          <Select placeholder="Chọn tần suất">
            <Select.Option value="MILESTONES">Chỉ ở các mốc (90/60/30/7/1 ngày)</Select.Option>
            <Select.Option value="DAILY">Hằng ngày</Select.Option>
            <Select.Option value="WEEKLY">Hằng tuần (Thứ 2)</Select.Option>
            <Select.Option value="CUSTOM">Tùy chỉnh (Cron)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="notificationStartDays" label="Bắt đầu nhắc trước (ngày)" initialValue={90}>
          <InputNumber min={1} max={365} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="notificationChannels" label="Kênh thông báo" initialValue="EMAIL">
          <Checkbox.Group>
            <Checkbox value="EMAIL">Email</Checkbox>
            <Checkbox value="WEBHOOK">Webhook (N8N)</Checkbox>
            <Checkbox value="TELEGRAM">Telegram</Checkbox>
            <Checkbox value="ZALO">Zalo OA</Checkbox>
          </Checkbox.Group>
        </Form.Item>

        <Form.Item name="notificationWebhookUrl" label="Webhook URL">
          <Input placeholder="https://n8n-prod.iconiclogs.com/webhook/noti_license" />
        </Form.Item>

        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={3} placeholder="Ghi chú thêm" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
