<?php
/**
 * @author Frank de Lange
 * @copyright 2017 Frank de Lange
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OCA\Files_Reader;

use OCP\IDBConnection;
use OCP\Files\Node;
use OCP\IUser;
use OCP\Util;
use \OC\User\User as User;

class Hooks {

    public static function register() {
        Util::connectHook('\OCP\Config', 'js', 'OCA\Files_Reader\Hooks', 'announce_settings');

        \OC::$server->getRootFolder()->listen('\OC\Files', 'preDelete', function (Node $node) {
            $fileId = $node->getId();
            $connection = \OC::$server->getDatabaseConnection();
            self::deleteFile($connection, $fileId);
        });
        \OC::$server->getUserManager()->listen('\OC\User', 'preDelete', function (User $user) {
            $userId = $user->getUID();
            $connection = \OC::$server->getDatabaseConnection();
            self::deleteUser($connection, $userId);
        });
    }

    public static function announce_settings(array $settings) {
        // Nextcloud encodes this as JSON, Owncloud does not (yet) (#75)
        // TODO: rmeove this when Owncloud starts encoding oc_appconfig as JSON just like it already encodes most other properties
        $isJson = self::isJson($settings['array']['oc_appconfig']);
        $array = ($isJson) ? json_decode($settings['array']['oc_appconfig'], true) : $settings['array']['oc_appconfig'];
        $array['filesReader']['enableEpub'] = Config::get('epub_enable', 'true');
        $array['filesReader']['enablePdf'] = Config::get('pdf_enable', 'true');
        $array['filesReader']['enableCbx'] = Config::get('cbx_enable', 'true');
        $settings['array']['oc_appconfig'] = ($isJson) ? json_encode($array) : $array;
    }

    protected static function deleteFile(IDBConnection $connection, $fileId) {
        $queryBuilder = $connection->getQueryBuilder();
        $queryBuilder->delete('reader_bookmarks')->where('file_id = :file_id')->setParameter(':file_id', $fileId);
        $queryBuilder->execute();

        $queryBuilder = $connection->getQueryBuilder();
        $queryBuilder->delete('reader_preferences')->where('file_id = :file_id')->setParameter(':file_id', $fileId); 
        $queryBuilder->execute();
    }

    protected static function deleteUser(IDBConnection $connection, $userId) {
        $queryBuilder = $connection->getQueryBuilder();
        $queryBuilder->delete('reader_bookmarks')->where('user_id = :user_id')->setParameter(':user_id', $userId);
        $queryBuilder->execute();

        $queryBuilder = $connection->getQueryBuilder();
        $queryBuilder->delete('reader_preferences')->where('user_id = :user_id')->setParameter(':user_id', $userId); 
        $queryBuilder->execute();
    }

    private static function isJson($string) {
        return is_string($string) && is_array(json_decode($string, true)) && (json_last_error() == JSON_ERROR_NONE) ? true : false;
    }
}
