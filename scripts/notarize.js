/**
 * scripts/notarize.js
 *
 * Called by electron-builder as the `afterSign` hook.
 * Submits the signed .app bundle to Apple's notary service.
 *
 * Required environment variables (set in CI or locally):
 *   APPLE_ID              — your Apple ID email
 *   APPLE_APP_SPECIFIC_PASSWORD — app-specific password from appleid.apple.com
 *   APPLE_TEAM_ID         — your 10-character Team ID from developer.apple.com
 *
 * To skip notarization (e.g. local dev builds):
 *   SKIP_NOTARIZE=true npm run build
 *
 * Install the notarize package:
 *   npm install --save-dev @electron/notarize
 */

'use strict';

const { notarize } = require('@electron/notarize');

module.exports = async function afterSign(context) {
  const { electronPlatformName, appOutDir } = context;

  // Only notarize macOS builds
  if (electronPlatformName !== 'darwin') return;

  // Allow skipping in local dev
  if (process.env.SKIP_NOTARIZE === 'true') {
    console.log('Skipping notarization (SKIP_NOTARIZE=true)');
    return;
  }

  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env;

  if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
    console.warn(
      '⚠  Skipping notarization — set APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, ' +
      'and APPLE_TEAM_ID to enable it.'
    );
    return;
  }

  const appName   = context.packager.appInfo.productFilename;
  const appPath   = `${appOutDir}/${appName}.app`;
  const appBundleId = 'com.macterm.app';

  console.log(`\nNotarizing ${appBundleId} at ${appPath}…`);

  try {
    await notarize({
      appBundleId,
      appPath,
      appleId:             APPLE_ID,
      appleIdPassword:     APPLE_APP_SPECIFIC_PASSWORD,
      teamId:              APPLE_TEAM_ID,
    });
    console.log('✓ Notarization complete');
  } catch (err) {
    console.error('✗ Notarization failed:', err.message);
    throw err;
  }
};
