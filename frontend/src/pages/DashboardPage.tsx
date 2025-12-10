import { Layout, Menu, Card, Row, Col, Statistic } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = Layout;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <h2>License System</h2>
        </div>
        <Menu theme="dark" defaultSelectedKeys={['dashboard']} mode="inline">
          <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
            Dashboard
          </Menu.Item>
          <Menu.Item key="assets" icon={<AppstoreOutlined />}>
            Phần mềm
          </Menu.Item>
          <Menu.Item key="notifications" icon={<BellOutlined />}>
            Thông báo
          </Menu.Item>
          <Menu.Item key="users" icon={<UserOutlined />}>
            Người dùng
          </Menu.Item>
          <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
            Đăng xuất
          </Menu.Item>
        </Menu>
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px' }}>
          <h2>Dashboard</h2>
        </Header>

        <Content style={{ margin: '24px' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic title="Tổng phần mềm" value={0} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Sắp hết hạn" value={0} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Đã hết hạn" value={0} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Đang hoạt động" value={0} />
              </Card>
            </Col>
          </Row>

          <Card style={{ marginTop: 24 }}>
            <h3>Chào mừng, {user?.fullName || user?.username}!</h3>
            <p>Vai trò: {user?.role}</p>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
