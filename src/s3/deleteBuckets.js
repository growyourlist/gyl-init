const Logger = require("../Logger");
const getAllBucketObjects = require('./getAllBucketObjects')
const deleteAllBucketObjects = require('./deleteAllBucketObjects')

const deleteBuckets = async (s3, BucketNames) => {
	for (let i = 0; i < BucketNames.length; i++) {
		const Bucket = BucketNames[i];

		if (Bucket === process.env.EXISTING_LAMBDA_BUCKET) {
			continue;
		}

		Logger.info(`Deleting Bucket: ${Bucket}`);
		try {
			const BucketObjects = await getAllBucketObjects(s3, Bucket);
			if (BucketObjects.length) {
				await deleteAllBucketObjects(s3, Bucket, BucketObjects);
			}
			await s3.deleteBucket({ Bucket }).promise();
		}
		catch (err) {
			if (err.code === 'NoSuchBucket') {
				console.warn(`Bucket not found: ${Bucket}`)
			}
			else {
				throw err
			}
		}
	}
}

module.exports = deleteBuckets;
