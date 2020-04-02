const AWS = require('../getAWS')();
const deleteBuckets = require('./deleteBuckets');
const findBucketNames = require('./findBucketNames');
const Logger = require('../Logger');

const deleteLambdaFunctions = async () => {
	const s3 = new AWS.S3();
	Logger.info('Finding gyl lambda buckets');
	try {
		const BucketNames = await findBucketNames(s3, 'gyl-lambda-dist-');
		if (BucketNames.length) {
			Logger.info('Deleting gyl lambda buckets')
			await deleteBuckets(s3, BucketNames);
		} else {
			Logger.info('No bucket starting with gyl-lambda-dist- found');
		}
	} catch (err) {
		if (err.code === 'NoSuchBucket') {
			Logger.warn('AWS error: NoSuchBucket when attempting to delete lambda bucket');
		}
	}
};

module.exports = deleteLambdaFunctions;
