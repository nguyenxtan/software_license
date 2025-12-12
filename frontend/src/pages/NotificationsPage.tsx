import { useEffect, useState } from 'react';
import { Table, Card, Button, Tag, Space, message, Modal, Select, Input } from 'antd';
import { DeleteOutlined, CheckOutlined, BellOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import type { Notification as NotificationType } from '../types';

type Notification = NotificationType;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data || response.data);
    } catch (error) {
      message.error('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/resend`);
      message.success('Đã gửi lại thông báo');
      fetchNotifications();
    } catch (error) {
      message.error('Không thể gửi lại thông báo');
    }
  };

  const columns: ColumnsType<Notification> = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
      sorter: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Phần mềm',
      key: 'assetName',
      width: 200,
      render: (_, record) => record.softwareAsset?.name || '-',
    },
    {
      title: 'Nội dung',
      dataIndex: 'emailSubject',
      key: 'emailSubject',
      ellipsis: true,
      render: (subject: string | null) => subject || '-',
    },
    {
      title: 'Nhắc trước (ngày)',
      dataIndex: 'remindBeforeDays',
      key: 'remindBeforeDays',
      width: 120,
      align: 'center',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const colors: Record<string, string> = {
          UPCOMING_EXPIRY: 'orange',
          EXPIRED: 'red',
          CUSTOM: 'blue',
        };
        const labels: Record<string, string> = {
          UPCOMING_EXPIRY: 'Sắp hết hạn',
          EXPIRED: 'Đã hết hạn',
          CUSTOM: 'Tùy chỉnh',
        };
        return <Tag color={colors[type]}>{labels[type] || type}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colors: Record<string, string> = {
          PENDING: 'orange',
          SENT: 'green',
          ACKNOWLEDGED: 'blue',
          FAILED: 'red',
        };
        const labels: Record<string, string> = {
          PENDING: 'Chờ gửi',
          SENT: 'Đã gửi',
          ACKNOWLEDGED: 'Đã xem',
          FAILED: 'Thất bại',
        };
        return <Tag color={colors[status]}>{labels[status] || status}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          {record.status === 'PENDING' && (
            <Button
              type="link"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleResend(record.id)}
            >
              Gửi lại
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const filteredNotifications = notifications
    .filter((notif) => {
      if (filterStatus === 'read') return notif.status === 'SENT' || notif.status === 'ACKNOWLEDGED';
      if (filterStatus === 'unread') return notif.status === 'PENDING';
      return true;
    })
    .filter((notif) => {
      const assetName = notif.softwareAsset?.name || '';
      const emailSubject = notif.emailSubject || '';
      const searchLower = searchText.toLowerCase();
      return assetName.toLowerCase().includes(searchLower) ||
             emailSubject.toLowerCase().includes(searchLower);
    });

  const unreadCount = notifications.filter((n) => n.status === 'PENDING').length;

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <BellOutlined />
            <span>Quản lý Thông báo</span>
            {unreadCount > 0 && (
              <Tag color="red">{unreadCount} chưa đọc</Tag>
            )}
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchNotifications}>
            Tải lại
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Tìm kiếm thông báo..."
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            style={{ width: 150 }}
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'Tất cả' },
              { value: 'unread', label: 'Chưa đọc' },
              { value: 'read', label: 'Đã đọc' },
            ]}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredNotifications}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} thông báo`,
          }}
          rowClassName={(record) => (record.status === 'PENDING' ? 'unread-notification' : '')}
        />
      </Card>

      <style>{`
        .unread-notification {
          background-color: #f0f5ff;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
