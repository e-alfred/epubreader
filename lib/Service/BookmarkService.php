<?php
/**
 * @author Frank de Lange
 * @copyright 2017 Frank de Lange
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OCA\Files_Reader\Service;


use OCA\Files_Reader\Db\BookmarkMapper;

class BookmarkService extends Service {

    // "bookmark" name to use for the cursor (current reading position)
    const CURSOR = '__CURSOR__';
    const bookmark_type = 'bookmark';

    private $bookmarkMapper;
    private $userId;

    public function __construct(BookmarkMapper $bookmarkMapper, $UserId) {
        parent::__construct($bookmarkMapper);
        $this->bookmarkMapper = $bookmarkMapper;
        $this->userId = $UserId;
    }

    /**
     * @brief get bookmark
     *
     * bookmark type is format-dependent, eg CFI for epub, page number for CBR/CBZ, etc
     *
     * @param int $fileId
     * @param string $name
     *
     * @return array
     */
    public function get($fileId, $name=null, $type=null) {
        $result = $this->bookmarkMapper->get($fileId, $name, $type);
        return array_map(
            function($entity) {
                return $entity->toService();
            }, $result);
    }

    /**
     * @brief write bookmark
     *
     * position type is format-dependent, eg CFI for epub, page number for CBR/CBZ, etc
     *
     * @param int $fileId
     * @param string $name
     * @param string $value
     *
     * @return array
     */
    public function set($fileId, $name, $value, $type=null, $content=null) {
        return $this->bookmarkMapper->set($fileId, $name, $value, $type, $content);
    }

    /**
     * @brief get cursor (current position in book)
     *
     * @param int $fileId
     *
     * @return array
     */
    public function getCursor($fileId) {
        $result = $this->get($fileId, static::CURSOR);
        if (count($result) === 1) {
            return $result[0];
        }
    }

    /**
     * @brief set cursor (current position in book)
     *
     * @param int $fileId
     * @param string $value
     *
     * @return array
     */
    public function setCursor($fileId, $value) {
        return $this->bookmarkMapper->set($fileId, static::CURSOR, $value, static::bookmark_type);
    }

    /**
     * @brief delete bookmark
     *
     * @param int $fileId
     * @param string $name
     *
     */
    public function delete($fileId, $name, $type=null) {
        foreach ($this->bookmarkMapper->get($fileId, $name, $type) as $bookmark) {
            $this->bookmarkMapper->delete($bookmark);
        }
    }

    /**
     * @brief delete cursor
     *
     * @param int $fileId
     *
     */
    public function deleteCursor($fileId) {
        $this->delete($fileId, static::CURSOR, static::bookmark_type);
    }
}
 
