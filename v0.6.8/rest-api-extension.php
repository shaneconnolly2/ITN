<?php
/*
Plugin Name: Rest API Extension
Description: Plugin to add custom fields to the JSON responses
Author: Shane Connolly
Version: 2.1
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
    register_rest_route( 'ITN_api/v1', 
    	'/menus', 
    	array(
	        'methods' => 'GET',
	        'callback' => 'get_all_menus',
    	) 
    );

    register_rest_route( 'ITN_api/v1', 
    	'/menu', 
    	array(
	        'methods' => 'GET',
	        'callback' => 'get_menu_data',
    	) 
    );

    register_rest_route( 'ITN_api/v1', 
        '/homepage',//(?P<id>[a-zA-Z(-]+)',//' &perCategory=(?P<percategory>[a-z0-9 .\-]+)', 
        array(
            'methods' => 'GET',
            'callback' => 'get_home_page_data',
        ) 
    );

    register_rest_route( 'ITN_api/v1', 
        '/postsbycategories',
        array(
            'methods' => 'GET',
            'callback' => 'get_posts_by_categories',
        ) 
    );

    register_rest_route( 'ITN_api/v1', 
        '/categories',
        array(
            'methods' => 'GET',
            'callback' => 'get_all_categories',
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

		$fullImgArray = wp_get_attachment_image_src( get_post_thumbnail_id( $one_post->ID ), 'full' );
        $thumbImgArray = wp_get_attachment_image_src( get_post_thumbnail_id( $one_post->ID ), 'thumbnail' );
        $mediumImgArray = wp_get_attachment_image_src( get_post_thumbnail_id( $one_post->ID ), 'medium' );

        $image_URLs[] = array('fullImage'=>$fullImgArray[0], 'thumbImage'=>$thumbImgArray[0], 'mediumImage'=>$mediumImgArray[0]);

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
function get_menu_data ( $data ) 
{
     //Get the parameters supplied client side to the ajax call
    $parameters = $data->get_params();   

    $menu = new stdClass;
    $menu = wp_get_nav_menu_object( $parameters['menu'] );
    $menu->items = wp_get_nav_menu_items($menu->term_id);
    
    return $menu;
}

/**
 * Get $perCategory amount of posts from a menu of Categorgies
 * @param  array $data WP REST API data variable
 * @return object array of posts  WP_REST_Request
 */
