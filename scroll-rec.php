<?php

/*
 * Plugin Name: Scroll-Rec
 * Plugin URI: https://cssroller.com/tools/scroll-rec/
 * Description: Record the position of the page and scroll to it. You can scroll anywhere.
 * Version: 1.0
 * Author: nigemizu
 * Author URI: https://cssroller.com/
 * License: GPL2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
*/

if ( ! defined( 'ABSPATH' ) ) exit;
function srec_read_js() {
	if( is_page() || is_single() )
		wp_enqueue_script( 'srec_js', plugins_url( './scroll-rec.js', __FILE__ ), array(), "", true );
}
add_action( 'wp_enqueue_scripts', 'srec_read_js' );
