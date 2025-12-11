import { useEffect, useState } from 'react';
import { Table, Card, Button, Space, message, Modal, Form, Input, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  managerName?: string;
  createdAt: string;
  _count?: {
    users: number;
    assets: number;
  };
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách phòng ban');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingDept(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    form.setFieldsValue({
      name: dept.name,
      code: dept.code,
      description: dept.description,
      managerName: dept.managerName,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa phòng ban này? Tất cả người dùng thuộc phòng ban sẽ bị ảnh hưởng.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await api.delete(`/departments/${id}`);
          message.success('Đã xóa phòng ban');
          fetchDepartments();
        } catch (error) {
          message.error('Không thể xóa phòng ban');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept.id}`, values);
        message.success('Cập nhật phòng ban thành công');
      } else {
        await api.post('/departments', values);
        message.success('Thêm phòng ban thành công');
      }
      setModalVisible(false);
      fetchDepartments();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const columns: ColumnsType<Department> = [
    {
      title: 'Mã phòng ban',
      dataIndex: 'code',
      key: 'code',
      sorter: (a, b) => a.code.localeCompare(b.code),
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Tên phòng ban',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || <Tag>Chưa có</Tag>,
    },
    {
      title: 'Trưởng phòng',
      dataIndex: 'managerName',
      key: 'managerName',
      render: (name: string) => name || <Tag>Chưa có</Tag>,
    },
    {
      title: 'Số người dùng',
      dataIndex: ['_count', 'users'],
      key: 'users',
      align: 'center',
      render: (count: number) => (
        <Tag color={count > 0 ? 'green' : 'default'}>{count || 0}</Tag>
      ),
      sorter: (a, b) => (a._count?.users || 0) - (b._count?.users || 0),
    },
    {
      title: 'Số phần mềm',
      dataIndex: ['_count', 'assets'],
      key: 'assets',
      align: 'center',
      render: (count: number) => (
        <Tag color={count > 0 ? 'cyan' : 'default'}>{count || 0}</Tag>
      ),
      sorter: (a, b) => (a._count?.assets || 0) - (b._count?.assets || 0),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchText.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchText.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      dept.managerName?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>Quản lý Phòng ban</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm phòng ban
          </Button>
        }
      >
        <Input.Search
          placeholder="Tìm kiếm theo tên, mã phòng ban..."
          style={{ width: 300, marginBottom: 16 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />

        <Table
          columns={columns}
          dataSource={filteredDepartments}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} phòng ban`,
          }}
        />
      </Card>

      <Modal
        title={editingDept ? 'Sửa thông tin phòng ban' : 'Thêm phòng ban mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        okText={editingDept ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="code"
            label="Mã phòng ban"
            rules={[
              { required: true, message: 'Vui lòng nhập mã phòng ban' },
              { pattern: /^[A-Z0-9_]+$/, message: 'Mã phòng ban chỉ chứa chữ in hoa, số và dấu gạch dưới' },
            ]}
          >
            <Input placeholder="IT_DEPT" disabled={!!editingDept} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên phòng ban"
            rules={[{ required: true, message: 'Vui lòng nhập tên phòng ban' }]}
          >
            <Input placeholder="Phòng Công nghệ Thông tin" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={3} placeholder="Mô tả về phòng ban..." />
          </Form.Item>

          <Form.Item
            name="managerName"
            label="Trưởng phòng"
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
