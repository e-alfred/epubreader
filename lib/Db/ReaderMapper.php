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

use OCP\IDBConnection;
use OCP\AppFramework\Db\Mapper;
use OCP\AppFramework\Db\Entity;

use OCA\Files_Reader\Utility\Time;

abstract class ReaderMapper extends Mapper {

    /**
     * @var Time
     */
    private $time;

    public function __construct(IDBConnection $db, $table, $entity, Time $time) {
        parent::__construct($db, $table, $entity);
        $this->time = $time;
    }

    public function update(Entity $entity) {
        $entity->setLastModified($this->time->getMicroTime());
        return parent::update($entity);
    }

    public function insert(Entity $entity) {
        $entity->setLastModified($this->time->getMicroTime());
        return parent::insert($entity);
    }
} 
