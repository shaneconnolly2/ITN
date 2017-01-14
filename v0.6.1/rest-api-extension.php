<?php
/*
Plugin Name: Rest API Extension
Description: Plugin to add custom fields to the JSON responses
Author: Shane Connolly
Version: 1.0
Author URI:  https://we41team9.webelevate.net
*/

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

add_action( 'rest_api_init', 'register_api_hooks' );

add_action( 'rest_api_init', 'register_rest_routes');


function register_api_hooks() 
{
    // Add the plaintext content to GET requests for individual posts
    register_rest_field('post',
        'plaintext',
        array(
            'get_callback'    => 'add_plaintext_content',
        )
    );

    register_rest_field( 'post',
        'post_categories',
        array(
            'get_callback'    => 'add_category_strings',
        )
	);

	 register_rest_field( 'post',
        'image_URLs',
        array(
            'get_callback'    => 'add_image_URLS',
        )
	);

	register_rest_field('post', 
		'author_info', 
		array(
        	'get_callback'    => 'add_author_name',
       )
	);

	register_rest_field('post', 
		'post_tags', 
		array(
        	'get_callback'    => 'add_post_tags',
       )
	);
}

function register_rest_routes()
{
    register_rest_route( 'ITN_menus/v1', 
    	'/menus', 
    	array(
	        'methods' => 'GET',
	        'callback' => 'get_all_menus',
    	) 
    );

    register_rest_route( 'ITN_menus/v1', 
    	'/menus/(?P<id>[a-zA-Z(-]+)', 
    	array(
	        'methods' => 'GET',
	        'callback' => 'get_menu_data',
    	) 
    );

    register_rest_route( 'ITN_menus/v1', 
        '/homepage/(?P<id>[a-zA-Z(-]+)&perCategory=(?P<perCategory>[a-z0-9 .\-]+)', 
        array(
            'methods' => 'GET',
            'callback' => 'get_home_page_data',
        ) 
    );
}


// Return plaintext content for posts
function add_plaintext_content( $object, $field_name, $request ) 
{
    return strip_tags( html_entity_decode( $object['content']['rendered'] ) );
}


function add_category_strings($post)
{
    $post_categories = array();
    $categories = wp_get_post_terms( $post['id'], 'category', array('fields'=>'all') );

	foreach ($categories as $term) 
	{
	    $term_link = get_term_link($term);
	    if ( is_wp_error( $term_link ) ) 
	    {
	        continue;
    	}

    	$post_categories[] = array('term_id'=>$term->term_id, 'name'=>$term->name, 'link'=>$term_link);
	}

    //return $post_categories;
    return $categories;
}

function add_image_URLS( $post ) 
{
	if(has_post_thumbnail($post['id']))
	{
		$image_URLs = array();

		$fullImgArray = wp_get_attachment_image_src( get_post_thumbnail_id( $post['id'] ), 'full' );
		$thumbImgArray = wp_get_attachment_image_src( get_post_thumbnail_id( $post['id'] ), 'thumbnail' );

		$image_URLs[] = array('fullImage'=>$fullImgArray[0], 'thumbImage'=>$thumbImgArray[0]);

		return $image_URLs;
	}
	else
	{
		return false;	
	}
}

function add_author_name($post)
{
	$author_data = array();

	$author_data['ID'] = $post['author'];
    $author_data['first_name'] = get_user_meta($post['author'], 'first_name', true);
    $author_data['last_name']  = get_user_meta($post['author'], 'last_name', true);

    return $author_data;
}

function add_post_tags($post)
{
	return wp_get_post_tags( $post['id']);
}



/* Code reuse, thanks to :
/*
Plugin Name: WP-REST-API V2 Menus
Version: 0.2
Description: Adding menus endpoints on WP REST API v2
Author: Claudio La Barbera
Author URI: http://www.claudiolabarbera.com
*/

/**
 * usage: http://irishtechnews.net/ITN3/ITN_menus/v1/menus
 * Get all registered menus
 * @return array List of menus with slug and description
 */
function get_all_menus () {
    $menus = [];
    foreach (get_registered_nav_menus() as $slug => $description) {
        $obj = new stdClass;
        $obj->slug = $slug;
        $obj->description = $description;
        $menus[] = $obj;
    }

    return $menus;
}

/**
 * Get menu's data from his id
 * @param  array $data WP REST API data variable
 * @return object Menu's data with his items
 */
function get_menu_data ( $data ) {
    $menu = new stdClass;
    $menu = wp_get_nav_menu_object( $data['id'] );
    $menu->items = wp_get_nav_menu_items($menu->term_id);

    $x = 0;
    foreach ($menu->items as $oneItem)
    {
        $oneItem->Shane = $x;
        $x++;
    }
    return $menu;
}

/**
 * Get x amount of posts from a menu
 * @param  array $data WP REST API data variable
 * @return object array of posts
 */
function get_home_page_data ( $data ) {
    $hpPosts = new stdClass;
    $hpPosts = wp_get_nav_menu_object( $data['id'] );
    $hpPosts->items = wp_get_nav_menu_items($hpPosts->term_id);

    
    foreach ($hpPosts->items as $oneItem)
    {
        $oneItem->Shane = $data['perCategory'];
    }
    return $hpPosts;
}




