<?php
/**
 * Persistent importer job state.
 *
 * @package Leadwerk_Importer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Leadwerk_Logger {
	const OPTION = 'leadwerk_igienair_import_job';

	public static function get() {
		$state = get_option( self::OPTION, array() );
		return is_array( $state ) ? $state : array();
	}

	public static function set( $state ) {
		update_option( self::OPTION, $state, false );
		return $state;
	}

	public static function reset( $dry_run, $total ) {
		return self::set(
			array(
				'job_id'      => wp_generate_uuid4(),
				'status'      => 'running',
				'dry_run'     => (bool) $dry_run,
				'cursor'      => 0,
				'total'       => (int) $total,
				'processed'   => 0,
				'success'     => 0,
				'warnings'    => array(),
				'errors'      => array(),
				'started_at'  => current_time( 'mysql', true ),
				'finished_at' => '',
				'current_file'=> '',
				'last_error'  => '',
				'last_http_at'=> '',
			)
		);
	}

	public static function message( &$state, $message, $level = 'warning' ) {
		$key = 'error' === $level ? 'errors' : 'warnings';
		$state[ $key ][] = sanitize_text_field( (string) $message );
		$state[ $key ] = array_slice( $state[ $key ], -200 );
	}

	public static function fatal( $message ) {
		$state = self::get();
		if ( empty( $state ) ) {
			$state = array();
		}
		$state['status'] = 'failed';
		$state['last_error'] = sanitize_text_field( (string) $message );
		$state['finished_at'] = current_time( 'mysql', true );
		self::message( $state, $message, 'error' );
		return self::set( $state );
	}

	public static function resume() {
		$state = self::get();
		if ( empty( $state ) ) {
			return $state;
		}
		$state['status'] = 'running';
		$state['finished_at'] = '';
		$state['last_error'] = '';
		$state['resumed_at'] = current_time( 'mysql', true );
		return self::set( $state );
	}
}
