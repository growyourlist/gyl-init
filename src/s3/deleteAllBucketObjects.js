const Logger = require('../Logger')

const deleteAllBucketObjects = async (s3, Bucket, BucketObjects) => {
  const deleteResponse = await s3.deleteObjects({
    Bucket,
    Delete: {
      Objects: BucketObjects.map(BucketObject => ({
        Key: BucketObject.Key
      }))
    }
  }).promise();
  if (deleteResponse.Errors && deleteResponse.Errors.length) {
    Logger.error("Encountered errors while deleting items:");
    deleteResponse.Errors.forEach(error => Logger.error(error));
    throw new Error(deleteResponse.Errors[0]);
  }
};

module.exports = deleteAllBucketObjects
