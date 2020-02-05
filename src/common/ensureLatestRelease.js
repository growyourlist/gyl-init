const path = require('path')
const fs = require('fs')
const rp = require('request-promise-native')
const rimraf = require('util').promisify(require('rimraf'))
const AdmZip = require('adm-zip')

const Logger = require('../Logger')

const ensureLatestRelease = async (releaseDir, releasesUrl) => {
	const packageJSONPath = path.join(releaseDir, 'package.json')
	const projectName = releasesUrl.match(/\/([^/]+)\/releases/)[1] || ''
	Logger.info(`Checking for new versions of ${projectName}`)
	const currentAdminUIVersion = fs.existsSync(packageJSONPath) &&
		JSON.parse(fs.readFileSync(packageJSONPath)).version
	const releases = await rp({
		url: releasesUrl,
		headers: { 'User-Agent': 'request' },
		json: true,
	})
	const latestRelease = releases[0]
	const latestVersion = latestRelease.tag_name.match(/\d+\.\d+\.\d+/)[0]

	// If we don't current have a downloaded copy of the project or we have an
	// outdated copy of it, then we download it again.
	if (!currentAdminUIVersion || (latestVersion !== currentAdminUIVersion)) {
		if (currentAdminUIVersion) {
			Logger.info(`Deleting outdated version of project ${projectName}`)
			await rimraf(releaseDir)
			fs.mkdirSync(releaseDir)
		}

		// Download the zip file containing the latest version.
		Logger.info(`Downloading latest version of ${projectName}`)
		const zipPath = path.join(releaseDir, 'latest-release.zip')
		const zipResponse = await rp({
			url: latestRelease.zipball_url,
			encoding: null,
			headers: { 'User-Agent': 'request' },
		})
		const buffer = Buffer.from(zipResponse)
		fs.writeFileSync(zipPath, buffer)

		// Extract the zip file.
		const zip = new AdmZip(zipPath)
		const entryNames = zip.getEntries().map(entry => entry.entryName)
		entryNames.sort((a, b) => a.length - b.length)
		const baseDir = path.parse(entryNames[0]).base
		const baseLength = baseDir.length
		zip.extractAllTo(releaseDir, true)
		const innerEntryNames = entryNames.slice(1)

		// By default, all items are in root directory, we move them out of this
		// root directory and into the temp folder for the admin-ui.
		innerEntryNames.forEach(itemName => {
			const extractedName = path.join(releaseDir, itemName)
			const targetName = path.join(
				releaseDir, itemName.substring(baseLength)
			)
			if (fs.lstatSync(extractedName).isDirectory()) {
				fs.mkdirSync(targetName)
				return
			}
			fs.renameSync(extractedName, targetName)
		})

		// Clean up the temporary extraction folder and the downloaded zip folder
		rimraf(path.join(releaseDir, baseDir))
		fs.unlinkSync(zipPath)
	}
}

module.exports = ensureLatestRelease
