<?php
/**
 * IGIENAIR structured content contract.
 *
 * @package Leadwerk_Fields
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Leadwerk_Content_Schema {

	const FIELD_NAME = 'igienair_sections';

	/**
	 * Tags accepted by the importer and renderer.
	 *
	 * @return string[]
	 */
	public static function allowed_tags() {
		return array(
			'a', 'abbr', 'address', 'article', 'aside', 'audio', 'b', 'blockquote',
			'br', 'button', 'caption', 'cite', 'code', 'col', 'colgroup', 'dd',
			'details', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'form',
			'fieldset', 'header', 'legend', 'meta', 'sub', 'h1', 'h2', 'h3',
			'h4', 'h5', 'h6', 'hr', 'i', 'iframe', 'img',
			'input', 'label', 'li', 'main', 'nav', 'ol', 'option', 'p', 'picture',
			'section', 'select', 'small', 'source', 'span', 'strong', 'summary',
			'sup', 'svg', 'g', 'path', 'polygon', 'polyline', 'circle', 'rect',
			'line', 'use', 'title', 'defs', 'clippath', 'table', 'tbody', 'td',
			'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'ul', 'video',
		);
	}

	/**
	 * Attributes accepted on structured nodes.
	 *
	 * @return string[]
	 */
	public static function allowed_attributes() {
		return array(
			'id', 'class', 'style', 'title', 'role', 'name', 'value', 'type', 'alt',
			'placeholder', 'for', 'method', 'action', 'target', 'rel', 'width',
			'height', 'loading', 'decoding', 'fetchpriority', 'controls',
			'autoplay', 'muted', 'loop', 'playsinline', 'open', 'required',
			'checked', 'selected', 'disabled', 'tabindex', 'download',
			'allow', 'allowfullscreen', 'referrerpolicy', 'href', 'src', 'srcset',
			'poster', 'viewbox', 'preserveaspectratio', 'xmlns', 'd', 'fill',
			'stroke', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'x2', 'y1',
			'y2', 'points', 'transform', 'stroke-width', 'stroke-linecap',
			'stroke-linejoin', 'focusable', 'itemscope', 'itemprop', 'itemtype', 'content',
			'novalidate', 'min', 'max', 'step', 'preload', 'rows', 'cols',
		);
	}

	/**
	 * Whether a page belongs to the IGIENAIR content model.
	 *
	 * @param WP_Post|int $post Post or ID.
	 * @return bool
	 */
	public static function supports_post( $post ) {
		$post = get_post( $post );
		if ( ! $post instanceof WP_Post || 'page' !== $post->post_type ) {
			return false;
		}
		return 0 === strpos( (string) get_post_meta( $post->ID, 'leadwerk_source_key', true ), 'igienair-' );
	}

	/**
	 * Recursively sanitize structured content.
	 *
	 * @param mixed $value Input.
	 * @return mixed
	 */
	public static function sanitize_value( $value ) {
		if ( is_string( $value ) ) {
			return wp_check_invalid_utf8( $value, true );
		}
		if ( is_bool( $value ) || is_int( $value ) || is_float( $value ) || null === $value ) {
			return $value;
		}
		if ( ! is_array( $value ) ) {
			return '';
		}

		$clean = array();
		foreach ( $value as $key => $item ) {
			$key = is_int( $key ) ? $key : sanitize_key( (string) $key );
			$clean[ $key ] = self::sanitize_value( $item );
		}
		return $clean;
	}

	/**
	 * Validate the top-level section payload.
	 *
	 * @param mixed $sections Sections.
	 * @return true|WP_Error
	 */
	public static function validate_sections( $sections ) {
		if ( ! is_array( $sections ) ) {
			return new WP_Error( 'leadwerk_sections_type', 'Sektionen muessen ein JSON-Array sein.' );
		}
		foreach ( $sections as $index => $section ) {
			if ( ! is_array( $section ) || empty( $section['node'] ) || ! is_array( $section['node'] ) ) {
				return new WP_Error( 'leadwerk_section_node', sprintf( 'Sektion %d enthaelt keinen gueltigen node.', $index + 1 ) );
			}
			$result = self::validate_node( $section['node'] );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}
		return true;
	}

	/**
	 * Validate one recursive DOM node.
	 *
	 * @param array<string,mixed> $node Node.
	 * @return true|WP_Error
	 */
	private static function validate_node( $node ) {
		if ( isset( $node['component'] ) ) {
			return in_array( $node['component'], array( 'wpforms_quote', 'wpforms_home_quote', 'wpforms_offer_quote' ), true )
				? true
				: new WP_Error( 'leadwerk_node_component', 'Unbekannte Komponente.' );
		}
		if ( isset( $node['text'] ) ) {
			return is_string( $node['text'] ) ? true : new WP_Error( 'leadwerk_node_text', 'Text node is invalid.' );
		}
		$tag = sanitize_key( (string) ( $node['tag'] ?? '' ) );
		if ( ! in_array( $tag, self::allowed_tags(), true ) ) {
			return new WP_Error( 'leadwerk_node_tag', 'Nicht erlaubtes HTML-Element: ' . $tag );
		}
		foreach ( (array) ( $node['attrs'] ?? array() ) as $name => $value ) {
			$name = strtolower( (string) $name );
			if (
				0 === strpos( $name, 'on' )
				|| (
					! in_array( $name, self::allowed_attributes(), true )
					&& 0 !== strpos( $name, 'data-' )
					&& 0 !== strpos( $name, 'aria-' )
				)
			) {
				return new WP_Error( 'leadwerk_node_attribute', 'Nicht erlaubtes HTML-Attribut: ' . $name );
			}
			if ( ! is_scalar( $value ) && ! is_array( $value ) && null !== $value ) {
				return new WP_Error( 'leadwerk_node_attribute_value', 'Ungueltiger Attributwert: ' . $name );
			}
		}
		foreach ( (array) ( $node['children'] ?? array() ) as $child ) {
			if ( ! is_array( $child ) ) {
				return new WP_Error( 'leadwerk_node_child', 'Ungueltiger Kindknoten.' );
			}
			$result = self::validate_node( $child );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}
		return true;
	}
}
