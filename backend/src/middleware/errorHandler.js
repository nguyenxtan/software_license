const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dữ liệu không hợp lệ',
      details: err.message,
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Dữ liệu đã tồn tại',
      details: 'Giá trị đã tồn tại trong hệ thống',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Không tìm thấy dữ liệu',
      details: err.message,
    });
  }

  res.status(500).json({
    error: 'Lỗi hệ thống',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Đã xảy ra lỗi',
  });
};

module.exports = errorHandler;
