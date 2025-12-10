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
      label: 'Qu\u1ea3n l\u00fd ph\u1ea7n m\u1ec1m',
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: 'Th\u00f4ng b\u00e1o',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Ng\u01b0\u1eddi d\u00f9ng',
    },
    {
      key: '/departments',
      icon: <TeamOutlined />,
      label: 'Ph\u00f2ng ban',
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
                label: '\u0110\u0103ng xu\u1ea5t',
                onClick: handleLogout,
              },
            ]}
          />
        </div>
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>H\u1ec7 th\u1ed1ng Qu\u1ea3n l\u00fd B\u1ea3n quy\u1ec1n Ph\u1ea7n m\u1ec1m</h2>
          <div>
            Ch\u00e0o, <strong>{user?.fullName || user?.username}</strong> ({user?.role})
          </div>
        </Header>

        <Content style={{ margin: '0' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
