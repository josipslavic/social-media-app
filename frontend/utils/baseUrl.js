const baseUrl =
  process.env.NODE_ENV !== 'production'
    ? 'http://localhost:8000'
    : 'https://inder-social-media2.herokuapp.com';

module.exports = baseUrl;
