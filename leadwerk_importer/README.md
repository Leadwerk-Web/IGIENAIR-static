# IGIENAIR WordPress Import

## Installation order

1. Back up the WordPress database and `wp-content/uploads`.
2. Install and activate `leadwerk-fields`.
3. Install and activate `leadwerk-wpml-clone`.
4. Install and activate `leadwerk_theme`.
5. Install and activate `leadwerk_importer`.
6. Save WordPress permalinks once.

ACF or ACF Pro must not be active. WPForms is optional during import, but is
required for the live quote form.

## Import

The source package is intentionally large and should be deployed by FTP, SSH,
or WP-CLI instead of the WordPress ZIP uploader.

1. Open **Tools > IGIENAIR Import**.
2. Run preflight and resolve every error.
3. Run a dry-run.
4. Start the real batch import. An interrupted job can be resumed.
5. Configure the WPForms quote form under **Settings > IGIENAIR**.
6. Verify the front page, menus, contact links, media, canonical URLs, and 404.

The importer updates all 176 records by `leadwerk_source_key` and media checksum.
Re-running it must not create duplicate pages or attachments. Missing source
records are reported as orphans and are never deleted automatically.

## Package maintenance

Rebuild and validate the package from the repository root:

```bash
node leadwerk_importer/tools/build-source-package.mjs
node leadwerk_theme/tools/build-theme-package.mjs
node leadwerk_importer/tools/validate-package.mjs
```
