// Simple controller used for testing the API setup

exports.test = (req, res) => {
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
  });
};
