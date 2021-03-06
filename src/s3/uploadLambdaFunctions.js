const { readdirSync, existsSync, readFileSync } = require('fs');
const { join } = require('path');
const AWS = require('aws-sdk');

const Logger = require('../Logger');
const ensureLatestRelease = require('../common/ensureLatestRelease');
const ensureTempDirExistsSync = require('../common/ensureTempDirExistsSync');
const generateBucketId = require('../common/generateBucketId');
const { GylVersion } = require('../GylVersion');

const ensureCloudProjectFolderExists = async (tempCloudDir) => {
	if (process.env.SKIP_LATEST_CLOUD_FUNCTIONS_CHECK) {
		return true;
	}
	return await ensureLatestRelease(
		tempCloudDir,
		'https://api.github.com/repos/growyourlist/gyl-cloud-functions/releases'
	);
};

const uploadLambdaFunctionsToS3 = async (existingBucketName = '') => {
	if (process.env.EXISTING_LAMBDA_BUCKET) {
		return process.env.EXISTING_LAMBDA_BUCKET;
	}
	if (existingBucketName && process.env.SKIP_LAMBDA_UPLOAD) {
		return existingBucketName;
	}
	if (process.env.SKIP_LAMBDA_UPLOAD) {
		throw new Error(
			'Can only skip lambda upload if existing bucket name is given.'
		);
	}
	Logger.log(
		`${existingBucketName ? 'Updating' : 'Uploading'} lambda functions...`
	);
	let cloudFunctionsDir = '';
	if (process.env.CLOUD_FUNCS_SOURCE_DIR) {
		cloudFunctionsDir = process.env.CLOUD_FUNCS_SOURCE_DIR
	} else {
		const tempCloudFuncsDir = join(process.cwd(), 'temp', 'gyl-cloud-functions');
		ensureTempDirExistsSync(tempCloudFuncsDir);
		await ensureCloudProjectFolderExists(tempCloudFuncsDir);
		cloudFunctionsDir = tempCloudFuncsDir;
	}
	Logger.log(`Using cloud functions from directory: ${cloudFunctionsDir}`)
	const s3 = new AWS.S3();
	const Bucket = existingBucketName || `gyl-lambda-dist-${generateBucketId()}`;
	if (existingBucketName) {
		try {
			await s3.headBucket({ Bucket }).promise();
		} catch (err) {
			if (err.statusCode === 404) {
				Logger.log(`Recreating lambda bucket ${Bucket} because it was not found.`)
				await s3.createBucket({ Bucket }).promise();
			}
			else {
				throw err;
			}
		}
	} else {
		await s3.createBucket({ Bucket }).promise();
	}
	const zipName = 'dist.zip';
	const cloudFunctionDirectories = readdirSync(cloudFunctionsDir, {
		withFileTypes: true,
	})
		.filter(
			(i) =>
				i.isDirectory() && existsSync(join(cloudFunctionsDir, i.name, zipName))
		)
		.map((i) => i.name);
	await Promise.all(
		cloudFunctionDirectories.map((dir) =>
			s3
				.putObject({
					Bucket,
					Key: `${GylVersion}-${dir}-${zipName}`,
					ContentType: 'application/zip',
					Body: readFileSync(join(cloudFunctionsDir, dir, zipName)),
				})
				.promise()
		)
	);
	return Bucket;
};

module.exports = uploadLambdaFunctionsToS3;
