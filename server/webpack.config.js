const path = require('path');

module.exports = function (options) {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      alias: {
        ...(options.resolve?.alias ?? {}),
        '@app/workspace': path.resolve(__dirname, 'libs/workspace/src'),
        '@app/workflow': path.resolve(__dirname, 'libs/workflow/src'),
      },
    },
  };
};
