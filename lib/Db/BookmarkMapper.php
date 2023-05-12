<?php
/**
 * @author Frank de Lange
 * @copyright 2017 Frank de Lange
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OCA\Epubreader\Db;


use OCP\IDBConnection;

use OCA\Epubreader\Utility\Time;

class BookmarkMapper extends ReaderMapper {

    private $userId;

    /**
     * @param IDbConnection $db
     * @param $UserId
     * @param Time $time
     */
    public function __construct(IDBConnection $db, $UserId, Time $time) {
        parent::__construct($db, 'reader_bookmarks', Bookmark::class, $time);
        /** @var int $UserId */
        $this->userId = $UserId;
    }

    /**
     * @brief get bookmarks for $fileId+$userId(+$name)
     * @param $fileId
     * @param string $name
     * @return array
     */
    public function get($fileId, $name, $type = null) {
    	$query = $this->db->getQueryBuilder();
    	$query->select('*')
            ->from($this->getTableName())
            ->where($query->expr()->eq('file_id', $query->createNamedParameter($fileId)))
            ->andWhere($query->expr()->eq('user_id', $query->createNamedParameter($this->userId)));

    	if ($type !== null) {
            $query->andWhere($query->expr()->eq('type', $query->createNamedParameter($type)));
    	}

    	if ($name !== null) {
       	    $query->andWhere($query->expr()->eq('name', $query->createNamedParameter($name)));
    	}

    	return $this->findEntities($query);
    }

    /**
     * @brief write bookmark to database
     *
     * @param int $fileId
     * @param string $name
     * @param string $value
     *
     * @return Bookmark the newly created or updated bookmark
     */
    public function set($fileId, $name, $value, $type, $content=null) {

        $result = $this->get($fileId, $name);

        if(empty($result)) {

            // anonymous bookmarks are named after their contents
            if (null === $name) {
                $name = $value;
            }

            // default type is "bookmark"
            if (null === $type) {
                $type = "bookmark";
            }

            $bookmark = new Bookmark();
            $bookmark->setFileId($fileId);
            $bookmark->setUserId($this->userId);
            $bookmark->setType($type);
            $bookmark->setName($name);
            $bookmark->setValue($value);
            $bookmark->setContent($content);

            $this->insert($bookmark);
        } else {
            $bookmark = $result[0];
            $bookmark->setValue($value);
            $bookmark->setContent($content);

            $this->update($bookmark);
        }

        return $bookmark;
    }

    /* currently not used */
    public function deleteForFileId($fileId) {
        $sql = "SELECT * FROM `*PREFIX*reader_bookmarks` WHERE file_id=?";
        $args = [ $fileId ];
        array_map(
            function($entity) {
                $this->delete($entity);
            }, $this->findEntities($sql, $args)
        );
    }

    /* currently not used */
    public function deleteForUserId($userId) {
        $sql = "SELECT * FROM `*PREFIX*reader_bookmarks` WHERE user_id=?";
        $args = [ $userId ];
        array_map(
            function($entity) {
                $this->delete($entity);
            }, $this->findEntities($sql, $args)
        );
    }
}
 
