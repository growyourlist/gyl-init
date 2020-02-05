const util = require('util')
const { promisify } = util
const fs = require('fs')
const path = require('path')
const exec = promisify(require('child_process').exec)

const ensureTempDirExistsSync = require('../common/ensureTempDirExistsSync')
const ensureLatestRelease = require('../common/ensureLatestRelease')
const installDependencies = require('../common/installDependencies')
const generateBucketId = require('../common/geneateBucketId')
const Logger = require('../Logger')
const AWS = require('../getAWS')()

const contentTypes = [
	{ ext: /\.css$/i, type: 'text/css; charset=UTF-8' },
	{ ext: /\.js$/i, type: 'application/javascript' },
	{ ext: /\.html$/i, type: 'text/html; charset=UTF-8' },
	{ ext: /\.map$/i, type: 'application/json' },
]

const getContentType = filepath => {
	for (let i = 0; i < contentTypes.length; i++) {
		if (contentTypes[i].ext.test(filepath)) {
			return contentTypes[i].type
		}
	}
	return 'text/plain'
}

const installAdminUIProjectDependencies = async (tempAdminUIPath) => {
	return await installDependencies(tempAdminUIPath)
}

const buildAdminUI = async (tempAdminUIPath) => {
	Logger.info(`Building admin UI`)
	let { stderr } = await exec('yarn run build', { cwd: tempAdminUIPath })
	if (stderr && stderr.trim()) {
		throw new Error(`Error building the admin UI: ${stderr}`)
	}
}

const uploadFile = async (
	putObject, filePath, distFolder, adminUIVersion, Bucket, ACL
) => {
	const Key = `${adminUIVersion}${filePath.substring(
		distFolder.length
	)}`.replace(/\\/g, '/')
	const ContentType = getContentType(Key)
	const Body = fs.readFileSync(filePath)
	return await putObject({
		ACL,
		Bucket,
		Key,
		ContentType,
		Body,
	})
}

const uploadAdminUI = async (s3, distFolder, adminUIVersion, Bucket) => {

	// Get all the files that need to be uploaded.
	const files = []
	const addPaths = dirPath => {
		const items = fs.readdirSync(dirPath, { withFileTypes: true })
		items.forEach(item => {
			const fullItemPath = path.join(dirPath, item.name)
			if (item.isDirectory()) {
				addPaths(fullItemPath)
				return
			}
			files.push(fullItemPath)
		})
	}
	addPaths(distFolder)

	// Upload all the files.
	Logger.info(`Uploading admin UI files`)
	const putObject = promisify(s3.putObject).bind(s3)
	const ACL = 'public-read'
	await Promise.all(files.map(filePath => uploadFile(
		putObject, filePath, distFolder, adminUIVersion, Bucket, ACL
	)))
}

const ensureAdminUIProjectFolderExists = async (tempAdminUIPath) => {
	return await ensureLatestRelease(
		tempAdminUIPath,
		'https://api.github.com/repos/growyourlist/gyl-admin-ui/releases',
	)
}

const createAdminUI = async () => {

	// Create the Bucket which will contain the GYL Admin UI files
	const s3 = new AWS.S3()
	const Bucket = `gyl-admin-ui-${generateBucketId()}`
	const createBucket = promisify(s3.createBucket).bind(s3)
	Logger.info(`Creating bucket: ${Bucket}`)
	const { Location } = await createBucket({ Bucket })

	// Ensure the temp directory containing the admin ui exists
	const tempAdminUIPath = path.join(process.cwd(), 'temp', 'gyl-admin-ui')
	ensureTempDirExistsSync(tempAdminUIPath)
	await ensureAdminUIProjectFolderExists(tempAdminUIPath)
	await installAdminUIProjectDependencies(tempAdminUIPath)
	await buildAdminUI(tempAdminUIPath)
	const adminUIVersion = JSON.parse(fs.readFileSync(
		path.join(tempAdminUIPath, 'package.json')
	)).version
	await uploadAdminUI(
		s3, path.join(tempAdminUIPath, 'dist'), adminUIVersion, Bucket
	)
	Logger.info(`GYL Admin UI available at: ${
		Location.replace(/^http:\/\//, 'https://')
	}${adminUIVersion}/index.html`)
}

module.exports = createAdminUI
