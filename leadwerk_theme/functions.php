<?php
/**
 * IGIENAIR WordPress theme.
 *
 * @package Leadwerk_Theme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'LEADWERK_THEME_VERSION', '2.9.3' );
define( 'LEADWERK_THEME_DIR', get_template_directory() );
define( 'LEADWERK_THEME_URI', get_template_directory_uri() );

function leadwerk_theme_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
	register_nav_menus( array( 'primary' => 'IGIENAIR Hauptnavigation' ) );
}
add_action( 'after_setup_theme', 'leadwerk_theme_setup' );

function leadwerk_theme_enqueue_assets() {
	wp_enqueue_style(
		'leadwerk-theme',
		get_stylesheet_uri(),
		array(),
		LEADWERK_THEME_VERSION
	);
	wp_enqueue_style(
		'leadwerk-igienair',
		LEADWERK_THEME_URI . '/assets/css/site.css',
		array( 'leadwerk-theme' ),
		(string) filemtime( LEADWERK_THEME_DIR . '/assets/css/site.css' )
	);
	wp_enqueue_script(
		'leadwerk-igienair',
		LEADWERK_THEME_URI . '/assets/js/site.js',
		array(),
		(string) filemtime( LEADWERK_THEME_DIR . '/assets/js/site.js' ),
		true
	);
	wp_add_inline_script(
		'leadwerk-igienair',
		'document.addEventListener("click",function(e){var b=e.target.closest("[data-leadwerk-consent-embed]");if(!b)return;var w=b.parentNode,i=document.createElement("iframe");i.src=b.dataset.src;i.loading="lazy";i.referrerPolicy="strict-origin-when-cross-origin";i.allowFullscreen=true;i.title=b.dataset.title||"Externer Inhalt";w.replaceChildren(i);});'
	);
}
add_action( 'wp_enqueue_scripts', 'leadwerk_theme_enqueue_assets' );

function leadwerk_theme_body_classes( $classes ) {
	if ( is_404() ) {
		$classes[] = 'page-404';
	}
	if ( is_singular( 'page' ) ) {
		$stored = preg_split( '/\s+/', (string) get_post_meta( get_queried_object_id(), 'leadwerk_body_class', true ) );
		foreach ( $stored as $class ) {
			$class = sanitize_html_class( $class );
			if ( $class ) {
				$classes[] = $class;
			}
		}
	}
	return array_values( array_unique( $classes ) );
}
add_filter( 'body_class', 'leadwerk_theme_body_classes' );

function leadwerk_theme_get_post_by_source_key( $source_key, $lang = 'de' ) {
	if ( class_exists( 'Leadwerk_Translation_API' ) ) {
		$post = Leadwerk_Translation_API::get_post_by_source_key( $source_key, $lang, 'page' );
		if ( $post instanceof WP_Post ) {
			return $post;
		}
	}
	$ids = get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => 'publish',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_query'     => array(
				array( 'key' => 'leadwerk_source_key', 'value' => sanitize_key( $source_key ) ),
				array( 'key' => 'leadwerk_lang', 'value' => sanitize_key( $lang ) ),
			),
		)
	);
	return $ids ? get_post( (int) $ids[0] ) : null;
}

function leadwerk_theme_page_url( $source_key, $fragment = '' ) {
	$lang = class_exists( 'Leadwerk_Translation_API' ) ? Leadwerk_Translation_API::get_current_request_language() : 'de';
	$post = leadwerk_theme_get_post_by_source_key( $source_key, $lang );
	$url = $post instanceof WP_Post ? get_permalink( $post ) : home_url( '/' );
	return $url . ( $fragment ? '#' . ltrim( $fragment, '#' ) : '' );
}

function leadwerk_theme_static_href_to_source_key( $href ) {
	$href = trim( html_entity_decode( (string) $href, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
	if ( '' === $href || '#' === $href || 0 === strpos( $href, '#' ) || preg_match( '#^(?:https?:|mailto:|tel:|//)#i', $href ) ) {
		return array( '', $href );
	}
	$parts = explode( '#', preg_replace( '#^\./#', '', $href ), 2 );
	$file = preg_replace( '#^(\.\./)+#', '', $parts[0] );
	$path = preg_replace( '#/?index\.html$#i', '', $file );
	$path = preg_replace( '#\.html$#i', '', $path );
	$path = trim( $path, '/' );
	$key = $path ? 'igienair-' . str_replace( '/', '--', $path ) : 'igienair-home';
	return array( $key, $parts[1] ?? '' );
}

function leadwerk_theme_render_chrome( $name ) {
	$file = LEADWERK_THEME_DIR . '/partials/site-' . $name . '.html';
	if ( ! is_file( $file ) ) {
		return '';
	}
	libxml_use_internal_errors( true );
	$dom = new DOMDocument( '1.0', 'UTF-8' );
	$dom->loadHTML( '<?xml encoding="utf-8" ?><div id="leadwerk-root">' . file_get_contents( $file ) . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD );
	libxml_clear_errors();
	$xpath = new DOMXPath( $dom );
	foreach ( $xpath->query( '//*[@href]' ) as $node ) {
		$href = $node->getAttribute( 'href' );
		list( $source_key, $fragment ) = leadwerk_theme_static_href_to_source_key( $href );
		if ( $source_key ) {
			$node->setAttribute( 'href', leadwerk_theme_page_url( $source_key, $fragment ) );
		}
	}
	foreach ( $xpath->query( '//*[@src]' ) as $node ) {
		$src = $node->getAttribute( 'src' );
		if ( false !== strpos( $src, 'logo-weiss.svg' ) ) {
			$node->setAttribute( 'src', leadwerk_theme_option_image_url( 'footer' === $name ? 'footer_logo' : 'header_logo_light', 'logos/logo-weiss.svg' ) );
		} elseif ( preg_match( '#(?:^|/)logo\.svg$#', $src ) ) {
			$node->setAttribute( 'src', leadwerk_theme_option_image_url( 'header_logo', 'logos/logo.svg' ) );
		} elseif ( false !== strpos( $src, 'germany-badge.webp' ) || false !== strpos( $src, 'germany-badge.png' ) ) {
			$node->setAttribute( 'src', LEADWERK_THEME_URI . '/assets/images/germany-badge.webp' );
		}
	}
	if ( 'header' === $name ) {
		foreach ( $xpath->query( '//a[contains(concat(" ",normalize-space(@class)," ")," brand ")]' ) as $brand_link ) {
			$brand_link->setAttribute( 'href', leadwerk_theme_page_url( 'igienair-home' ) );
		}
		$button_targets = array(
			'Zu- & Abluftkanäle'                 => 'igienair-anlagen--luftkanalreinigung',
			'Reinräume'                          => 'igienair-anlagen--reinraumqualifizierung',
			'OP-Räume'                           => 'igienair-anlagen--op-raum-pruefung',
			'Kühlregale'                         => 'igienair-anlagen--kuehlregale',
			'Textilschläuche'                    => 'igienair-anlagen--textilschlaeuche',
			'Filterintegritätstest'              => 'igienair-filterintegritaetstest',
			'Mitarbeiter technische Reinigung'  => 'igienair-jobs--mitarbeiter-technische-reinigung-gesucht',
			'Teamleiter technische Hygienereinigung' => 'igienair-jobs--teamleiter-hygienereinigung-gesucht',
		);
		foreach ( $xpath->query( '//button[@data-inert]' ) as $button ) {
			$label = trim( html_entity_decode( (string) $button->textContent, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
			if ( empty( $button_targets[ $label ] ) ) {
				continue;
			}
			$link = $dom->createElement( 'a' );
			foreach ( $button->attributes as $attribute ) {
				if ( 'type' !== $attribute->name && 'data-inert' !== $attribute->name ) {
					$link->setAttribute( $attribute->name, $attribute->value );
				}
			}
			$link->setAttribute( 'href', leadwerk_theme_page_url( $button_targets[ $label ] ) );
			while ( $button->firstChild ) {
				$link->appendChild( $button->firstChild );
			}
			$button->parentNode->replaceChild( $link, $button );
		}
	}
	if ( 'footer' === $name ) {
		$contact_items = $xpath->query( '//*[contains(concat(" ",normalize-space(@class)," ")," footer-column--contact ")]//*[contains(concat(" ",normalize-space(@class)," ")," contact-item ")]' );
		$address = (string) leadwerk_theme_option( 'company_address', "Am Hardtwald 6-8\n76275 Ettlingen" );
		$phone = (string) leadwerk_theme_option( 'company_phone', '+49 (0) 7243 3699101' );
		$fax = (string) leadwerk_theme_option( 'company_fax', '+49 (0) 7243 3694 943' );
		$email = (string) leadwerk_theme_option( 'company_email', 'kontakt@igienair.com' );
		if ( $contact_items->item( 0 ) ) {
			$p = $xpath->query( './/p', $contact_items->item( 0 ) )->item( 0 );
			if ( $p ) {
				while ( $p->firstChild ) {
					$p->removeChild( $p->firstChild );
				}
				$lines = preg_split( '/\r\n|\r|\n/', $address );
				foreach ( $lines as $index => $line ) {
					if ( $index ) {
						$p->appendChild( $dom->createElement( 'br' ) );
					}
					$p->appendChild( $dom->createTextNode( $line ) );
				}
			}
		}
		$contact_values = array( 1 => array( $phone, 'tel:' . preg_replace( '/[^0-9+]/', '', $phone ) ), 2 => array( $fax, '' ), 3 => array( $email, 'mailto:' . $email ) );
		foreach ( $contact_values as $index => $pair ) {
			$item = $contact_items->item( $index );
			$link = $item ? $xpath->query( './/a', $item )->item( 0 ) : null;
			if ( $link ) {
				$link->nodeValue = $pair[0];
				$link->setAttribute( 'href', $pair[1] ? $pair[1] : '#!' );
			}
		}
		$copyright = $xpath->query( '//*[contains(concat(" ",normalize-space(@class)," ")," site-footer__legal-inner ")]/span[1]' )->item( 0 );
		if ( $copyright ) {
			$copyright->nodeValue = '© IGIENAIR ' . wp_date( 'Y' );
		}
	}
	$root = $dom->getElementById( 'leadwerk-root' );
	$html = '';
	foreach ( $root->childNodes as $child ) {
		$html .= $dom->saveHTML( $child );
	}
	if ( 'footer' === $name ) {
		$html = preg_replace( '/(?:&copy;|©)\s*IGIENAIR\s+\d{4}/u', '© IGIENAIR ' . wp_date( 'Y' ), $html );
	}
	return $html;
}

function leadwerk_theme_option( $key, $default = '' ) {
	$value = function_exists( 'get_field' ) ? get_field( $key, 'option' ) : null;
	return null === $value || '' === $value ? $default : $value;
}

function leadwerk_theme_option_image_url( $key, $fallback ) {
	$id = absint( leadwerk_theme_option( $key, 0 ) );
	$url = $id ? wp_get_attachment_url( $id ) : '';
	return $url ? $url : LEADWERK_THEME_URI . '/assets/images/' . ltrim( $fallback, '/' );
}

function leadwerk_theme_render_header_block() {
	echo leadwerk_theme_render_chrome( 'header' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	leadwerk_theme_render_quick_rail( 'desktop' );
}

function leadwerk_theme_render_footer_block() {
	echo leadwerk_theme_render_chrome( 'footer' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	leadwerk_theme_render_quick_rail( 'mobile' );
}

function leadwerk_theme_render_quick_rail( $variant ) {
	$variant = 'mobile' === $variant ? 'mobile' : 'desktop';
	$offer_url = leadwerk_theme_page_url( 'igienair-kontakt--angebot-anfordern' );
	$items = array(
		array(
			'href'  => '#footer-contact',
			'label' => 'Kontakt',
			'path'  => 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm4 17a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 12 19Zm-3-2h6V5H9v12Z',
		),
		array(
			'href'  => $offer_url,
			'label' => 'Angebot',
			'path'  => 'M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2h2.5A1.5 1.5 0 0 1 22 8.5v9A1.5 1.5 0 0 1 20.5 19H3.5A1.5 1.5 0 0 1 2 17.5v-9A1.5 1.5 0 0 1 3.5 7H6Zm2 0h8V5H8v2Zm12 4.25h-5.5v1.25a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-1.25H4v6.25h16v-6.25Zm-8-1.75h-1v2h2v-2h-1Z',
		),
		array(
			'href'  => $offer_url,
			'label' => 'Termin',
			'path'  => 'M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v13a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2h2V2Zm12 8H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9ZM8 13h3v3H8v-3Z',
		),
	);

	echo '<nav class="quick-rail quick-rail--' . esc_attr( $variant ) . '" aria-label="' . esc_attr( 'mobile' === $variant ? 'Schnellzugriff mobil' : 'Schnellzugriff' ) . '">';
	foreach ( $items as $item ) {
		echo '<a href="' . esc_url( $item['href'] ) . '" class="quick-rail__item" aria-label="' . esc_attr( $item['label'] ) . '">';
		echo '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' . esc_attr( $item['path'] ) . '"></path></svg>';
		echo '</a>';
	}
	echo '</nav>';
}

function leadwerk_theme_resolve_attr( $value, $name ) {
	if ( ! is_array( $value ) ) {
		return (string) $value;
	}
	$type = (string) ( $value['type'] ?? '' );
	if ( 'page' === $type ) {
		return leadwerk_theme_page_url( sanitize_key( $value['source_key'] ?? '' ), sanitize_title( $value['fragment'] ?? '' ) );
	}
	if ( 'media' === $type ) {
		$url = wp_get_attachment_url( absint( $value['id'] ?? 0 ) );
		return $url ? $url : '';
	}
	if ( 'srcset' === $type ) {
		$parts = array();
		foreach ( (array) ( $value['items'] ?? array() ) as $item ) {
			$url = leadwerk_theme_resolve_attr( $item['source'] ?? array(), 'src' );
			if ( $url ) {
				$parts[] = $url . ( empty( $item['descriptor'] ) ? '' : ' ' . sanitize_text_field( $item['descriptor'] ) );
			}
		}
		return implode( ', ', $parts );
	}
	if ( 'url' === $type ) {
		$url = (string) ( $value['value'] ?? '' );
		if ( false !== strpos( $url, 'youtube.com/' ) ) {
			return (string) leadwerk_theme_option( 'youtube_url', $url );
		}
		if ( false !== strpos( $url, 'linkedin.com/' ) ) {
			return (string) leadwerk_theme_option( 'linkedin_url', $url );
		}
		return $url;
	}
	return '';
}

function leadwerk_theme_render_node( $node ) {
	if ( isset( $node['text'] ) ) {
		return esc_html( (string) $node['text'] );
	}
	if ( isset( $node['component'] ) && in_array( $node['component'], array( 'wpforms_quote', 'wpforms_home_quote', 'wpforms_offer_quote' ), true ) ) {
		return leadwerk_theme_render_wpforms_quote( $node['component'] );
	}
	$tag = sanitize_key( (string) ( $node['tag'] ?? '' ) );
	if ( ! class_exists( 'Leadwerk_Content_Schema' ) || ! in_array( $tag, Leadwerk_Content_Schema::allowed_tags(), true ) ) {
		return '';
	}
	if ( 'iframe' === $tag ) {
		$src = leadwerk_theme_resolve_attr( $node['attrs']['src'] ?? '', 'src' );
		$title = (string) ( $node['attrs']['title'] ?? 'Google Maps' );
		return '<div class="leadwerk-consent-embed"><button type="button" class="button button--solid" data-leadwerk-consent-embed data-src="' . esc_url( $src ) . '" data-title="' . esc_attr( $title ) . '">Externen Inhalt laden</button></div>';
	}
	$node_attributes = (array) ( $node['attrs'] ?? array() );
	if ( 'video' === $tag && false !== strpos( (string) ( $node_attributes['class'] ?? '' ), 'hero__video' ) ) {
		$node_attributes['preload'] = 'auto';
		if ( empty( $node_attributes['poster'] ) ) {
			$node_attributes['poster'] = array(
				'type'  => 'url',
				'value' => LEADWERK_THEME_URI . '/assets/images/Bildmaterial_final/startseite/startseite-hero-poster.webp',
			);
		}
	}
	$attributes = '';
	foreach ( $node_attributes as $name => $value ) {
		$name = strtolower( (string) $name );
		if (
			0 === strpos( $name, 'on' )
			|| (
				! in_array( $name, Leadwerk_Content_Schema::allowed_attributes(), true )
				&& 0 !== strpos( $name, 'data-' )
				&& 0 !== strpos( $name, 'aria-' )
			)
		) {
			continue;
		}
		$resolved = leadwerk_theme_resolve_attr( $value, $name );
		if ( 'style' === $name ) {
			$resolved = preg_replace_callback(
				'#leadwerk-media://(\d+)#',
				function ( $match ) {
					return (string) wp_get_attachment_url( (int) $match[1] );
				},
				$resolved
			);
			$resolved = safecss_filter_attr( $resolved );
		} elseif ( in_array( $name, array( 'href', 'src', 'poster', 'data-cert-img', 'data-cert-pdf' ), true ) ) {
			$resolved = ( 0 === strpos( $resolved, '#' ) ) ? $resolved : esc_url( $resolved, array( 'http', 'https', 'mailto', 'tel' ) );
		} elseif ( 'srcset' === $name ) {
			$resolved = esc_attr( $resolved );
		}
		$is_empty_marker = '' === $resolved && ( 0 === strpos( $name, 'data-' ) || in_array( $name, array( 'open', 'required', 'checked', 'selected', 'disabled', 'controls', 'autoplay', 'muted', 'loop', 'playsinline', 'allowfullscreen', 'itemscope', 'novalidate' ), true ) );
		if ( '' !== $resolved || $is_empty_marker ) {
			$attributes .= ' ' . esc_attr( $name ) . '="' . esc_attr( $resolved ) . '"';
		}
	}
	$void = in_array( $tag, array( 'br', 'hr', 'img', 'input', 'source', 'col', 'meta' ), true );
	if ( $void ) {
		return '<' . $tag . $attributes . '>';
	}
	$children = '';
	foreach ( (array) ( $node['children'] ?? array() ) as $child ) {
		$children .= leadwerk_theme_render_node( $child );
	}
	return '<' . $tag . $attributes . '>' . $children . '</' . $tag . '>';
}

function leadwerk_theme_render_current_page_content( $post_id = 0 ) {
	$post_id = $post_id ? (int) $post_id : get_the_ID();
	if ( ! class_exists( 'Leadwerk_Content_Schema' ) ) {
		return '<main id="main-content"></main>';
	}
	$sections = function_exists( 'get_field' ) ? get_field( Leadwerk_Content_Schema::FIELD_NAME, $post_id ) : array();
	if ( ! is_array( $sections ) ) {
		return '';
	}
	$html = '<main id="main-content">';
	foreach ( $sections as $section ) {
		$html .= leadwerk_theme_render_node( $section['node'] ?? array() );
	}
	return $html . '</main>';
}

function leadwerk_theme_render_wpforms_quote( $component = 'wpforms_quote' ) {
	if ( 'wpforms_home_quote' === $component ) {
		$option_key = 'wpforms_home_quote_form';
		$form_variant = 'home';
	} elseif ( 'wpforms_offer_quote' === $component ) {
		$option_key = 'wpforms_offer_form';
		$form_variant = 'offer';
	} else {
		$source_key = (string) get_post_meta( get_queried_object_id(), 'leadwerk_source_key', true );
		$option_key = 'igienair-home' === $source_key ? 'wpforms_home_quote_form' : 'wpforms_offer_form';
		$form_variant = 'igienair-home' === $source_key ? 'home' : 'offer';
	}
	$legacy_value = trim( (string) leadwerk_theme_option( 'wpforms_quote_form', '' ) );
	$value = trim( (string) leadwerk_theme_option( $option_key, $legacy_value ) );
	if ( ctype_digit( $value ) ) {
		$value = '[wpforms id="' . absint( $value ) . '"]';
	}
	if ( shortcode_exists( 'wpforms' ) && preg_match( '/^\[wpforms\b[^\]]*\]$/', $value ) ) {
		return '<div class="leadwerk-wpforms-slot leadwerk-wpforms-slot--' . esc_attr( $form_variant ) . '">' . do_shortcode( $value ) . '</div>';
	}
	$message = current_user_can( 'manage_options' )
		? 'Bu form için WPForms ID veya shortcode IGIENAIR Optionen ekranında tanımlanmalı.'
		: 'Das Anfrageformular ist derzeit nicht verfügbar. Bitte kontaktieren Sie uns telefonisch oder per E-Mail.';
	return '<div class="leadwerk-form-fallback" role="status">' . esc_html( $message ) . '</div>';
}

function leadwerk_theme_document_title( $title ) {
	if ( is_singular( 'page' ) ) {
		$stored = get_post_meta( get_queried_object_id(), 'leadwerk_document_title', true );
		return $stored ? (string) $stored : $title;
	}
	return $title;
}
add_filter( 'pre_get_document_title', 'leadwerk_theme_document_title' );

function leadwerk_theme_meta_tags() {
	if ( ! is_singular( 'page' ) || defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) ) {
		return;
	}
	$id = get_queried_object_id();
	$description = get_post_meta( $id, 'leadwerk_meta_description', true );
	$canonical = get_post_meta( $id, 'leadwerk_canonical', true );
	$robots = get_post_meta( $id, 'leadwerk_robots', true );
	if ( $description ) {
		echo '<meta name="description" content="' . esc_attr( $description ) . '">' . "\n";
	}
	echo '<link rel="canonical" href="' . esc_url( $canonical ? $canonical : get_permalink( $id ) ) . '">' . "\n";
	if ( $robots ) {
		echo '<meta name="robots" content="' . esc_attr( $robots ) . '">' . "\n";
	}
}
add_action( 'wp_head', 'leadwerk_theme_meta_tags', 2 );

function leadwerk_theme_get_yoast_analysis_content( $post_id ) {
	$content = leadwerk_theme_render_current_page_content( (int) $post_id );
	$content = (string) preg_replace( '#<(?:script|style)[^>]*>.*?</(?:script|style)>#is', '', $content );
	return trim( (string) preg_replace( '/\s+/', ' ', wp_kses_post( $content ) ) );
}

function leadwerk_theme_rebuild_yoast_post_indexable( $post_id ) {
	if ( ! function_exists( 'YoastSEO' ) || ! class_exists( '\Yoast\WP\SEO\Integrations\Watchers\Indexable_Post_Watcher', false ) ) {
		return;
	}
	try {
		$yoast = YoastSEO();
		$watcher = $yoast->classes->get( \Yoast\WP\SEO\Integrations\Watchers\Indexable_Post_Watcher::class );
		if ( is_object( $watcher ) && method_exists( $watcher, 'build_indexable' ) ) {
			$watcher->build_indexable( (int) $post_id );
		}
	} catch ( Throwable $error ) {
		return;
	}
}

function leadwerk_theme_enqueue_admin_yoast_analysis( $hook ) {
	if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) || ! defined( 'WPSEO_VERSION' ) ) {
		return;
	}
	$post_id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;
	if ( ! $post_id || ! class_exists( 'Leadwerk_Content_Schema' ) || ! Leadwerk_Content_Schema::supports_post( $post_id ) ) {
		return;
	}
	$content = leadwerk_theme_get_yoast_analysis_content( $post_id );
	if ( '' === $content ) {
		return;
	}
	wp_enqueue_script(
		'leadwerk-admin-yoast-analysis',
		LEADWERK_THEME_URI . '/assets/js/admin-yoast-analysis.js',
		array(),
		LEADWERK_THEME_VERSION,
		true
	);
	wp_add_inline_script(
		'leadwerk-admin-yoast-analysis',
		'window.leadwerkYoastAnalysis=' . wp_json_encode( array( 'renderedContent' => $content ), JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
		'before'
	);
}
add_action( 'admin_enqueue_scripts', 'leadwerk_theme_enqueue_admin_yoast_analysis', 100 );

function leadwerk_theme_refresh_yoast_after_save( $post_id, $post ) {
	if ( $post instanceof WP_Post && 'page' === $post->post_type && get_post_meta( $post_id, 'leadwerk_source_key', true ) ) {
		leadwerk_theme_rebuild_yoast_post_indexable( $post_id );
	}
}
add_action( 'save_post_page', 'leadwerk_theme_refresh_yoast_after_save', 99, 2 );
