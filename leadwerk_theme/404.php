<?php
/**
 * 404 template.
 *
 * @package Leadwerk_Theme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$home_url = leadwerk_theme_page_url( 'igienair-home' );
$contact_url = leadwerk_theme_page_url( 'igienair-kontakt--angebot-anfordern' );
$services_url = leadwerk_theme_page_url( 'igienair-leistungen' );
$company_url = leadwerk_theme_page_url( 'igienair-unternehmen' );

get_header();
?>
<main id="main-content" class="error-page">
	<section class="error-page__hero">
		<div class="container error-page__grid">
			<div class="error-page__content">
				<p class="eyebrow">404 · Seite nicht gefunden</p>
				<p class="error-page__number" aria-hidden="true">404</p>
				<h1>Hier ist die Luft rein, aber die Seite fehlt.</h1>
				<div class="gradient-line"></div>
				<p class="error-page__intro">Die gewünschte Adresse ist nicht verfügbar oder wurde verschoben. Über die folgenden Wege finden Sie schnell zurück zu IGIENAIR.</p>
				<div class="error-page__actions">
					<a class="button button--solid" href="<?php echo esc_url( $home_url ); ?>">Zur Startseite</a>
					<a class="button button--outline" href="<?php echo esc_url( $contact_url ); ?>">Anfrage stellen</a>
				</div>
			</div>
			<figure class="error-page__visual">
				<img src="<?php echo esc_url( LEADWERK_THEME_URI . '/assets/images/Bildmaterial_final/shared/anlagen-lueftungsreinigung7.webp' ); ?>" alt="Technische Reinigung einer Lüftungsanlage">
				<figcaption>Saubere Lösungen für Luft, Hygiene und Sicherheit</figcaption>
				<span class="error-page__visual-number" aria-hidden="true">404</span>
			</figure>
		</div>
	</section>
	<section class="error-page__links" aria-labelledby="error-page-links-title">
		<div class="container">
			<p class="eyebrow">Direkt weiter</p>
			<h2 id="error-page-links-title">Vielleicht suchen Sie einen dieser Bereiche</h2>
			<div class="error-page__cards">
				<a class="error-page__card" href="<?php echo esc_url( $services_url ); ?>">
					<span>01</span>
					<strong>Leistungen</strong>
					<small>Inspektion, Reinigung und Instandsetzung</small>
				</a>
				<a class="error-page__card" href="<?php echo esc_url( $company_url ); ?>">
					<span>02</span>
					<strong>Unternehmen</strong>
					<small>Kompetenz und Qualität bei IGIENAIR</small>
				</a>
				<a class="error-page__card" href="<?php echo esc_url( $contact_url ); ?>">
					<span>03</span>
					<strong>Kontakt</strong>
					<small>Persönliche Beratung und Angebotsanfrage</small>
				</a>
			</div>
		</div>
	</section>
</main>
<?php
get_footer();