function get_home_page_data ( $data ) 
{
    //Get the parameters supplied client side to the ajax call
    $parameters = $data->get_params();    

    //Set a default
    $perCategory = 4;
    if( isset( $parameters['percategory'] ))
    {
        $perCategory = (integer)$parameters['percategory'] ;
    }

    $hpPosts = new stdClass;
    $hpPosts = wp_get_nav_menu_object( $parameters['menu'] );
    $hpPosts->items = wp_get_nav_menu_items($hpPosts->term_id);    

    $posts_array = [];
    $curr_post_IDs = [];

    //Per Category found
    foreach ($hpPosts->items as $oneItem)
    {
        //Category ID
        $catID = (integer)$oneItem->object_id;

        $args = array(
            'posts_per_page'   => $perCategory,
            'offset'           => 0,
            'category'         => $catID,
            'category_name'    => '',
            'orderby'          => 'date',
            'order'            => 'DESC',
            'include'          => '',
            'exclude'          => '',
            'post__not_in'     => $curr_post_IDs,
            'meta_key'         => '',
            'meta_value'       => '',
            'post_type'        => 'post',
            'post_mime_type'   => '',
            'post_parent'      => '',
            'author'           => '',
            'author_name'      => '',
            'post_status'      => 'publish',
            'suppress_filters' => true 
        );

        //Get Posts from that Category
        $temp_array = get_posts( $args );

        //Per post in that Category
        foreach($temp_array as $one_post)
        {
            //Add the author data to each post
            $author_data = array();
            $author_data['ID'] = $one_post->post_author;

            $author_data['first_name'] = get_user_meta($one_post->post_author, 'first_name', true);
            $author_data['last_name']  = get_user_meta($one_post->post_author, 'last_name', true);

            $one_post->author_info = $author_data;

            //Add the Images
            if(has_post_thumbnail($one_post->ID))
            {
                $image_URLs = array();

                $fullImgArray = wp_get_attachment_image_src( get_post_thumbnail_id( $one_post->ID ), 'full' );
                $thumbImgArray = wp_get_attachment_image_src( get_post_thumbnail_id( $one_post->ID ), 'thumbnail' );
                $mediumImgArray = wp_get_attachment_image_src( get_post_thumbnail_id( $one_post->ID ), 'medium' );

                $image_URLs[] = array('fullImage'=>$fullImgArray[0], 'thumbImage'=>$thumbImgArray[0], 'mediumImage'=>$mediumImgArray[0]);

                $one_post->image_URLs = $image_URLs;
            }

            //Add Categories
            $post_categories = array();
            $categories = wp_get_post_terms( $one_post->ID, 'category', array('fields'=>'all') );

            foreach ($categories as $term) 
            {
                $term_link = get_term_link($term);
                if ( is_wp_error( $term_link ) ) 
                {
                    continue;
                }

                $post_categories[] = array('term_id'=>$term->term_id, 'name'=>$term->name, 'link'=>$term_link);
            }

            $one_post->post_categories = $post_categories;

            //Add Post Tags
            $one_post->post_tags = wp_get_post_tags( $one_post->ID);

            //Remove extraneous
            unset($one_post->post_author);
            unset($one_post->post_date_gmt);
            unset($one_post->post_excerpt);
            unset($one_post->comment_status);
            unset($one_post->ping_status);
            unset($one_post->post_password);
            unset($one_post->post_name);
            unset($one_post->to_ping);
            unset($one_post->pinged);
            unset($one_post->post_modified);
            unset($one_post->post_modified_gmt);
            unset($one_post->post_content_filtered);
            unset($one_post->post_parent);
            unset($one_post->guid);
            unset($one_post->menu_order);
            unset($one_post->post_type);
            unset($one_post->post_mime_type);
            unset($one_post->comment_count);
            unset($one_post->filter);

            //Change the array keys to values that we already are using from the WP posts schema
            $one_post->title = [ "rendered" => $one_post->post_title ,];
            unset($one_post->post_title);

            $one_post->content = [ "rendered" => $one_post->post_content ,];
            unset($one_post->post_content);

            //ISO8601 formatting
            $one_post->date = str_replace(" ", "T", (string)$one_post->post_date);
            unset($one_post->post_date);
            
            $temp = $one_post->ID;
            unset($one_post->ID);
            $one_post->id = $temp;

            //Flag to let us know which category we pulled this post from
            //Because posts can be in multiple categories and there is no proper
            //hierarchy set up
            $one_post->from_cat = get_cat_name($catID);
            $one_post->from_cat_ID = $catID;

            array_push($posts_array, $one_post);
            array_push($curr_post_IDs, $one_post->id);
        }               
    }   

    return $posts_array;        
}



/**
 * Get $perCategory amount of posts from an array of Category IDs
 * @param  array $data WP REST API data variable
 * @return object array of posts WP_REST_Request
 */
