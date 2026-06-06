<?php
/**
 * IGIENAIR static-site importer.
 *
 * @package Leadwerk_Importer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Leadwerk_Importer {
	private $dry_run;
	private $manifest;
	private $source_root;
	private $media;
	private $file_map = array();

	public function __construct( $apply = false ) {
		$this->dry_run = ! $apply;
		$this->source_root = LEADWERK_IMPORTER_PATH . 'source_assets/';
		$this->manifest = $this->load_manifest();
		$this->manifest['pages'] = $this->sort_pages_parent_first( (array) ( $this->manifest['pages'] ?? array() ) );
		$this->media = new Leadwerk_Media_Importer( $this->source_root, $this->dry_run );
		foreach ( (array) ( $this->manifest['pages'] ?? array() ) as $page ) {
			$this->file_map[ $this->normalize_path( (string) $page['source_file'] ) ] = (string) $page['source_key'];
		}
	}

	private function load_manifest() {
		$file = LEADWERK_IMPORTER_PATH . 'manifest/mapping.json';
		$data = is_file( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : null;
		return is_array( $data ) ? $data : array( 'pages' => array() );
	}

	private function sort_pages_parent_first( $pages ) {
		$depths = array();
		$by_key = array();
		foreach ( $pages as $page ) {
			$by_key[ sanitize_key( (string) ( $page['source_key'] ?? '' ) ) ] = $page;
		}
		$get_depth = static function ( $page ) use ( &$get_depth, &$depths, $by_key ) {
			$key = sanitize_key( (string) ( $page['source_key'] ?? '' ) );
			if ( isset( $depths[ $key ] ) ) {
				return $depths[ $key ];
			}
			$parent_key = sanitize_key( (string) ( $page['parent_source_key'] ?? '' ) );
			$depths[ $key ] = $parent_key && isset( $by_key[ $parent_key ] )
				? 1 + $get_depth( $by_key[ $parent_key ] )
				: 0;
			return $depths[ $key ];
		};
		usort(
			$pages,
			static function ( $left, $right ) use ( $get_depth ) {
				$depth_compare = $get_depth( $left ) <=> $get_depth( $right );
				return 0 !== $depth_compare
					? $depth_compare
					: strcmp( (string) ( $left['source_file'] ?? '' ), (string) ( $right['source_file'] ?? '' ) );
			}
		);
		return array_values( $pages );
	}

	public function preflight() {
		$errors = array();
		$warnings = array();
		$expected_pages = (int) ( $this->manifest['page_count'] ?? 0 );
		if ( 'IGIENAIR' !== (string) ( $this->manifest['project'] ?? '' ) || 176 !== $expected_pages || $expected_pages !== count( (array) ( $this->manifest['pages'] ?? array() ) ) ) {
			$errors[] = 'IGIENAIR manifesti gecersiz veya 176 sayfa icermiyor.';
		}
		if ( ! class_exists( 'DOMDocument' ) ) {
			$errors[] = 'PHP DOM extension gerekli.';
		}
		if ( version_compare( PHP_VERSION, '7.4', '<' ) ) {
			$errors[] = 'PHP 7.4 veya daha yeni bir surum gerekli. Mevcut: ' . PHP_VERSION;
		}
		if ( ! is_readable( $this->source_root ) || ! is_readable( $this->source_root . 'pages/' ) ) {
			$errors[] = 'Importer source_assets paketi okunabilir degil veya eksik.';
		}
		if ( defined( 'ACF_VERSION' ) || function_exists( 'acf_get_field_groups' ) ) {
			$errors[] = 'ACF/ACF Pro aktif. Leadwerk Fields ile birlikte kullanilamaz.';
		}
		if ( ! function_exists( 'update_field' ) || ! class_exists( 'Leadwerk_Content_Schema' ) ) {
			$errors[] = 'Leadwerk Fields aktif degil.';
		}
		$uploads = wp_upload_dir();
		if ( ! empty( $uploads['error'] ) || ! wp_is_writable( $uploads['basedir'] ) ) {
			$errors[] = 'WordPress uploads dizini yazilabilir degil.';
		}
		if ( ! shortcode_exists( 'wpforms' ) ) {
			$warnings[] = 'WPForms aktif degil; teklif formu baglanana kadar fallback gorunecek.';
		}
		$upload_limit = wp_max_upload_size();
		if ( $upload_limit > 0 ) {
			$warnings[] = 'Sunucu upload limiti ' . size_format( $upload_limit ) . '; importer buyuk dosyalari diskten stream ile kopyalar.';
		}
		$memory_limit = wp_convert_hr_to_bytes( ini_get( 'memory_limit' ) );
		if ( $memory_limit > 0 && $memory_limit < 268435456 ) {
			$warnings[] = 'PHP memory_limit dusuk: ' . size_format( $memory_limit ) . '. En az 256 MB onerilir.';
		}
		$max_execution_time = (int) ini_get( 'max_execution_time' );
		if ( $max_execution_time > 0 && $max_execution_time < 120 ) {
			$warnings[] = 'PHP max_execution_time dusuk: ' . $max_execution_time . ' saniye. Importer batch basina tek sayfa isleyecek.';
		}
		if ( function_exists( 'disk_free_space' ) ) {
			$free_space = @disk_free_space( $uploads['basedir'] );
			if ( false !== $free_space && $free_space < 1073741824 ) {
				$warnings[] = 'Uploads diski icin 1 GB altinda bos alan kalmis: ' . size_format( $free_space );
			}
		}
		foreach ( (array) ( $this->manifest['pages'] ?? array() ) as $page ) {
			$file = $this->source_root . 'pages/' . $page['source_file'];
			if ( ! is_file( $file ) ) {
				$errors[] = 'HTML kaynagi eksik: ' . $page['source_file'];
			}
			foreach ( (array) ( $page['dependencies'] ?? array() ) as $dependency ) {
				if ( ! is_file( $this->source_root . $dependency ) ) {
					$errors[] = 'Asset eksik: ' . $dependency;
				}
			}
		}
		$orphans = $this->find_orphans();
		if ( $orphans['pages'] || $orphans['media'] ) {
			$warnings[] = sprintf( 'Silinmeyen orphan kayitlari: %d sayfa, %d medya.', count( $orphans['pages'] ), count( $orphans['media'] ) );
		}
		return array( 'errors' => array_values( array_unique( $errors ) ), 'warnings' => array_values( array_unique( $warnings ) ) );
	}

	public function start_job() {
		$preflight = $this->preflight();
		$state = Leadwerk_Logger::reset( $this->dry_run, count( (array) $this->manifest['pages'] ) );
		$state['warnings'] = $preflight['warnings'];
		if ( $preflight['errors'] ) {
			$state['errors'] = $preflight['errors'];
			$state['status'] = 'failed';
		}
		return Leadwerk_Logger::set( $state );
	}

	public function run_batch( $limit = 5 ) {
		$state = Leadwerk_Logger::get();
		if ( empty( $state ) || (bool) ( $state['dry_run'] ?? true ) !== $this->dry_run ) {
			$state = $this->start_job();
		}
		if ( 'running' !== (string) ( $state['status'] ?? '' ) ) {
			return $state;
		}
		$pages = (array) $this->manifest['pages'];
		$end = min( count( $pages ), (int) $state['cursor'] + max( 1, (int) $limit ) );
		for ( $index = (int) $state['cursor']; $index < $end; $index++ ) {
			$state['current_file'] = (string) $pages[ $index ]['source_file'];
			$state['last_http_at'] = current_time( 'mysql', true );
			Leadwerk_Logger::set( $state );
			$result = $this->import_page( $pages[ $index ] );
			if ( is_wp_error( $result ) ) {
				Leadwerk_Logger::message( $state, $pages[ $index ]['source_file'] . ': ' . $result->get_error_message(), 'error' );
				if ( in_array( $result->get_error_code(), array( 'leadwerk_media_interrupted', 'leadwerk_media_copy', 'leadwerk_media_stream', 'leadwerk_media_resume', 'leadwerk_media_finalize' ), true ) ) {
					$state['status'] = 'paused';
					$state['last_error'] = $result->get_error_message();
					break;
				}
			} else {
				$state['success']++;
			}
			$state['processed']++;
			$state['cursor'] = $index + 1;
		}
		if ( $state['cursor'] >= count( $pages ) ) {
			$state['status'] = $state['errors'] ? 'completed_with_errors' : 'completed';
			$state['finished_at'] = current_time( 'mysql', true );
			if ( ! $this->dry_run ) {
				$this->finalize_site();
			}
		}
		if ( 'running' === (string) $state['status'] ) {
			$state['current_file'] = isset( $pages[ $state['cursor'] ]['source_file'] ) ? (string) $pages[ $state['cursor'] ]['source_file'] : '';
		}
		return Leadwerk_Logger::set( $state );
	}

	public function get_recommended_batch_size() {
		return $this->dry_run ? 2 : 1;
	}

	private function import_page( $config ) {
		$source_key = sanitize_key( (string) $config['source_key'] );
		$existing = get_posts(
			array(
				'post_type'      => 'page',
				'post_status'    => 'any',
				'posts_per_page' => 1,
				'fields'         => 'ids',
				'meta_key'       => 'leadwerk_source_key',
				'meta_value'     => $source_key,
			)
		);
		$post_id = $existing ? (int) $existing[0] : 0;
		$path = (string) $config['path'];
		$collision = '' !== $path ? get_page_by_path( $path, OBJECT, 'page' ) : null;
		if ( ! $post_id && $collision instanceof WP_Post ) {
			$collision_source_key = sanitize_key( (string) get_post_meta( $collision->ID, 'leadwerk_source_key', true ) );
			if ( $collision_source_key && $collision_source_key !== $source_key ) {
				return new WP_Error( 'leadwerk_page_collision', 'Mevcut baska bir importer sayfasi ile yol cakismasi: /' . $path . '/' );
			}
			$post_id = (int) $collision->ID;
			if ( ! $collision_source_key && ! $this->dry_run ) {
				update_post_meta( $post_id, 'leadwerk_preimport_content_backup', (string) $collision->post_content );
			}
		}
		$parent_id = 0;
		if ( ! empty( $config['parent_source_key'] ) ) {
			$parent = get_posts(
				array(
					'post_type'      => 'page',
					'post_status'    => 'any',
					'posts_per_page' => 1,
					'fields'         => 'ids',
					'meta_key'       => 'leadwerk_source_key',
					'meta_value'     => sanitize_key( $config['parent_source_key'] ),
				)
			);
			if ( ! $parent && ! $this->dry_run ) {
				return new WP_Error( 'leadwerk_parent_missing', 'Parent sayfa bulunamadi: ' . $config['parent_source_key'] );
			}
			$parent_id = $parent ? (int) $parent[0] : 0;
		}
		$file = $this->source_root . 'pages/' . $config['source_file'];
		$sections = $this->parse_sections( $file, (string) $config['source_file'] );
		if ( is_wp_error( $sections ) ) {
			return $sections;
		}
		$valid = Leadwerk_Content_Schema::validate_sections( $sections );
		if ( is_wp_error( $valid ) ) {
			return $valid;
		}
		if ( $this->dry_run ) {
			return true;
		}
		$postarr = array(
			'ID'          => $post_id,
			'post_type'   => 'page',
			'post_status' => 'publish',
			'post_title'  => wp_strip_all_tags( (string) $config['title'] ),
			'post_name'   => sanitize_title( (string) $config['slug'] ),
			'post_parent' => $parent_id,
			'post_content'=> '',
		);
		$result = $post_id ? wp_update_post( $postarr, true ) : wp_insert_post( $postarr, true );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$post_id = (int) $result;
		update_post_meta( $post_id, 'leadwerk_source_key', $source_key );
		update_post_meta( $post_id, 'leadwerk_source_file', sanitize_text_field( $config['source_file'] ) );
		update_post_meta( $post_id, 'leadwerk_source_checksum', sanitize_text_field( $config['checksum'] ) );
		update_post_meta( $post_id, 'leadwerk_lang', 'de' );
		update_post_meta( $post_id, 'leadwerk_body_class', sanitize_text_field( $config['body_class'] ) );
		update_post_meta( $post_id, 'leadwerk_meta_description', sanitize_text_field( $config['meta_description'] ) );
		update_post_meta(
			$post_id,
			'leadwerk_document_title',
			sanitize_text_field( $config['document_title'] ?? $config['title'] )
		);
		update_post_meta( $post_id, 'leadwerk_canonical', esc_url_raw( $config['canonical'] ) );
		update_post_meta( $post_id, 'leadwerk_robots', sanitize_text_field( $config['robots'] ) );
		update_post_meta( $post_id, '_yoast_wpseo_title', sanitize_text_field( $config['document_title'] ?? $config['title'] ) );
		update_post_meta( $post_id, '_yoast_wpseo_metadesc', sanitize_text_field( $config['meta_description'] ) );
		update_post_meta( $post_id, '_yoast_wpseo_canonical', esc_url_raw( $config['canonical'] ) );
		if ( false !== stripos( (string) $config['robots'], 'noindex' ) ) {
			update_post_meta( $post_id, '_yoast_wpseo_meta-robots-noindex', '1' );
		} else {
			delete_post_meta( $post_id, '_yoast_wpseo_meta-robots-noindex' );
		}
		update_field( Leadwerk_Content_Schema::FIELD_NAME, Leadwerk_Content_Schema::sanitize_value( $sections ), $post_id );
		if ( class_exists( 'Leadwerk_Translation_API' ) ) {
			Leadwerk_Translation_API::ensure_post_record(
				$post_id,
				array(
					'language_code' => 'de',
					'source_key'    => $source_key,
					'public_slug'   => (string) $config['path'],
					'is_home'       => ! empty( $config['is_front_page'] ),
				)
			);
		}
		return $post_id;
	}

	private function parse_sections( $file, $source_file ) {
		libxml_use_internal_errors( true );
		$dom = new DOMDocument( '1.0', 'UTF-8' );
		$html = (string) file_get_contents( $file );
		$loaded = $dom->loadHTML( '<?xml encoding="utf-8" ?>' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD );
		libxml_clear_errors();
		if ( ! $loaded ) {
			return new WP_Error( 'leadwerk_html_parse', 'HTML ayrıştırılamadı.' );
		}
		$xpath = new DOMXPath( $dom );
		$main = $xpath->query( '//main' )->item( 0 );
		if ( ! $main instanceof DOMElement ) {
			return new WP_Error( 'leadwerk_main_missing', '<main> bulunamadi.' );
		}
		$sections = array();
		foreach ( $main->childNodes as $child ) {
			if ( XML_TEXT_NODE === $child->nodeType && '' === trim( $child->nodeValue ) ) {
				continue;
			}
			if ( ! $child instanceof DOMElement ) {
				continue;
			}
			$node = $this->parse_node( $child, $source_file );
			if ( is_wp_error( $node ) ) {
				return $node;
			}
			$classes = preg_split( '/\s+/', trim( $child->getAttribute( 'class' ) ) );
			$sections[] = array(
				'type'    => sanitize_key( $classes[0] ?? $child->tagName ),
				'variant' => array_values( array_filter( array_map( 'sanitize_key', $classes ) ) ),
				'node'    => $node,
			);
		}
		return $sections;
	}

	private function parse_node( $node, $source_file ) {
		if ( XML_TEXT_NODE === $node->nodeType ) {
			return array( 'text' => (string) $node->nodeValue );
		}
		if ( ! $node instanceof DOMElement ) {
			return array( 'text' => '' );
		}
		$tag = strtolower( $node->tagName );
		if ( 'script' === $tag || 'noscript' === $tag ) {
			return array( 'text' => '' );
		}
		if ( ! in_array( $tag, Leadwerk_Content_Schema::allowed_tags(), true ) ) {
			return new WP_Error( 'leadwerk_unsupported_tag', 'Desteklenmeyen element: ' . $tag . ' (' . $source_file . ')' );
		}
		if ( 'form' === $tag && false !== strpos( $node->getAttribute( 'class' ), 'quote-form' ) ) {
			$component = false !== strpos( $node->getAttribute( 'class' ), 'quote-form--offer' )
				? 'wpforms_offer_quote'
				: 'wpforms_home_quote';
			return array( 'component' => $component );
		}
		$result = array( 'tag' => $tag, 'attrs' => array(), 'children' => array() );
		foreach ( $node->attributes as $attribute ) {
			$name = strtolower( $attribute->name );
			if ( 0 === strpos( $name, 'on' ) ) {
				continue;
			}
			if ( ! in_array( $name, Leadwerk_Content_Schema::allowed_attributes(), true ) && 0 !== strpos( $name, 'data-' ) && 0 !== strpos( $name, 'aria-' ) ) {
				continue;
			}
			$value = (string) $attribute->value;
			if ( in_array( $name, array( 'href', 'src', 'poster' ), true ) ) {
				$parsed_attribute = $this->parse_url_attribute( $value, $source_file, 'href' === $name );
				if ( is_wp_error( $parsed_attribute ) ) {
					return $parsed_attribute;
				}
				$result['attrs'][ $name ] = $parsed_attribute;
			} elseif ( in_array( $name, array( 'data-cert-img', 'data-cert-pdf' ), true ) ) {
				$asset_path = $this->normalize_path( ltrim( rawurldecode( $value ), '/' ) );
				$id = $this->media->import( $asset_path );
				if ( is_wp_error( $id ) ) {
					return $id;
				}
				$result['attrs'][ $name ] = array( 'type' => 'media', 'id' => (int) $id, 'path' => $asset_path );
			} elseif ( 'srcset' === $name ) {
				$parsed_attribute = $this->parse_srcset( $value, $source_file );
				if ( is_wp_error( $parsed_attribute ) ) {
					return $parsed_attribute;
				}
				$result['attrs'][ $name ] = $parsed_attribute;
			} elseif ( 'style' === $name ) {
				$parsed_attribute = $this->parse_style( $value, $source_file );
				if ( is_wp_error( $parsed_attribute ) ) {
					return $parsed_attribute;
				}
				$result['attrs'][ $name ] = $parsed_attribute;
			} else {
				$result['attrs'][ $name ] = $value;
			}
		}
		foreach ( $node->childNodes as $child ) {
			$parsed = $this->parse_node( $child, $source_file );
			if ( is_wp_error( $parsed ) ) {
				return $parsed;
			}
			if ( isset( $parsed['text'] ) && '' === $parsed['text'] ) {
				continue;
			}
			$result['children'][] = $parsed;
		}
		return $result;
	}

	private function parse_url_attribute( $value, $source_file, $is_link ) {
		$value = trim( html_entity_decode( $value, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
		if ( '' === $value || 0 === strpos( $value, '#' ) || preg_match( '#^(?:https?:|mailto:|tel:|//)#i', $value ) ) {
			return array( 'type' => 'url', 'value' => $this->safe_url( $value ) );
		}
		$parts = explode( '#', $value, 2 );
		$clean = preg_replace( '/[?#].*$/', '', $parts[0] );
		$resolved = $this->resolve_relative( $source_file, $clean );
		if ( $is_link && preg_match( '/\.html?$/i', $resolved ) && isset( $this->file_map[ $resolved ] ) ) {
			return array( 'type' => 'page', 'source_key' => $this->file_map[ $resolved ], 'fragment' => isset( $parts[1] ) ? sanitize_title( $parts[1] ) : '' );
		}
		if ( ! $is_link ) {
			$id = $this->media->import( $resolved );
			return is_wp_error( $id ) ? $id : array( 'type' => 'media', 'id' => (int) $id, 'path' => $resolved );
		}
		$id = $this->media->import( $resolved );
		return is_wp_error( $id ) ? $id : array( 'type' => 'media', 'id' => (int) $id, 'path' => $resolved );
	}

	private function parse_srcset( $value, $source_file ) {
		$items = array();
		foreach ( explode( ',', $value ) as $item ) {
			$parts = preg_split( '/\s+/', trim( $item ), 2 );
			$source = $this->parse_url_attribute( $parts[0], $source_file, false );
			if ( is_wp_error( $source ) ) {
				return $source;
			}
			$items[] = array( 'source' => $source, 'descriptor' => sanitize_text_field( $parts[1] ?? '' ) );
		}
		return array( 'type' => 'srcset', 'items' => $items );
	}

	private function parse_style( $style, $source_file ) {
		$error = null;
		$parsed = preg_replace_callback(
			'/url\(\s*([\'"]?)([^\'")]+)\1\s*\)/i',
			function ( $match ) use ( $source_file, &$error ) {
				$asset = $this->parse_url_attribute( $match[2], $source_file, false );
				if ( is_wp_error( $asset ) ) {
					$error = $asset;
					return $match[0];
				}
				return 'url("leadwerk-media://' . (int) ( $asset['id'] ?? 0 ) . '")';
			},
			(string) $style
		);
		return $error ? $error : $parsed;
	}

	private function safe_url( $url ) {
		if ( '' === $url || 0 === strpos( $url, '#' ) ) {
			return $url;
		}
		return esc_url_raw( $url, array( 'http', 'https', 'mailto', 'tel' ) );
	}

	private function resolve_relative( $source_file, $relative ) {
		return $this->normalize_path( dirname( $source_file ) . '/' . rawurldecode( $relative ) );
	}

	private function normalize_path( $path ) {
		$parts = array();
		foreach ( explode( '/', str_replace( '\\', '/', $path ) ) as $part ) {
			if ( '' === $part || '.' === $part ) {
				continue;
			}
			if ( '..' === $part ) {
				array_pop( $parts );
			} else {
				$parts[] = $part;
			}
		}
		return implode( '/', $parts );
	}

	private function finalize_site() {
		$front = get_posts(
			array(
				'post_type'      => 'page',
				'post_status'    => 'publish',
				'posts_per_page' => 1,
				'fields'         => 'ids',
				'meta_key'       => 'leadwerk_source_key',
				'meta_value'     => 'igienair-home',
			)
		);
		if ( $front ) {
			update_option( 'show_on_front', 'page' );
			update_option( 'page_on_front', (int) $front[0] );
		}
		update_option( 'blogname', 'IGIENAIR GmbH' );
		$this->seed_theme_options();
		flush_rewrite_rules( false );
	}

	private function seed_theme_options() {
		if ( ! class_exists( 'Leadwerk_Fields_API' ) ) {
			return;
		}
		$values = array(
			'company_address' => "Am Hardtwald 6-8\n76275 Ettlingen",
			'company_phone'   => '+49 (0) 7243 3699101',
			'company_fax'     => '+49 (0) 7243 3694 943',
			'company_email'   => 'kontakt@igienair.com',
			'linkedin_url'    => 'https://www.linkedin.com/company/igienair',
			'youtube_url'     => 'https://www.youtube.com/@igienairgmbh5857',
		);
		foreach ( $values as $key => $value ) {
			$current = Leadwerk_Fields_API::get_field( $key, 'option' );
			if ( null === $current || '' === $current ) {
				Leadwerk_Fields_API::update_field( $key, $value, 'option' );
			}
		}
		$logos = array(
			'header_logo'       => 'Bildmaterial_final/logos/logo.svg',
			'header_logo_light' => 'Bildmaterial_final/logos/logo-weiss.svg',
			'footer_logo'       => 'Bildmaterial_final/logos/logo-weiss.svg',
		);
		foreach ( $logos as $key => $path ) {
			if ( absint( Leadwerk_Fields_API::get_field( $key, 'option' ) ) ) {
				continue;
			}
			$attachment_id = $this->media->import( $path );
			if ( ! is_wp_error( $attachment_id ) && $attachment_id ) {
				Leadwerk_Fields_API::update_field( $key, (int) $attachment_id, 'option' );
			}
		}
		$site_icon_id = absint( get_option( 'site_icon', 0 ) );
		$site_icon_metadata = $site_icon_id ? wp_get_attachment_metadata( $site_icon_id ) : array();
		$site_icon_valid = $site_icon_id
			&& get_post( $site_icon_id )
			&& in_array( (string) get_post_mime_type( $site_icon_id ), array( 'image/png', 'image/jpeg', 'image/webp' ), true )
			&& is_array( $site_icon_metadata )
			&& absint( $site_icon_metadata['width'] ?? 0 ) >= 512
			&& absint( $site_icon_metadata['height'] ?? 0 ) >= 512;
		if ( ! $site_icon_valid ) {
			$site_icon_id = $this->media->import( 'Bildmaterial_final/logos/favicon-512.png' );
			if ( ! is_wp_error( $site_icon_id ) && $site_icon_id ) {
				update_post_meta( (int) $site_icon_id, '_wp_attachment_image_alt', 'IGIENAIR' );
				update_option( 'site_icon', (int) $site_icon_id );
				Leadwerk_Fields_API::update_field( 'site_icon', (int) $site_icon_id, 'option' );
			}
		}
		$legacy_form = trim( (string) Leadwerk_Fields_API::get_field( 'wpforms_quote_form', 'option' ) );
		$form_option_keys = array( 'wpforms_home_quote_form', 'wpforms_offer_form' );
		foreach ( $form_option_keys as $form_option_key ) {
			$current_form = trim( (string) Leadwerk_Fields_API::get_field( $form_option_key, 'option' ) );
			if ( '' === $current_form && '' !== $legacy_form ) {
				Leadwerk_Fields_API::update_field( $form_option_key, $legacy_form, 'option' );
			}
		}
		$home_form = trim( (string) Leadwerk_Fields_API::get_field( 'wpforms_home_quote_form', 'option' ) );
		$offer_form = trim( (string) Leadwerk_Fields_API::get_field( 'wpforms_offer_form', 'option' ) );
		if ( ( '' === $home_form || '' === $offer_form ) && post_type_exists( 'wpforms' ) ) {
			$forms = get_posts(
				array(
					'post_type'      => 'wpforms',
					'post_status'    => 'publish',
					'posts_per_page' => -1,
					'orderby'        => 'ID',
					'order'          => 'ASC',
				)
			);
			$home_selected = null;
			$offer_selected = null;
			foreach ( $forms as $form ) {
				$title = (string) $form->post_title;
				if ( ! $home_selected && preg_match( '/startseite|home|kurz|quick/i', $title ) ) {
					$home_selected = $form;
				}
				if ( ! $offer_selected && preg_match( '/angebot|anfrage|quote|ausf.hrlich|detail/i', $title ) ) {
					$offer_selected = $form;
				}
			}
			if ( 1 === count( $forms ) ) {
				$home_selected = $home_selected ?: $forms[0];
				$offer_selected = $offer_selected ?: $forms[0];
			} elseif ( count( $forms ) > 1 ) {
				$home_selected = $home_selected ?: $forms[0];
				$offer_selected = $offer_selected ?: ( $forms[1] ?? $forms[0] );
			}
			if ( '' === $home_form && $home_selected instanceof WP_Post ) {
				Leadwerk_Fields_API::update_field( 'wpforms_home_quote_form', (string) $home_selected->ID, 'option' );
			}
			if ( '' === $offer_form && $offer_selected instanceof WP_Post ) {
				Leadwerk_Fields_API::update_field( 'wpforms_offer_form', (string) $offer_selected->ID, 'option' );
			}
		}
	}

	private function find_orphans() {
		$source_keys = array_map(
			static function ( $page ) {
				return sanitize_key( (string) ( $page['source_key'] ?? '' ) );
			},
			(array) ( $this->manifest['pages'] ?? array() )
		);
		$dependencies = array();
		foreach ( (array) ( $this->manifest['pages'] ?? array() ) as $page ) {
			$dependencies = array_merge( $dependencies, (array) ( $page['dependencies'] ?? array() ) );
		}
		$dependencies = array_unique( array_map( array( $this, 'normalize_path' ), $dependencies ) );
		$page_ids = get_posts(
			array(
				'post_type'      => 'page',
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'meta_key'       => 'leadwerk_source_key',
				'meta_compare'   => 'EXISTS',
			)
		);
		$media_ids = get_posts(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'meta_key'       => '_leadwerk_source_path',
				'meta_compare'   => 'EXISTS',
			)
		);
		return array(
			'pages' => array_values(
				array_filter(
					$page_ids,
					static function ( $id ) use ( $source_keys ) {
						return ! in_array( sanitize_key( (string) get_post_meta( $id, 'leadwerk_source_key', true ) ), $source_keys, true );
					}
				)
			),
			'media' => array_values(
				array_filter(
					$media_ids,
					static function ( $id ) use ( $dependencies ) {
						return ! in_array( (string) get_post_meta( $id, '_leadwerk_source_path', true ), $dependencies, true );
					}
				)
			),
		);
	}
}
