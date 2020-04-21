<?php
/**
 * @author Frank de Lange
 * @copyright 2015 Frank de Lange
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OCA\Files_Reader\Db;

use OCP\AppFramework\Db\Entity;

class Bookmark extends ReaderEntity implements \JsonSerializable {

    protected $userId;  // user
    protected $fileId;  // book (identified by fileId) for which this mark is valid
    protected $type;    // type, defaults to "bookmark"
    protected $name;    // name, defaults to $location
    protected $value;   // bookmark value (format-specific, eg. page number for PDF, CFI for epub, etc)
    protected $content; // bookmark content (annotations etc), can be empty
    protected $lastModified;    // modification timestamp

    public function jsonSerialize() {
        return [ 
            'id' => $this->getId(),
            'userId' => $this->getUserId(),
            'fileId' => $this->getFileId(),
            'type' => $this->getType(),
            'name' => $this->getName(),
            'value' => static::conditional_json_decode($this->getValue()),
            'content' => static::conditional_json_decode($this->getContent()),
            'lastModified' => $this->getLastModified()
        ];
    }

    public function toService() {
        return [
            'name' => $this->getName(),
            'type' => $this->getType(),
            'value' => $this->conditional_json_decode($this->getValue()),
            'content' => $this->conditional_json_decode($this->getContent()),
            'lastModified' => $this->getLastModified(),
        ];
    }
}

