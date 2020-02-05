const AWS = require("../getAWS")();
const deleteBuckets = require('./deleteBuckets')
const findBucketNames = require('./findBucketNames')

const deleteLambdaFunctions = async () => {
	const s3 = new AWS.S3();
	const BucketNames = await findBucketNames(s3, 'gyl-lambda-dist-');
	if (BucketNames.length) {
		await deleteBuckets(s3, BucketNames);
	}
};

module.exports = deleteLambdaFunctions;
