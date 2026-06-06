<?php
/**
 * IGIENAIR structured section translation synchronizer.
 *
 * @package Leadwerk_WPML_Clone
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Leadwerk_Translation_Sync {

	public static function sync_from_source( $source_post_id, $translated_post_id, $seed_values = null ) {
		$source = function_exists( 'get_field' ) ? get_field( 'igienair_sections', $source_post_id ) : array();
		$source = is_array( $source ) ? $source : array();
		$bundle = Leadwerk_Translation_API::get_translation_bundle( $translated_post_id );
		$translations = array();
		foreach ( (array) ( $bundle['paths'] ?? array() ) as $path => $entry ) {
			$translations[ $path ] = (string) ( $entry['translation'] ?? '' );
		}
		$paths = array();
		self::collect_text_paths( $source, array(), $paths, $translations );
		$bundle = array(
			'field_name' => 'igienair_sections',
			'paths'      => $paths,
			'updated_at' => current_time( 'mysql', true ),
		);
		$translated = self::apply_bundle( $source, $bundle );
		if ( function_exists( 'update_field' ) ) {
			update_field( 'igienair_sections', $translated, $translated_post_id );
		}
		Leadwerk_Translation_API::update_translation_bundle( $translated_post_id, $bundle );
		Leadwerk_Translation_API::update_post_translation_status( $translated_post_id, self::get_bundle_status_from_bundle( $bundle ) );
		return $bundle;
	}

	public static function sync_all_from_source( $source_post_id ) {
		$result = array();
		foreach ( Leadwerk_Translation_API::get_translations( $source_post_id ) as $lang => $post_id ) {
			if ( (int) $post_id !== (int) $source_post_id ) {
				$result[ $lang ] = self::sync_from_source( $source_post_id, $post_id );
			}
		}
		return $result;
	}

	public static function save_translations( $source_post_id, $translated_post_id, $submitted ) {
		$bundle = self::sync_from_source( $source_post_id, $translated_post_id );
		foreach ( (array) ( $bundle['paths'] ?? array() ) as $path => $entry ) {
			$id = (string) ( $entry['id'] ?? '' );
			if ( $id && array_key_exists( $id, (array) $submitted ) ) {
				$value = trim( (string) wp_unslash( $submitted[ $id ] ) );
				$bundle['paths'][ $path ]['translation'] = $value;
				$bundle['paths'][ $path ]['status'] = '' === $value ? 'needs_translation' : 'complete';
			}
		}
		$source = get_field( 'igienair_sections', $source_post_id );
		update_field( 'igienair_sections', self::apply_bundle( is_array( $source ) ? $source : array(), $bundle ), $translated_post_id );
		Leadwerk_Translation_API::update_translation_bundle( $translated_post_id, $bundle );
		Leadwerk_Translation_API::update_post_translation_status( $translated_post_id, self::get_bundle_status_from_bundle( $bundle ) );
		return $bundle;
	}

	public static function get_editor_sections( $source_post_id, $translated_post_id ) {
		$bundle = self::sync_from_source( $source_post_id, $translated_post_id );
		$sections = array();
		foreach ( (array) ( $bundle['paths'] ?? array() ) as $entry ) {
			$top = (int) ( $entry['section'] ?? 0 );
			if ( ! isset( $sections[ $top ] ) ) {
				$sections[ $top ] = array(
					'label'    => 'Sektion ' . ( $top + 1 ),
					'segments' => array(),
				);
			}
			$sections[ $top ]['segments'][] = array(
				'id'          => $entry['id'],
				'label'       => $entry['label'],
				'source'      => $entry['source'],
				'translation' => $entry['translation'],
				'type'        => 'text',
				'status'      => $entry['status'],
				'input_name'  => 'leadwerk_segments[' . $entry['id'] . ']',
			);
		}
		return array_values( $sections );
	}

	public static function get_bundle_status( $bundle_or_post_id ) {
		$bundle = is_array( $bundle_or_post_id )
			? $bundle_or_post_id
			: Leadwerk_Translation_API::get_translation_bundle( absint( $bundle_or_post_id ) );
		return self::get_bundle_status_from_bundle( $bundle );
	}

	public static function can_publish_bundle( $bundle_or_post_id ) {
		return 'complete' === self::get_bundle_status( $bundle_or_post_id );
	}

	public static function sync_bundle_translation_memory() {
		return;
	}

	private static function collect_text_paths( $value, $path, &$paths, $translations ) {
		if ( is_array( $value ) ) {
			foreach ( $value as $key => $child ) {
				self::collect_text_paths( $child, array_merge( $path, array( $key ) ), $paths, $translations );
			}
			return;
		}
		if ( ! is_string( $value ) || '' === trim( $value ) ) {
			return;
		}
		$last = (string) end( $path );
		if ( ! in_array( $last, array( 'text', 'title', 'placeholder', 'aria-label' ), true ) ) {
			return;
		}
		$key = implode( '.', $path );
		$translation = (string) ( $translations[ $key ] ?? '' );
		$paths[ $key ] = array(
			'id'          => 'seg_' . md5( $key ),
			'label'       => $key,
			'section'     => isset( $path[0] ) ? (int) $path[0] : 0,
			'source'      => $value,
			'translation' => $translation,
			'status'      => '' === trim( $translation ) ? 'needs_translation' : 'complete',
		);
	}

	private static function apply_bundle( $source, $bundle ) {
		foreach ( (array) ( $bundle['paths'] ?? array() ) as $path => $entry ) {
			$translation = (string) ( $entry['translation'] ?? '' );
			if ( '' === trim( $translation ) ) {
				continue;
			}
			$keys = explode( '.', $path );
			$cursor =& $source;
			foreach ( $keys as $index => $key ) {
				if ( $index === count( $keys ) - 1 ) {
					$cursor[ $key ] = $translation;
				} else {
					$cursor =& $cursor[ $key ];
				}
			}
			unset( $cursor );
		}
		return $source;
	}

	private static function get_bundle_status_from_bundle( $bundle ) {
		$paths = (array) ( $bundle['paths'] ?? array() );
		if ( empty( $paths ) ) {
			return 'not_translated';
		}
		foreach ( $paths as $entry ) {
			if ( 'complete' !== (string) ( $entry['status'] ?? '' ) ) {
				return 'needs_translation';
			}
		}
		return 'complete';
	}
}