function get_posts_by_categories ( $data ) 
{
    //Get the parameters supplied client side to the ajax call
    $parameters = $data->get_params();    

    //Set a default
    $perCategory = 4;
    if( isset( $parameters['percategory'] ))
    {
        $perCategory = (integer)$parameters['percategory'] ;
    }

    if( isset( $parameters['arrayofids'] ))
    {
        $arrayOfIDs = $parameters['arrayofids'] ;
    }
    else
    {
        return;
    }     

    $posts_array = [];
    $curr_post_IDs = [];

    //Per Category found
    foreach ($arrayOfIDs as $oneID)
    {
        $args = array(
            'posts_per_page'   => $perCategory,
            'offset'           => 0,
            'category'         => $oneID,
            'category_name'    => '',
            'orderby'          => 'date',
            'order'            => 'DESC',
            'include'          => '',
            'exclude'          => '',
            'post__not_in'     => $curr_post_IDs,
            'meta_key'         => '',
            'meta_value'       => '',
            'post_type'        => 'post',
            'post_mime_type'   => '',
            'post_parent'      => '',
            'author'           => '',
            'author_name'      => '',
            'post_status'      => 'publish',
            'suppress_filters' => true 
        );

        //Get Posts from that Category
        $temp_array = get_posts( $args );

        //Per post in that Category
        foreach($temp_array as $one_post)
        {
            //Add the author data to each post
            $author_data = array();
            $author_data['ID'] = $one_post->post_author;

            $author_data['first_name'] = get_user_meta($one_post->post_author, 'first_name', true);
            $author_data['last_name']  = get_user_meta($one_post->post_author, 'last_name', true);

            $one_post->author_info = $author_data;

            //Add the Images
            if(has_post_thumbnail($one_post->ID))
            {
                $image_URLs = array();

                $fullImgArray = wp_get_attachment_image_src( get_post_thumbnail_id( $one_post->ID ), 'full' );
                $thumbImgArray = wp_get_attachment_image_src( get_post_thumbnail_id( $one_post->ID ), 'thumbnail' );
                $mediumImgArray = wp_get_attachment_image_src( get_post_thumbnail_id( $one_post->ID ), 'medium' );

                $image_URLs[] = array('fullImage'=>$fullImgArray[0], 'thumbImage'=>$thumbImgArray[0], 'mediumImage'=>$mediumImgArray[0]);

                $one_post->image_URLs = $image_URLs;
            }

            //Add Categories
            $post_categories = array();
            $categories = wp_get_post_terms( $one_post->ID, 'category', array('fields'=>'all') );

            foreach ($categories as $term) 
            {
                $term_link = get_term_link($term);
                if ( is_wp_error( $term_link ) ) 
                {
                    continue;
                }

                $post_categories[] = array('term_id'=>$term->term_id, 'name'=>$term->name, 'link'=>$term_link);
            }

            $one_post->post_categories = $post_categories;

            //Add Post Tags
            $one_post->post_tags = wp_get_post_tags( $one_post->ID);

            //Remove extraneous
            unset($one_post->post_author);
            unset($one_post->post_date_gmt);
            unset($one_post->post_excerpt);
            unset($one_post->comment_status);
            unset($one_post->ping_status);
            unset($one_post->post_password);
            unset($one_post->post_name);
            unset($one_post->to_ping);
            unset($one_post->pinged);
            unset($one_post->post_modified);
            unset($one_post->post_modified_gmt);
            unset($one_post->post_content_filtered);
            unset($one_post->post_parent);
            unset($one_post->guid);
            unset($one_post->menu_order);
            unset($one_post->post_type);
            unset($one_post->post_mime_type);
            unset($one_post->comment_count);
            unset($one_post->filter);

            //Change the array keys to values that we already are using from the WP posts schema
            $one_post->title = [ "rendered" => $one_post->post_title ,];
            unset($one_post->post_title);

            $one_post->content = [ "rendered" => $one_post->post_content ,];
            unset($one_post->post_content);

            //ISO8601 formatting
            $one_post->date = str_replace(" ", "T", (string)$one_post->post_date);
            unset($one_post->post_date);
            
            $temp = $one_post->ID;
            unset($one_post->ID);
            $one_post->id = $temp;

            //Flag to let us know which category we pulled this post from
            //Because posts can be in multiple categories and there is no proper
            //hierarchy set up
            $one_post->from_cat = get_cat_name($oneID);
            $one_post->from_cat_ID = $oneID;

            array_push($posts_array, $one_post);
            array_push($curr_post_IDs, $one_post->id);
        }               
    }   

    return $posts_array;        
}





/**
 * Get all the categories 
 * Native WP Route limits to 100 at time, we would prefer them all in one go
 * @param  array $data WP REST API data variable
 * @return object array of categores
 */
function get_all_categories ( $data ) 
{
    return get_categories( array(
        'orderby' => 'name',
        'order'   => 'ASC'
    ));
}




