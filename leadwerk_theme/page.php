<?php
get_header();
while ( have_posts() ) {
	the_post();
	echo leadwerk_theme_render_current_page_content( get_the_ID() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}
get_footer();
