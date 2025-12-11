import { useEffect, useState } from 'react';
import { Table, Card, Button, Tag, Space, message, Modal, Select, Input } from 'antd';
import { DeleteOutlined, CheckOutlined, BellOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';

interface Notification {
  id: string;
  assetId: string;
  assetName: string;
  message: string;
  notificationType: 'EMAIL' | 'SYSTEM' | 'SMS';
  isRead: boolean;
  createdAt: string;
}

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

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      message.success('Đã đánh dấu là đã đọc');
      fetchNotifications();
    } catch (error) {
      message.error('Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa thông báo này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await api.delete(`/notifications/${id}`);
          message.success('Đã xóa thông báo');
          fetchNotifications();
        } catch (error) {
          message.error('Không thể xóa thông báo');
        }
      },
    });
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      message.success('Đã đánh dấu tất cả là đã đọc');
      fetchNotifications();
    } catch (error) {
      message.error('Không thể cập nhật');
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
      dataIndex: 'assetName',
      key: 'assetName',
      width: 200,
    },
    {
      title: 'Nội dung',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: 'Loại',
      dataIndex: 'notificationType',
      key: 'notificationType',
      width: 100,
      render: (type: string) => {
        const colors: Record<string, string> = {
          EMAIL: 'blue',
          SYSTEM: 'green',
          SMS: 'orange',
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isRead',
      key: 'isRead',
      width: 120,
      render: (isRead: boolean) => (
        <Tag color={isRead ? 'default' : 'red'}>
          {isRead ? 'Đã đọc' : 'Chưa đọc'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          {!record.isRead && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleMarkAsRead(record.id)}
            >
              Đã đọc
            </Button>
          )}
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

  const filteredNotifications = notifications
    .filter((notif) => {
      if (filterStatus === 'read') return notif.isRead;
      if (filterStatus === 'unread') return !notif.isRead;
      return true;
    })
    .filter((notif) =>
      notif.assetName.toLowerCase().includes(searchText.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchText.toLowerCase())
    );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
          <Space>
            <Button type="primary" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
              Đánh dấu tất cả đã đọc
            </Button>
          </Space>
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
          rowClassName={(record) => (!record.isRead ? 'unread-notification' : '')}
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
