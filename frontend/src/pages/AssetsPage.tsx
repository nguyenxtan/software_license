import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Tag, message, Popconfirm, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import AssetFormModal from '../components/AssetFormModal';
import type { SoftwareAsset } from '../types';

export default function AssetsPage() {
  const [assets, setAssets] = useState<SoftwareAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState<SoftwareAsset | null>(null);
  const [searchText, setSearchText] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
  });

  useEffect(() => {
    fetchAssets();
    fetchStats();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/assets');
      setAssets(response.data);
    } catch (error: any) {
      message.error('Không thể tải danh sách phần mềm');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/assets/${id}`);
      message.success('Đã xóa phần mềm');
      fetchAssets();
      fetchStats();
    } catch (error: any) {
      message.error('Không thể xóa phần mềm');
    }
  };

  const handleEdit = (asset: SoftwareAsset) => {
    setEditingAsset(asset);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingAsset(null);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingAsset(null);
    fetchAssets();
    fetchStats();
  };

  const getStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'green',
      EXPIRED: 'red',
      PENDING_RENEWAL: 'orange',
      CANCELLED: 'default',
    };
    return <Tag color={colors[status]}>{status}</Tag>;
  };

  const columns: ColumnsType<SoftwareAsset> = [
    {
      title: 'Tên phần mềm',
      dataIndex: 'name',
      key: 'name',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(value.toString().toLowerCase()) ||
        record.vendor?.toLowerCase().includes(value.toString().toLowerCase()),
    },
    {
      title: 'Phiên bản',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'vendor',
      key: 'vendor',
    },
    {
      title: 'Phòng ban',
      dataIndex: ['department', 'name'],
      key: 'department',
    },
    {
      title: 'Ngày hết hạn',
      dataIndex: 'expireDate',
      key: 'expireDate',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
      sorter: (a, b) => new Date(a.expireDate).getTime() - new Date(b.expireDate).getTime(),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: 'Active', value: 'ACTIVE' },
        { text: 'Expired', value: 'EXPIRED' },
        { text: 'Pending Renewal', value: 'PENDING_RENEWAL' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Tổng phần mềm" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Đang hoạt động" value={stats.active} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Sắp hết hạn" value={stats.expiring} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Đã hết hạn" value={stats.expired} valueStyle={{ color: '#999' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="Tìm kiếm phần mềm..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
          </Space>
          <Space>
            <Button icon={<DownloadOutlined />}>Download Template</Button>
            <Button icon={<UploadOutlined />}>Upload Excel</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm phần mềm
            </Button>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={assets}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <AssetFormModal
        visible={modalVisible}
        asset={editingAsset}
        onClose={handleModalClose}
      />
    </div>
  );
}
