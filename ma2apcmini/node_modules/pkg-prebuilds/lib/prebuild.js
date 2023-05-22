const fs = require('fs')

/**
 * Generate the filename of the prebuild file.
 * The format of the name is possible to calculate based on some options
 * @param {object} options 
 * @returns 
 */
function getPrebuildName(options) {
    if (!options.napi_version) throw new Error('NAN not implemented') // TODO

    const tokens = [
        options.name,
        options.platform,
        options.arch,
        // options.armv ? (options.arch === 'arm64' ? '8' : vars.arm_version) : null,
        options.libc && options.platform === 'linux' ? options.libc : null,
    ]
    return `${tokens.filter(t => !!t).join('-')}/${options.runtime}-napi-v${options.napi_version}.node`
}

function isNwjs () {
    return !!(process.versions && process.versions.nw)
}

function isElectron () {
    if (process.versions && process.versions.electron) return true
    if (process.env.ELECTRON_RUN_AS_NODE) return true
    return typeof window !== 'undefined' && window.process && window.process.type === 'renderer'
}

function isAlpine (platform) {
    return platform === 'linux' && fs.existsSync('/etc/alpine-release')
}

module.exports = {
    getPrebuildName,
    isNwjs,
    isElectron,
    isAlpine
}