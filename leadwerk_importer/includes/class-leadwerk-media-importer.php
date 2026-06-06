<?php
/**
 * Checksum-based media importer.
 *
 * @package Leadwerk_Importer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Leadwerk_Media_Importer {
	private $root;
	private $dry_run;
	private $cache = array();

	public function __construct( $root, $dry_run ) {
		$this->root = trailingslashit( wp_normalize_path( $root ) );
		$this->dry_run = (bool) $dry_run;
	}

	public function import( $relative_path ) {
		$relative_path = $this->normalize_relative_path( $relative_path );
		if ( '' === $relative_path ) {
			return new WP_Error( 'leadwerk_media_path', 'Ungueltiger Medienpfad.' );
		}
		if ( isset( $this->cache[ $relative_path ] ) ) {
			return $this->cache[ $relative_path ];
		}

		$absolute = wp_normalize_path( $this->root . $relative_path );
		if ( 0 !== strpos( $absolute, $this->root ) || ! is_file( $absolute ) ) {
			return new WP_Error( 'leadwerk_media_missing', 'Mediendatei fehlt: ' . $relative_path );
		}
		$checksum = hash_file( 'sha256', $absolute );
		$existing_path = get_posts(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'posts_per_page' => 1,
				'fields'         => 'ids',
				'meta_key'       => '_leadwerk_source_path',
				'meta_value'     => $relative_path,
			)
		);
		if ( $existing_path ) {
			$existing_id = (int) $existing_path[0];
			$existing_file = get_attached_file( $existing_id );
			if ( $existing_file && is_file( $existing_file ) ) {
				$existing_checksum = (string) get_post_meta( $existing_id, '_leadwerk_source_checksum', true );
				if ( hash_equals( $checksum, $existing_checksum ) ) {
					return $this->cache[ $relative_path ] = $existing_id;
				}
				if ( $this->dry_run ) {
					return $this->cache[ $relative_path ] = 0;
				}
				$replacement = $existing_file . '.leadwerk-replacement';
				if ( ! @copy( $absolute, $replacement ) || ! @rename( $replacement, $existing_file ) ) {
					@unlink( $replacement );
					return new WP_Error( 'leadwerk_media_replace', 'Degisen medya dosyasi guncellenemedi: ' . $relative_path );
				}
				require_once ABSPATH . 'wp-admin/includes/image.php';
				$metadata = wp_generate_attachment_metadata( $existing_id, $existing_file );
				if ( is_array( $metadata ) ) {
					wp_update_attachment_metadata( $existing_id, $metadata );
				}
				update_post_meta( $existing_id, '_leadwerk_source_checksum', $checksum );
				update_post_meta( $existing_id, '_leadwerk_source_size', (int) filesize( $absolute ) );
				return $this->cache[ $relative_path ] = $existing_id;
			}
		}
		$existing = get_posts(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'posts_per_page' => 1,
				'fields'         => 'ids',
				'meta_key'       => '_leadwerk_source_checksum',
				'meta_value'     => $checksum,
			)
		);
		if ( $existing ) {
			$existing_file = get_attached_file( (int) $existing[0] );
			if ( $existing_file && is_file( $existing_file ) ) {
				update_post_meta( (int) $existing[0], '_leadwerk_source_path', $relative_path );
				return $this->cache[ $relative_path ] = (int) $existing[0];
			}
		}
		if ( $this->dry_run ) {
			return $this->cache[ $relative_path ] = 0;
		}

		$filename = sanitize_file_name( wp_basename( $absolute ) );
		$uploads = wp_upload_dir();
		if ( ! empty( $uploads['error'] ) ) {
			return new WP_Error( 'leadwerk_media_upload', $uploads['error'] );
		}
		wp_mkdir_p( $uploads['path'] );
		$filename = wp_unique_filename( $uploads['path'], $filename );
		$destination = trailingslashit( $uploads['path'] ) . $filename;
		$staging_dir = trailingslashit( $uploads['basedir'] ) . 'leadwerk-import-staging';
		wp_mkdir_p( $staging_dir );
		$partial = trailingslashit( $staging_dir ) . sha1( $relative_path ) . '-' . $filename . '.part';
		$source_size = filesize( $absolute );
		$partial_size = is_file( $partial ) ? filesize( $partial ) : 0;
		if ( false === $source_size ) {
			return new WP_Error( 'leadwerk_media_size', 'Medya dosya boyutu okunamadi: ' . $relative_path );
		}
		if ( false === $partial_size || $partial_size > $source_size ) {
			@unlink( $partial );
			$partial_size = 0;
		}
		$source_handle = fopen( $absolute, 'rb' );
		$target_handle = fopen( $partial, $partial_size > 0 ? 'ab' : 'wb' );
		if ( ! is_resource( $source_handle ) || ! is_resource( $target_handle ) ) {
			if ( is_resource( $source_handle ) ) {
				fclose( $source_handle );
			}
			if ( is_resource( $target_handle ) ) {
				fclose( $target_handle );
			}
			return new WP_Error( 'leadwerk_media_stream', 'Medya dosyasi icin stream acilamadi: ' . $relative_path );
		}
		if ( $partial_size > 0 && 0 !== fseek( $source_handle, $partial_size ) ) {
			fclose( $source_handle );
			fclose( $target_handle );
			return new WP_Error( 'leadwerk_media_resume', 'Medya kopyalama konumu geri yuklenemedi: ' . $relative_path );
		}
		$copied = $partial_size;
		while ( $copied < $source_size ) {
			$chunk = stream_copy_to_stream( $source_handle, $target_handle, min( 8388608, $source_size - $copied ) );
			if ( false === $chunk || 0 === $chunk ) {
				fclose( $source_handle );
				fclose( $target_handle );
				return new WP_Error( 'leadwerk_media_copy', 'Medya dosyasi kopyalanamadi; sonraki istekte devam edilecek: ' . $relative_path );
			}
			$copied += $chunk;
			fflush( $target_handle );
			if ( connection_aborted() ) {
				fclose( $source_handle );
				fclose( $target_handle );
				return new WP_Error( 'leadwerk_media_interrupted', 'Medya kopyalama yarida kesildi; Devam et ile surdurulecek: ' . $relative_path );
			}
		}
		fclose( $source_handle );
		fclose( $target_handle );
		if ( ! @rename( $partial, $destination ) ) {
			return new WP_Error( 'leadwerk_media_finalize', 'Medya staging dosyasi uploads dizinine tasinamadi: ' . $relative_path );
		}
		$filetype = wp_check_filetype( $filename );
		$id = wp_insert_attachment(
			array(
				'post_title'     => sanitize_text_field( pathinfo( $filename, PATHINFO_FILENAME ) ),
				'post_status'    => 'inherit',
				'post_mime_type' => (string) $filetype['type'],
			),
			$destination
		);
		if ( is_wp_error( $id ) ) {
			@unlink( $destination );
			return $id;
		}
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$metadata = wp_generate_attachment_metadata( $id, $destination );
		if ( is_array( $metadata ) ) {
			wp_update_attachment_metadata( $id, $metadata );
		}
		update_post_meta( $id, '_leadwerk_source_checksum', $checksum );
		update_post_meta( $id, '_leadwerk_source_path', $relative_path );
		update_post_meta( $id, '_leadwerk_source_size', (int) $source_size );
		return $this->cache[ $relative_path ] = (int) $id;
	}

	public function normalize_relative_path( $path ) {
		$path = rawurldecode( html_entity_decode( (string) $path, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
		$path = str_replace( '\\', '/', $path );
		$parts = array();
		foreach ( explode( '/', $path ) as $part ) {
			if ( '' === $part || '.' === $part ) {
				continue;
			}
			if ( '..' === $part ) {
				array_pop( $parts );
				continue;
			}
			$parts[] = $part;
		}
		return implode( '/', $parts );
	}
}
