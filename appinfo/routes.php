<?php

/**
 * ownCloud - Files_Reader App
 *
 * @author Frank de Lange
 * @copyright 2015 Frank de Lange
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 */

$this->create('reader_personal_settings', 'ajax/personal.php')->actionInclude('files_reader/ajax/personal.php');

return ['routes' => [
    // Page
    ['name' => 'page#showReader', 'url' => '/', 'verb' => 'GET'],

    // Bookmarks
    ['name' => 'bookmark#get_cursor', 'url' => '/bookmark/cursor/{fileId}', 'verb' => 'GET'],
    ['name' => 'bookmark#set_cursor', 'url' => '/bookmark/cursor', 'verb' => 'POST'],
    ['name' => 'bookmark#delete_cursor', 'url' => '/bookmark/cursor/{fileId}', 'verb' => 'DELETE'],
    ['name' => 'bookmark#get', 'url' => '/bookmark/{fileId}/{name}', 'verb' => 'GET', 'defaults' => ['name' => '']],
    ['name' => 'bookmark#get', 'url' => '/bookmark/{fileId}/{type}/{name}', 'verb' => 'GET', 'defaults' => ['name' => '']],
    ['name' => 'bookmark#set', 'url' => '/bookmark', 'verb' => 'POST'],
    ['name' => 'bookmark#delete', 'url' => '/bookmark/{fileId}/{name}', 'verb' => 'DELETE'],

    // Metadata
    ['name' => 'metadata#get', 'url' => '/metadata/{fileId}/{name}', 'verb' => 'GET', 'defaults' => ['name' => '']],
    ['name' => 'metadata#set', 'url' => '/metadata/{fileId}/{name}/{value}', 'verb' => 'POST'],

    // Preferences
    ['name' => 'preference#get_default', 'url' => '/preference/default/{scope}/{name}', 'verb' => 'GET', 'defaults' => ['name' => '']],
    ['name' => 'preference#set_default', 'url' => '/preference/default', 'verb' => 'POST'],
    ['name' => 'preference#delete_default', 'url' => '/preference/default/{scope}/{name}', 'verb' => 'DELETE'],
    ['name' => 'preference#get', 'url' => '/preference/{fileId}/{scope}/{name}', 'verb' => 'GET', 'defaults' => ['name' => '']],
    ['name' => 'preference#set', 'url' => '/preference', 'verb' => 'POST'],
    ['name' => 'preference#delete', 'url' => '/preference/{fileId}/{scope}/{name}', 'verb' => 'DELETE'],
]];

