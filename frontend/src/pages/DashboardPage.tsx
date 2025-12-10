import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import type { SoftwareAsset } from '../types';

const COLORS = ['#52c41a', '#faad14', '#ff4d4f', '#d9d9d9'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
  });
  const [recentAssets, setRecentAssets] = useState<SoftwareAsset[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsRes = await api.get('/dashboard/stats');
      setStats(statsRes.data);

      // Fetch recent/expiring assets
      const assetsRes = await api.get('/assets?limit=5');
      setRecentAssets(assetsRes.data.slice(0, 5));

      // Fetch department stats
      const deptsRes = await api.get('/departments');
      const deptStats = deptsRes.data.map((dept: any) => ({
        name: dept.name,
        count: dept._count?.assets || 0,
      }));
      setDepartmentData(deptStats);
    } catch (error) {
      console.error('Failed to fetch dashboard data');
    }
  };

  const statusData = [
    { name: 'Active', value: stats.active },
    { name: 'Expiring Soon', value: stats.expiring },
    { name: 'Expired', value: stats.expired },
    { name: 'Other', value: Math.max(0, stats.total - stats.active - stats.expiring - stats.expired) },
  ];

  const columns = [
    {
      title: 'Tên phần mềm',
      dataIndex: 'name',
      key: 'name',
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
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          ACTIVE: 'green',
          EXPIRED: 'red',
          PENDING_RENEWAL: 'orange',
          CANCELLED: 'default',
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1>Chào mừng, {user?.fullName || user?.username}!</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Vai trò: <strong>{user?.role}</strong> | Phòng ban: <strong>{user?.department?.name || 'N/A'}</strong>
      </p>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng phần mềm"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Sắp hết hạn"
              value={stats.expiring}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã hết hạn"
              value={stats.expired}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="Phân bổ theo trạng thái">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Phân bổ theo phòng ban">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#1890ff" name="Số lượng phần mềm" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Recent Assets Table */}
      <Card title="Phần mềm gần đây">
        <Table
          columns={columns}
          dataSource={recentAssets}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
}
