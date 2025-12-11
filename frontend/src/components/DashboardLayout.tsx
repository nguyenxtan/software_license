import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  BellOutlined,
  UserOutlined,
  TeamOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = Layout;

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/assets',
      icon: <AppstoreOutlined />,
      label: 'Quản lý phần mềm',
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: 'Thông báo',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Người dùng',
    },
    {
      key: '/departments',
      icon: <TeamOutlined />,
      label: 'Phòng ban',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold'
        }}>
          License System
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
        <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
          <Menu
            theme="dark"
            mode="inline"
            items={[
              {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Đăng xuất',
                onClick: handleLogout,
              },
            ]}
          />
        </div>
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Hệ thống Quản lý Bản quyền Phần mềm</h2>
          <div>
            Chào, <strong>{user?.fullName || user?.username}</strong> ({user?.role})
          </div>
        </Header>

        <Content style={{ margin: '0' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
