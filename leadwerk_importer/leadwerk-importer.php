<?php
/**
 * Plugin Name: Leadwerk IGIENAIR Importer
 * Description: Imports the canonical IGIENAIR static site into structured WordPress pages and media.
 * Version: 2.6.4
 * Author: Leadwerk
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Requires Plugins: leadwerk-fields, leadwerk-wpml-clone
 *
 * @package Leadwerk_Importer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'LEADWERK_IMPORTER_VERSION', '2.6.4' );
define( 'LEADWERK_IMPORTER_PATH', plugin_dir_path( __FILE__ ) );
define( 'LEADWERK_IMPORTER_URL', plugin_dir_url( __FILE__ ) );

require_once LEADWERK_IMPORTER_PATH . 'includes/class-leadwerk-logger.php';
require_once LEADWERK_IMPORTER_PATH . 'includes/class-leadwerk-media-importer.php';
require_once LEADWERK_IMPORTER_PATH . 'includes/class-leadwerk-importer.php';

function leadwerk_importer_allow_svg( $mimes ) {
	$mimes['svg'] = 'image/svg+xml';
	$mimes['woff2'] = 'font/woff2';
	return $mimes;
}
add_filter( 'upload_mimes', 'leadwerk_importer_allow_svg' );

function leadwerk_importer_menu() {
	add_management_page(
		'IGIENAIR Import',
		'IGIENAIR Import',
		'manage_options',
		'leadwerk-import',
		'leadwerk_importer_admin_page'
	);
}
add_action( 'admin_menu', 'leadwerk_importer_menu' );

function leadwerk_importer_assets( $hook ) {
	if ( 'tools_page_leadwerk-import' !== $hook ) {
		return;
	}
	wp_enqueue_style( 'leadwerk-importer', LEADWERK_IMPORTER_URL . 'assets/admin-import.css', array(), LEADWERK_IMPORTER_VERSION );
	wp_enqueue_script( 'leadwerk-importer', LEADWERK_IMPORTER_URL . 'assets/admin-import.js', array(), LEADWERK_IMPORTER_VERSION, true );
	wp_localize_script(
		'leadwerk-importer',
		'leadwerkImporter',
		array(
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'leadwerk_igienair_import' ),
			'state'   => Leadwerk_Logger::get(),
		)
	);
}
add_action( 'admin_enqueue_scripts', 'leadwerk_importer_assets' );

function leadwerk_importer_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$preflight = ( new Leadwerk_Importer( false ) )->preflight();
	?>
	<div class="wrap leadwerk-importer">
		<h1>IGIENAIR WordPress Import</h1>
		<p>176 kanonik HTML sayfasi, yapilandirilmis bolumler, medya ve Almanca ceviri kayitlari.</p>
		<div class="notice notice-warning inline"><p><strong>Importtan once:</strong> Veritabani ve <code>wp-content/uploads</code> yedegi alin.</p></div>
		<h2>Preflight</h2>
		<ul>
			<?php foreach ( $preflight['errors'] as $message ) : ?>
				<li class="leadwerk-error"><?php echo esc_html( $message ); ?></li>
			<?php endforeach; ?>
			<?php foreach ( $preflight['warnings'] as $message ) : ?>
				<li class="leadwerk-warning"><?php echo esc_html( $message ); ?></li>
			<?php endforeach; ?>
			<?php if ( ! $preflight['errors'] && ! $preflight['warnings'] ) : ?>
				<li>Preflight temiz.</li>
			<?php endif; ?>
		</ul>
		<p>
			<button type="button" class="button" data-leadwerk-start="dry">Dry-run baslat</button>
			<button type="button" class="button button-primary" data-leadwerk-start="apply" <?php disabled( ! empty( $preflight['errors'] ) ); ?>>Import baslat</button>
			<button type="button" class="button" data-leadwerk-resume>Devam et</button>
		</p>
		<div class="leadwerk-progress"><span></span></div>
		<p><strong data-leadwerk-status>idle</strong></p>
		<pre data-leadwerk-output><?php echo esc_html( wp_json_encode( Leadwerk_Logger::get(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ) ); ?></pre>
	</div>
	<?php
}

function leadwerk_importer_ajax() {
	nocache_headers();
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( array( 'message' => 'Yetkisiz.' ), 403 );
	}
	if ( ! check_ajax_referer( 'leadwerk_igienair_import', 'nonce', false ) ) {
		wp_send_json_error( array( 'message' => 'Importer güvenlik anahtarı geçersiz veya süresi dolmuş. Sayfayı yenileyin.' ), 403 );
	}
	@set_time_limit( 0 );
	@ini_set( 'memory_limit', '512M' );
	register_shutdown_function(
		static function () {
			$error = error_get_last();
			if ( ! is_array( $error ) || ! in_array( (int) $error['type'], array( E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR ), true ) ) {
				return;
			}
			Leadwerk_Logger::fatal(
				sprintf(
					'PHP fatal: %s in %s:%d',
					(string) $error['message'],
					wp_basename( (string) $error['file'] ),
					(int) $error['line']
				)
			);
		}
	);

	try {
		$mode = sanitize_key( wp_unslash( $_POST['mode'] ?? 'dry' ) );
		$start = ! empty( $_POST['start'] ) && '0' !== (string) $_POST['start'];
		$resume = ! empty( $_POST['resume'] ) && '0' !== (string) $_POST['resume'];
		$importer = new Leadwerk_Importer( 'apply' === $mode );
		if ( $start ) {
			$state = $importer->start_job();
		} elseif ( $resume ) {
			$state = Leadwerk_Logger::resume();
		} else {
			$state = Leadwerk_Logger::get();
		}
		if ( 'running' === (string) ( $state['status'] ?? '' ) ) {
			$state = $importer->run_batch( $importer->get_recommended_batch_size() );
		}
		wp_send_json_success( $state );
	} catch ( Throwable $error ) {
		$state = Leadwerk_Logger::fatal(
			sprintf(
				'%s in %s:%d',
				$error->getMessage(),
				wp_basename( $error->getFile() ),
				(int) $error->getLine()
			)
		);
		wp_send_json_error(
			array(
				'message' => $error->getMessage(),
				'state'   => $state,
			),
			500
		);
	}
}
add_action( 'wp_ajax_leadwerk_igienair_import', 'leadwerk_importer_ajax' );

function leadwerk_importer_dependency_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	if ( defined( 'ACF_VERSION' ) || function_exists( 'acf_get_field_groups' ) ) {
		echo '<div class="notice notice-error"><p><strong>IGIENAIR Importer:</strong> ACF/ACF Pro devre disi birakilmalidir.</p></div>';
	}
}
add_action( 'admin_notices', 'leadwerk_importer_dependency_notice' );
