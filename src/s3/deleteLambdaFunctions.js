const deleteBuckets = require('./deleteBuckets');
const Logger = require('../Logger');
const getCurrentLambdaBucketNames = require('./getCurrentLambdaBucketNames');

const deleteLambdaFunctions = async () => {
	Logger.info('Finding gyl lambda buckets');
	try {
		const BucketNames = await getCurrentLambdaBucketNames();
		if (BucketNames.length) {
			Logger.info('Deleting gyl lambda buckets');
			await deleteBuckets(BucketNames);
		} else {
			Logger.info('No bucket starting with gyl-lambda-dist- found');
		}
	} catch (err) {
		if (err.code === 'NoSuchBucket') {
			Logger.warn(
				'AWS error: NoSuchBucket when attempting to delete lambda bucket'
			);
		}
	}
};

module.exports = deleteLambdaFunctions;
