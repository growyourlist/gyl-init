const AWS = require("../getAWS")();
const findBucketNames = require('./findBucketNames');
const deleteBuckets = require('./deleteBuckets')

const deleteAdminUI = async () => {
  const s3 = new AWS.S3();
  const BucketNames = await findBucketNames(s3, 'gyl-admin-ui-');
  if (BucketNames.length) {
    await deleteBuckets(s3, BucketNames);
  }
};

module.exports = deleteAdminUI;
