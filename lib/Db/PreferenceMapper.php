<?php
/**
 * @author Frank de Lange
 * @copyright 2017 Frank de Lange
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OCA\Files_Reader\Db;

use OCA\Files_Reader\Utility\Time;
use OCP\IDBConnection;

class PreferenceMapper extends ReaderMapper {

    public function __construct(IDBConnection $db, $UserId, Time $time) {
        parent::__construct($db, 'reader_preferences', Preference::class, $time);
        $this->userId = $UserId;
    }

    /**
     * @brief get preferences for $scope+$fileId+$userId(+$name)
     *
     * @param string $scope
     * @param int $fileId
     * @param string $name
     * @return array
     */
    public function get($scope, $fileId, $name=null) {
        if(!empty($name)) {
            $sql = "SELECT * FROM `*PREFIX*reader_preferences` WHERE `scope`=? AND `file_id`=? AND `user_id`=? AND `name`=?";
            $args = array(
                $scope,
                $fileId,
                $this->userId,
                $name);
        } else {
            $sql = "SELECT * FROM `*PREFIX*reader_preferences` WHERE `scope`=? AND `file_id`=? AND `user_id`=?";
            $args = array(
                $scope,
                $fileId,
                $this->userId);
        }

        return $this->findEntities($sql, $args);
    }

    /**
     * @brief write preference to database
     *
     * @param string $scope
     * @param int $fileId
     * @param string $name
     * @param string $value
     *
     * @return Preference the newly created or updated preference
     */
    public function set($scope, $fileId, $name, $value) {

        $result = $this->get($scope, $fileId, $name);

        if(empty($result)) {

            $preference = new Preference();
            $preference->setScope($scope);
            $preference->setFileId($fileId);
            $preference->setUserId($this->userId);
            $preference->setName($name);
            $preference->setValue($value);

            $this->insert($preference);
        } else {
            $preference = $result[0];
            $preference->setValue($value);

            $this->update($preference);
        }

        return $preference;
    }

    /* currently not used*/
    public function deleteForFileId($fileId) {
        $sql = "SELECT * FROM `*PREFIX*reader_preferences` WHERE file_id=?";
        $args = [ $fileId ];
        array_map(
            function($entity) {
                $this->delete($entity);
            }, $this->findEntities($sql, $args)
        );
    }

    /* currently not used*/
    public function deleteForUserId($userId) {
        $sql = "SELECT * FROM `*PREFIX*reader_preferences` WHERE user_id=?";
        $args = [ $userId ];
        array_map(
            function($entity) {
                $this->delete($entity);
            }, $this->findEntities($sql, $args)
        );
    }
}
