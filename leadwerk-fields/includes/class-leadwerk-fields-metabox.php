<?php
/**
 * IGIENAIR structured content and options UI.
 *
 * @package Leadwerk_Fields
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Leadwerk_Fields_Metabox {

	private static $options = array(
		'header_logo'          => array( 'label' => 'Header Logo (dunkel)', 'type' => 'image', 'help' => 'Wird auf hellem Header-Hintergrund verwendet.' ),
		'header_logo_light'    => array( 'label' => 'Header Logo (hell)', 'type' => 'image', 'help' => 'Wird auf dunklem oder transparentem Header-Hintergrund verwendet.' ),
		'footer_logo'          => array( 'label' => 'Footer Logo', 'type' => 'image' ),
		'site_icon'            => array( 'label' => 'Website Icon', 'type' => 'image', 'help' => 'WordPress Website-Icon. Bitte ein quadratisches PNG mit mindestens 512 × 512 Pixeln verwenden.' ),
		'company_address'      => array( 'label' => 'Firmenadresse', 'type' => 'textarea' ),
		'company_phone'        => array( 'label' => 'Telefon', 'type' => 'text' ),
		'company_fax'          => array( 'label' => 'Fax', 'type' => 'text' ),
		'company_email'        => array( 'label' => 'E-Mail', 'type' => 'email' ),
		'wpforms_home_quote_form' => array( 'label' => 'WPForms Startseite: kurzes Angebotsformular', 'type' => 'text', 'help' => 'Formular auf der Startseite. Zum Beispiel 123 oder [wpforms id="123"].' ),
		'wpforms_offer_form'   => array( 'label' => 'WPForms Angebotsseite: ausführliches Angebotsformular', 'type' => 'text', 'help' => 'Formular auf /kontakt/angebot-anfordern/. Zum Beispiel 456 oder [wpforms id="456"].' ),
		'linkedin_url'         => array( 'label' => 'LinkedIn URL', 'type' => 'url' ),
		'youtube_url'          => array( 'label' => 'YouTube URL', 'type' => 'url' ),
	);

	public static function init() {
		add_action( 'add_meta_boxes_page', array( __CLASS__, 'register_metabox' ) );
		add_action( 'save_post_page', array( __CLASS__, 'save_metabox' ), 10, 2 );
		add_action( 'admin_menu', array( __CLASS__, 'register_options_page' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_editor_assets' ) );
		add_action( 'admin_notices', array( __CLASS__, 'render_save_error' ) );
		add_filter( 'use_block_editor_for_post', array( __CLASS__, 'disable_block_editor' ), 10, 2 );
	}

	public static function enqueue_editor_assets( $hook ) {
		if ( 'toplevel_page_leadwerk-options' === $hook ) {
			wp_enqueue_media();
			wp_enqueue_script(
				'leadwerk-options-media',
				LEADWERK_FIELDS_URL . 'assets/options-media.js',
				array(),
				LEADWERK_FIELDS_VERSION,
				true
			);
			return;
		}
		if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}
		$post_id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;
		if ( ! $post_id || ! Leadwerk_Content_Schema::supports_post( $post_id ) ) {
			return;
		}
		wp_enqueue_media();
		wp_enqueue_style(
			'leadwerk-fields-editor',
			LEADWERK_FIELDS_URL . 'assets/structured-editor.css',
			array(),
			(string) filemtime( LEADWERK_FIELDS_PATH . 'assets/structured-editor.css' )
		);
		wp_enqueue_script(
			'leadwerk-fields-content-media',
			LEADWERK_FIELDS_URL . 'assets/content-media.js',
			array(),
			(string) filemtime( LEADWERK_FIELDS_PATH . 'assets/content-media.js' ),
			true
		);
	}

	public static function disable_block_editor( $use, $post ) {
		return Leadwerk_Content_Schema::supports_post( $post ) ? false : $use;
	}

	public static function register_metabox( $post ) {
		if ( ! Leadwerk_Content_Schema::supports_post( $post ) ) {
			return;
		}
		remove_post_type_support( 'page', 'editor' );
		add_meta_box(
			'leadwerk_igienair_sections',
			'IGIENAIR Sektionen',
			array( __CLASS__, 'render_metabox' ),
			'page',
			'normal',
			'high'
		);
		add_meta_box(
			'leadwerk_igienair_page_settings',
			'IGIENAIR Seiten- und SEO-Einstellungen',
			array( __CLASS__, 'render_page_settings' ),
			'page',
			'side',
			'high'
		);
	}

	public static function render_metabox( $post ) {
		$sections = Leadwerk_Fields_API::get_field( Leadwerk_Content_Schema::FIELD_NAME, $post->ID );
		$sections = is_array( $sections ) ? array_values( $sections ) : array();
		$json = wp_json_encode( $sections, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
		wp_nonce_field( 'leadwerk_save_igienair_sections', 'leadwerk_igienair_nonce' );
		echo '<div class="leadwerk-editor-intro">';
		echo '<div><h3>Seiteninhalt bearbeiten</h3><p>Texte, Links und Medien sind nach Sektionen geordnet. Die technische Speicherstruktur bleibt vollständig im Hintergrund.</p></div>';
		echo '<span class="leadwerk-editor-intro__count">' . count( $sections ) . ' Sektionen</span>';
		echo '</div>';
		echo '<div class="leadwerk-editor-toolbar">';
		echo '<label class="leadwerk-editor-search"><span class="dashicons dashicons-search" aria-hidden="true"></span><input type="search" placeholder="Sektionen und Felder suchen" data-leadwerk-section-search></label>';
		echo '<div class="leadwerk-editor-toolbar__actions">';
		echo '<button type="button" class="button" data-leadwerk-sections-open>Alle öffnen</button>';
		echo '<button type="button" class="button" data-leadwerk-sections-close>Alle schließen</button>';
		echo '</div></div>';
		echo '<textarea name="leadwerk_igienair_sections" hidden>' . esc_textarea( $json ) . '</textarea>';
		if ( empty( $sections ) || ! is_array( $sections ) ) {
			echo '<p><em>Keine importierten Sektionen vorhanden.</em></p>';
			return;
		}
		echo '<div class="leadwerk-sections" data-leadwerk-sections>';
		foreach ( $sections as $section_index => $section ) {
			$type = sanitize_key( (string) ( $section['type'] ?? 'section' ) );
			$label = ucwords( str_replace( array( '-', '_' ), ' ', $type ) );
			$counter = 0;
			ob_start();
			self::render_node_fields(
				(array) ( $section['node'] ?? array() ),
				array( $section_index, 'node' ),
				$label,
				$counter
			);
			$fields_html = ob_get_clean();
			echo '<details class="leadwerk-section-card" data-leadwerk-section-card open>';
			echo '<summary class="leadwerk-section-head"><span class="leadwerk-section-title"><span class="leadwerk-section-number">' . (int) ( $section_index + 1 ) . '</span><span><strong>' . esc_html( $label ) . '</strong><small>' . (int) $counter . ' bearbeitbare Felder</small></span></span>';
			echo '<span class="leadwerk-section-code">' . esc_html( $type ) . '</span><span class="leadwerk-section-toggle dashicons dashicons-arrow-down-alt2" aria-hidden="true"></span></summary>';
			echo '<div class="leadwerk-content-fields">';
			echo $fields_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			if ( 0 === $counter ) {
				echo '<p class="leadwerk-content-empty">Diese Sektion enthält keine redaktionell bearbeitbaren Inhalte.</p>';
			}
			echo '</div></details>';
		}
		echo '<p class="leadwerk-sections-empty" data-leadwerk-sections-empty hidden>Keine passende Sektion gefunden.</p>';
		echo '</div>';
	}

	private static function render_node_fields( $node, $path, $context, &$counter ) {
		if ( isset( $node['component'] ) ) {
			self::render_content_edit( array_merge( $path, array( 'component' ) ), 'Komponente', (string) $node['component'], 'text', 'component' );
			$counter++;
			return;
		}
		if ( array_key_exists( 'text', $node ) ) {
			$text = (string) $node['text'];
			if ( '' === trim( $text ) ) {
				return;
			}
			$tag = sanitize_key( (string) ( $context ?: 'text' ) );
			$label = self::content_label( $tag, $counter + 1 );
			self::render_content_edit( array_merge( $path, array( 'text' ) ), $label, $text, strlen( $text ) > 90 ? 'textarea' : 'text', 'scalar' );
			$counter++;
			return;
		}

		$tag = sanitize_key( (string) ( $node['tag'] ?? 'element' ) );
		$attrs = (array) ( $node['attrs'] ?? array() );
		$editable_attrs = array(
			'href' => 'Link-Ziel',
			'src' => 'Bild / Medienquelle',
			'srcset' => 'Responsive Bildquellen',
			'poster' => 'Video-Vorschaubild',
			'alt' => 'Alternativtext',
			'title' => 'Titel / Tooltip',
			'placeholder' => 'Platzhalter',
			'data-video' => 'Video-URL',
			'data-title' => 'Video-Titel',
			'data-cert-img' => 'Zertifikat-Vorschau',
			'data-cert-pdf' => 'Zertifikat-PDF',
			'data-cert-alt' => 'Zertifikat-Bezeichnung',
		);
		foreach ( $editable_attrs as $name => $label ) {
			if ( ! array_key_exists( $name, $attrs ) ) {
				continue;
			}
			$value = $attrs[ $name ];
			$kind = 'scalar';
			$media_context = array();
			if ( is_array( $value ) ) {
				$kind = (string) ( $value['type'] ?? 'object' );
				if ( 'media' === $kind ) {
					$media_context = array(
						'id'        => absint( $value['id'] ?? 0 ),
						'path'      => sanitize_text_field( (string) ( $value['path'] ?? '' ) ),
						'attribute' => $name,
					);
					$value = (string) absint( $value['id'] ?? 0 );
					$label .= ' (Attachment-ID)';
				} elseif ( 'page' === $kind ) {
					$value = (string) ( $value['source_key'] ?? '' );
					$label .= ' (Source Key)';
				} elseif ( 'url' === $kind ) {
					$value = (string) ( $value['value'] ?? '' );
				} else {
					$value = wp_json_encode( $value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
					$kind = 'json';
				}
			}
			self::render_content_edit( array_merge( $path, array( 'attrs', $name ) ), $label, (string) $value, strlen( (string) $value ) > 100 ? 'textarea' : 'text', $kind, $media_context );
			$counter++;
		}
		foreach ( array_values( (array) ( $node['children'] ?? array() ) ) as $child_index => $child ) {
			if ( is_array( $child ) ) {
				self::render_node_fields( $child, array_merge( $path, array( 'children', $child_index ) ), $tag, $counter );
			}
		}
	}

	private static function render_content_edit( $path, $label, $value, $control, $kind, $media_context = array() ) {
		$index = substr( sha1( wp_json_encode( $path ) ), 0, 16 );
		$wide = in_array( $control, array( 'textarea' ), true ) || 'media' === $kind ? ' leadwerk-content-field--wide' : '';
		echo '<div class="leadwerk-content-field leadwerk-content-field--' . esc_attr( sanitize_html_class( $kind ) ) . esc_attr( $wide ) . '" data-leadwerk-content-field>';
		echo '<label class="leadwerk-content-field__label" for="leadwerk-content-' . esc_attr( $index ) . '"><strong>' . esc_html( $label ) . '</strong><span>' . esc_html( self::field_type_label( $kind, $control ) ) . '</span></label>';
		echo '<input type="hidden" name="leadwerk_content_edits[' . esc_attr( $index ) . '][path]" value="' . esc_attr( wp_json_encode( $path ) ) . '">';
		echo '<input type="hidden" name="leadwerk_content_edits[' . esc_attr( $index ) . '][kind]" value="' . esc_attr( $kind ) . '">';
		if ( 'textarea' === $control ) {
			echo '<textarea class="widefat" rows="5" id="leadwerk-content-' . esc_attr( $index ) . '" name="leadwerk_content_edits[' . esc_attr( $index ) . '][value]">' . esc_textarea( $value ) . '</textarea>';
		} elseif ( 'media' === $kind ) {
			self::render_media_edit( $index, $value, $media_context );
		} else {
			echo '<input class="widefat" type="text" id="leadwerk-content-' . esc_attr( $index ) . '" name="leadwerk_content_edits[' . esc_attr( $index ) . '][value]" value="' . esc_attr( $value ) . '">';
		}
		echo '</div>';
	}

	private static function field_type_label( $kind, $control ) {
		if ( 'media' === $kind ) {
			return 'Medien';
		}
		if ( 'page' === $kind ) {
			return 'Interner Link';
		}
		if ( 'component' === $kind ) {
			return 'Komponente';
		}
		return 'textarea' === $control ? 'Langtext' : 'Text';
	}

	private static function render_media_edit( $index, $value, $media_context ) {
		$attachment_id = absint( $value );
		$source_path = sanitize_text_field( (string) ( $media_context['path'] ?? '' ) );
		$attachment_url = $attachment_id ? wp_get_attachment_url( $attachment_id ) : '';
		$mime_type = $attachment_id ? (string) get_post_mime_type( $attachment_id ) : '';
		$filename = $attachment_id ? basename( (string) get_attached_file( $attachment_id ) ) : basename( $source_path );
		$media_type = self::get_media_preview_type( $mime_type, $attachment_url ?: $source_path );

		echo '<div class="leadwerk-content-media" data-leadwerk-content-media>';
		echo '<div class="leadwerk-content-media__preview" data-leadwerk-content-media-preview>';
		self::render_media_preview( $attachment_id, $attachment_url, $filename, $media_type );
		echo '</div>';
		echo '<div class="leadwerk-content-media__controls">';
		echo '<div class="leadwerk-content-media__meta" data-leadwerk-content-media-meta>';
		if ( $attachment_id ) {
			echo '<strong>' . esc_html( $filename ?: 'Medium' ) . '</strong><span>Attachment-ID: ' . (int) $attachment_id . '</span>';
		} else {
			echo '<strong>Kein Medium ausgewählt</strong>';
			if ( $source_path ) {
				echo '<span>Quelldatei: ' . esc_html( $source_path ) . '</span>';
			}
		}
		echo '</div>';
		echo '<input class="widefat" type="number" min="0" id="leadwerk-content-' . esc_attr( $index ) . '" name="leadwerk_content_edits[' . esc_attr( $index ) . '][value]" value="' . esc_attr( $attachment_id ) . '" data-leadwerk-content-media-id>';
		echo '<div class="leadwerk-content-field__actions">';
		echo '<button type="button" class="button button-secondary" data-leadwerk-content-media-select>Aus Mediathek wählen</button>';
		echo '<button type="button" class="button-link-delete" data-leadwerk-content-media-remove' . ( $attachment_id ? '' : ' hidden' ) . '>Medium entfernen</button>';
		echo '</div></div></div>';
	}

	private static function render_media_preview( $attachment_id, $attachment_url, $filename, $media_type ) {
		if ( ! $attachment_id || ! $attachment_url ) {
			echo '<span class="leadwerk-content-media__empty dashicons dashicons-format-image" aria-hidden="true"></span>';
			return;
		}

		if ( 'image' === $media_type ) {
			$preview_url = wp_get_attachment_image_url( $attachment_id, 'medium' );
			echo '<img src="' . esc_url( $preview_url ?: $attachment_url ) . '" alt="">';
			return;
		}

		if ( 'video' === $media_type ) {
			echo '<video src="' . esc_url( $attachment_url ) . '" controls preload="metadata"></video>';
			return;
		}

		$icon = 'pdf' === $media_type ? 'dashicons-pdf' : 'dashicons-media-document';
		echo '<a class="leadwerk-content-media__file" href="' . esc_url( $attachment_url ) . '" target="_blank" rel="noopener noreferrer">';
		echo '<span class="dashicons ' . esc_attr( $icon ) . '" aria-hidden="true"></span>';
		echo '<span>' . esc_html( $filename ?: 'Datei öffnen' ) . '</span></a>';
	}

	private static function get_media_preview_type( $mime_type, $source ) {
		if ( 0 === strpos( $mime_type, 'image/' ) ) {
			return 'image';
		}
		if ( 0 === strpos( $mime_type, 'video/' ) ) {
			return 'video';
		}
		if ( 'application/pdf' === $mime_type ) {
			return 'pdf';
		}

		$extension = strtolower( (string) pathinfo( (string) wp_parse_url( $source, PHP_URL_PATH ), PATHINFO_EXTENSION ) );
		if ( in_array( $extension, array( 'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg' ), true ) ) {
			return 'image';
		}
		if ( in_array( $extension, array( 'mp4', 'webm', 'mov', 'm4v', 'ogv' ), true ) ) {
			return 'video';
		}
		return 'pdf' === $extension ? 'pdf' : 'file';
	}

	private static function content_label( $tag, $number ) {
		$labels = array(
			'h1' => 'Hauptüberschrift',
			'h2' => 'Überschrift H2',
			'h3' => 'Überschrift H3',
			'h4' => 'Überschrift H4',
			'p' => 'Absatz',
			'li' => 'Listeneintrag',
			'a' => 'Linktext',
			'button' => 'Button-Text',
			'summary' => 'FAQ-Frage',
			'figcaption' => 'Bildunterschrift',
			'blockquote' => 'Zitat',
			'address' => 'Adresse',
			'label' => 'Feldbezeichnung',
		);
		$label = $labels[ $tag ] ?? 'Text';
		return $label;
	}

	public static function render_page_settings( $post ) {
		$editable = array(
			'leadwerk_document_title'   => array( 'label' => 'SEO-/Browser-Titel', 'type' => 'text' ),
			'leadwerk_meta_description' => array( 'label' => 'Meta Description', 'type' => 'textarea' ),
			'leadwerk_canonical'        => array( 'label' => 'Canonical URL', 'type' => 'url' ),
			'leadwerk_robots'           => array( 'label' => 'Robots', 'type' => 'text' ),
			'leadwerk_body_class'       => array( 'label' => 'Body CSS-Klassen', 'type' => 'text' ),
		);
		foreach ( $editable as $key => $definition ) {
			$value = (string) get_post_meta( $post->ID, $key, true );
			echo '<p><label for="' . esc_attr( $key ) . '"><strong>' . esc_html( $definition['label'] ) . '</strong></label><br>';
			if ( 'textarea' === $definition['type'] ) {
				echo '<textarea class="widefat" rows="4" id="' . esc_attr( $key ) . '" name="leadwerk_page_settings[' . esc_attr( $key ) . ']">' . esc_textarea( $value ) . '</textarea>';
			} else {
				echo '<input class="widefat" type="' . esc_attr( $definition['type'] ) . '" id="' . esc_attr( $key ) . '" name="leadwerk_page_settings[' . esc_attr( $key ) . ']" value="' . esc_attr( $value ) . '">';
			}
			echo '</p>';
		}
		$readonly = array(
			'leadwerk_source_key'      => 'Source Key',
			'leadwerk_source_file'     => 'Quelldatei',
			'leadwerk_source_checksum' => 'Import Checksum',
		);
		foreach ( $readonly as $key => $label ) {
			echo '<p><strong>' . esc_html( $label ) . '</strong><br><code style="word-break:break-all;">' . esc_html( (string) get_post_meta( $post->ID, $key, true ) ) . '</code></p>';
		}
	}

	public static function save_metabox( $post_id, $post ) {
		if ( ! $post instanceof WP_Post || ! Leadwerk_Content_Schema::supports_post( $post ) ) {
			return;
		}
		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) || ! isset( $_POST['leadwerk_igienair_nonce'] ) ) {
			return;
		}
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['leadwerk_igienair_nonce'] ) ), 'leadwerk_save_igienair_sections' ) ) {
			return;
		}
		$raw = isset( $_POST['leadwerk_igienair_sections'] ) ? wp_unslash( $_POST['leadwerk_igienair_sections'] ) : '[]';
		$value = json_decode( $raw, true );
		$edits = isset( $_POST['leadwerk_content_edits'] ) ? (array) wp_unslash( $_POST['leadwerk_content_edits'] ) : array();
		foreach ( $edits as $edit ) {
			$path = json_decode( (string) ( $edit['path'] ?? '' ), true );
			if ( ! is_array( $path ) || ! array_key_exists( 'value', $edit ) ) {
				continue;
			}
			self::apply_content_edit( $value, $path, (string) $edit['value'], sanitize_key( (string) ( $edit['kind'] ?? 'scalar' ) ) );
		}
		$valid = Leadwerk_Content_Schema::validate_sections( $value );
		if ( is_wp_error( $valid ) ) {
			set_transient( 'leadwerk_fields_error_' . get_current_user_id(), $valid->get_error_message(), 60 );
			return;
		}
		Leadwerk_Fields_API::update_field( Leadwerk_Content_Schema::FIELD_NAME, Leadwerk_Content_Schema::sanitize_value( $value ), $post_id );
		$settings = isset( $_POST['leadwerk_page_settings'] ) ? (array) wp_unslash( $_POST['leadwerk_page_settings'] ) : array();
		$sanitizers = array(
			'leadwerk_document_title'   => 'sanitize_text_field',
			'leadwerk_meta_description' => 'sanitize_textarea_field',
			'leadwerk_canonical'        => 'esc_url_raw',
			'leadwerk_robots'           => 'sanitize_text_field',
			'leadwerk_body_class'       => 'sanitize_text_field',
		);
		foreach ( $sanitizers as $key => $sanitizer ) {
			if ( array_key_exists( $key, $settings ) ) {
				update_post_meta( $post_id, $key, call_user_func( $sanitizer, $settings[ $key ] ) );
			}
		}
	}

	private static function apply_content_edit( &$sections, $path, $raw_value, $kind ) {
		$reference =& $sections;
		foreach ( $path as $segment ) {
			if ( ! is_array( $reference ) || ! array_key_exists( $segment, $reference ) ) {
				return;
			}
			$reference =& $reference[ $segment ];
		}
		if ( 'media' === $kind && is_array( $reference ) ) {
			$reference['id'] = absint( $raw_value );
		} elseif ( 'page' === $kind && is_array( $reference ) ) {
			$reference['source_key'] = sanitize_key( $raw_value );
		} elseif ( 'url' === $kind && is_array( $reference ) ) {
			$reference['value'] = esc_url_raw( $raw_value, array( 'http', 'https', 'mailto', 'tel' ) );
		} elseif ( 'json' === $kind ) {
			$decoded = json_decode( $raw_value, true );
			if ( is_array( $decoded ) ) {
				$reference = $decoded;
			}
		} else {
			$reference = $raw_value;
		}
	}

	public static function render_save_error() {
		$key = 'leadwerk_fields_error_' . get_current_user_id();
		$error = get_transient( $key );
		if ( ! $error ) {
			return;
		}
		delete_transient( $key );
		echo '<div class="notice notice-error"><p>' . esc_html( $error ) . '</p></div>';
	}

	public static function register_options_page() {
		add_menu_page(
			'IGIENAIR Optionen',
			'IGIENAIR Optionen',
			'manage_options',
			'leadwerk-options',
			array( __CLASS__, 'render_options_page' ),
			'dashicons-admin-generic',
			61
		);
	}

	public static function render_options_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		if ( isset( $_POST['leadwerk_options_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['leadwerk_options_nonce'] ) ), 'leadwerk_save_options' ) ) {
			$options_saved = true;
			foreach ( self::$options as $key => $definition ) {
				$raw = isset( $_POST[ $key ] ) ? wp_unslash( $_POST[ $key ] ) : '';
				if ( 'image' === $definition['type'] ) {
					$value = absint( $raw );
					if ( 'site_icon' === $key && $value ) {
						$mime = (string) get_post_mime_type( $value );
						$metadata = wp_get_attachment_metadata( $value );
						$is_raster = in_array( $mime, array( 'image/png', 'image/jpeg', 'image/webp' ), true );
						$is_large_enough = is_array( $metadata )
							&& absint( $metadata['width'] ?? 0 ) >= 512
							&& absint( $metadata['height'] ?? 0 ) >= 512;
						if ( ! $is_raster || ! $is_large_enough ) {
							$value = absint( get_option( 'site_icon', 0 ) );
							$options_saved = false;
							echo '<div class="notice notice-error"><p>Das Website Icon muss ein PNG, JPG oder WebP mit mindestens 512 × 512 Pixeln sein.</p></div>';
						}
					}
				} elseif ( 'url' === $definition['type'] ) {
					$value = esc_url_raw( $raw );
				} elseif ( 'email' === $definition['type'] ) {
					$value = sanitize_email( $raw );
				} elseif ( 'textarea' === $definition['type'] ) {
					$value = sanitize_textarea_field( $raw );
				} else {
					$value = sanitize_text_field( $raw );
				}
				Leadwerk_Fields_API::update_field( $key, $value, 'option' );
				if ( 'site_icon' === $key ) {
					update_option( 'site_icon', absint( $value ) );
				}
			}
			if ( $options_saved ) {
				echo '<div class="notice notice-success"><p>Optionen gespeichert.</p></div>';
			}
		}

		echo '<div class="wrap"><h1>IGIENAIR Optionen</h1><form method="post">';
		wp_nonce_field( 'leadwerk_save_options', 'leadwerk_options_nonce' );
		echo '<table class="form-table"><tbody>';
		foreach ( self::$options as $key => $definition ) {
			$value = 'site_icon' === $key
				? absint( get_option( 'site_icon', 0 ) )
				: Leadwerk_Fields_API::get_field( $key, 'option' );
			echo '<tr><th><label for="' . esc_attr( $key ) . '">' . esc_html( $definition['label'] ) . '</label></th><td>';
			if ( 'textarea' === $definition['type'] ) {
				echo '<textarea class="large-text" rows="4" id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '">' . esc_textarea( (string) $value ) . '</textarea>';
			} elseif ( 'image' === $definition['type'] ) {
				$image_id = absint( $value );
				$image_url = $image_id ? wp_get_attachment_url( $image_id ) : '';
				echo '<div class="leadwerk-option-image">';
				echo '<img data-leadwerk-image-preview src="' . esc_url( $image_url ) . '" alt="" style="display:' . ( $image_url ? 'block' : 'none' ) . ';max-width:260px;max-height:100px;margin:0 0 10px;padding:8px;background:#fff;border:1px solid #dcdcde;">';
				echo '<input type="hidden" id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '" value="' . esc_attr( (string) $image_id ) . '" data-leadwerk-image-id>';
				echo '<button type="button" class="button" data-leadwerk-image-select>Aus Mediathek wählen</button> ';
				echo '<button type="button" class="button button-link-delete" data-leadwerk-image-remove>Entfernen</button>';
				echo '</div>';
			} else {
				echo '<input class="regular-text" type="' . esc_attr( $definition['type'] ) . '" id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '" value="' . esc_attr( (string) $value ) . '">';
			}
			if ( ! empty( $definition['help'] ) ) {
				echo '<p class="description">' . esc_html( $definition['help'] ) . '</p>';
			}
			echo '</td></tr>';
		}
		echo '</tbody></table>';
		submit_button();
		echo '</form></div>';
	}
}
