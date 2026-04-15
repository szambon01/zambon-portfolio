exports.handler = async () => {
  return {
    statusCode: 301,
    headers: { Location: '/projects.json' },
    body: ''
  };
};
