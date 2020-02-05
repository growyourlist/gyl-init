const getAllBucketObjects = async (s3, Bucket) => {
  let BucketObjects = [];
  let NextContinuationToken = null;

  do {
    const params = { Bucket };
    if (NextContinuationToken) {
      params.NextContinuationToken = NextContinuationToken;
    }
    const objectsResponse = await s3.listObjectsV2(params).promise();
    if (objectsResponse.KeyCount) {
      BucketObjects = BucketObjects.concat(objectsResponse.Contents);
    }
    NextContinuationToken = objectsResponse.NextContinuationToken || null;
  } while (NextContinuationToken);

  return BucketObjects;
};

module.exports = getAllBucketObjects
