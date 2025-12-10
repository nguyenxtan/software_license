import { Modal, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import api from '../services/api';

interface ExcelUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExcelUploadModal({ visible, onClose, onSuccess }: ExcelUploadModalProps) {
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    customRequest: async ({ file, onSuccess: onUploadSuccess, onError }) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await api.post('/assets/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        message.success(`Import thành công ${response.data.imported} phần mềm`);
        onUploadSuccess?.(response.data);
        onSuccess();
        onClose();
      } catch (error: any) {
        message.error(error.response?.data?.message || 'Upload thất bại');
        onError?.(error);
      }
    },
  };

  return (
    <Modal
      title="Upload Excel File"
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      <Upload.Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click hoặc kéo file vào đây để upload</p>
        <p className="ant-upload-hint">
          Chỉ hỗ trợ file Excel (.xlsx, .xls)
        </p>
      </Upload.Dragger>
    </Modal>
  );
}
