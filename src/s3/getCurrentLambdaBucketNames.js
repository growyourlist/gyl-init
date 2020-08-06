const findBucketNames = require('./findBucketNames');

const AWS = require('../getAWS')();

const getCurrentLambdaBucketNames = async () => {
	const s3 = new AWS.S3();
	const BucketNames = await findBucketNames(s3, 'gyl-lambda-dist-');
	return BucketNames;
};

module.exports = getCurrentLambdaBucketNames;
