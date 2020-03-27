const AWS = require('../getAWS')();
const deleteBuckets = require('./deleteBuckets');
const findBucketNames = require('./findBucketNames');
const Logger = require('../Logger');

const deleteLambdaFunctions = async () => {
	const s3 = new AWS.S3();
	const BucketNames = await findBucketNames(s3, 'gyl-lambda-dist-');
	if (BucketNames.length) {
		await deleteBuckets(s3, BucketNames);
	} else {
		Logger.info('No bucket starting with gyl-lambda-dist- found');
	}
};

module.exports = deleteLambdaFunctions;
